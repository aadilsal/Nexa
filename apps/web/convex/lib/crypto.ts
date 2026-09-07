// AES-256-GCM envelope encryption (KEK -> DEK -> data), ported from the old
// apps/api/src/common/encryption/encryption.service.ts to Convex's default runtime,
// which exposes the standard Web Crypto API (crypto.subtle) instead of Node's `crypto`.
//
// Confirmed by a standalone spike (see project plan, Phase 1 step 2) that ciphertext
// produced by Node's `crypto` and by `crypto.subtle` are interoperable once the auth tag
// is reordered: Node's wire format is `iv(12) || authTag(16) || ciphertext`, Web Crypto
// wants `ciphertext || authTag(16)` as the single input/output buffer for AES-GCM. This
// module keeps writing the Node-style wire format (iv || authTag || ciphertext) for
// storage, so ciphertext migrated from the old Postgres database (Phase 3) is byte-for-byte
// compatible with what this module reads.
//
// CRITICAL RULE (do not violate): encryption requires a fresh, unpredictable IV every call.
// Convex `query`/`mutation` functions must be deterministic (the platform replays them on
// OCC conflicts), so their randomness is explicitly NOT cryptographically safe. Every
// function in this file that generates a new IV (encrypt, wrapDek, generateDek) must only
// ever be called from an `action`. Decryption is deterministic and safe to call from
// query/mutation/action alike.

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const AUTH_TAG_BITS = AUTH_TAG_LENGTH * 8;

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time comparison of two equal-length hex strings (password/recovery-code hashes). */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function importAesKey(
  rawBytes: Uint8Array,
  usages: KeyUsage[],
): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", rawBytes as unknown as BufferSource, { name: "AES-GCM" }, false, usages);
}

/**
 * Reads the KEK from Convex's own environment store (set via `npx convex env set KEK ...`,
 * never from this repo's .env file). Throws loudly if missing or malformed — no dev-fallback
 * derived key. A silently-used well-known fallback key was a real finding in the security
 * audit of the old system; this rewrite does not repeat it.
 */
async function getKekKey(): Promise<CryptoKey> {
  const hex = process.env.KEK;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "KEK is not set (or is not a 64-char hex string) in this Convex deployment's environment. " +
        "Set it with `npx convex env set KEK <64-hex-chars>` — there is no dev fallback.",
    );
  }
  return importAesKey(hexToBytes(hex), ["encrypt", "decrypt"]);
}

/** ACTIONS ONLY — generates 32 random bytes for a new DEK. */
export function generateDek(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/** ACTIONS ONLY — fresh IV per call. */
async function encryptRaw(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const plaintextBytes = new TextEncoder().encode(plaintext);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, tagLength: AUTH_TAG_BITS },
      key,
      plaintextBytes,
    ),
  );
  // Web Crypto output: ciphertext || authTag. Reorder to the storage format: iv || authTag || ciphertext.
  const ciphertext = encrypted.subarray(0, encrypted.length - AUTH_TAG_LENGTH);
  const authTag = encrypted.subarray(encrypted.length - AUTH_TAG_LENGTH);
  const out = new Uint8Array(IV_LENGTH + AUTH_TAG_LENGTH + ciphertext.length);
  out.set(iv, 0);
  out.set(authTag, IV_LENGTH);
  out.set(ciphertext, IV_LENGTH + AUTH_TAG_LENGTH);
  return bytesToBase64(out);
}

/** Safe anywhere (query/mutation/action) — deterministic. */
async function decryptRaw(payloadB64: string, key: CryptoKey): Promise<string> {
  const buf = base64ToBytes(payloadB64);
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  // Web Crypto wants: ciphertext || authTag as one input buffer.
  const webCryptoInput = new Uint8Array(ciphertext.length + AUTH_TAG_LENGTH);
  webCryptoInput.set(ciphertext, 0);
  webCryptoInput.set(authTag, ciphertext.length);

  const plaintextBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource, tagLength: AUTH_TAG_BITS },
    key,
    webCryptoInput,
  );
  return new TextDecoder().decode(plaintextBuf);
}

/** ACTIONS ONLY. Wraps a raw DEK under the KEK. */
export async function wrapDek(dek: Uint8Array): Promise<string> {
  const kek = await getKekKey();
  // encryptRaw expects a string; encode the raw DEK bytes as base64 first, wrap that string.
  return encryptRaw(bytesToBase64(dek), kek);
}

/** Safe anywhere. Unwraps the DEK, returns raw bytes (caller imports as a CryptoKey). */
export async function unwrapDek(wrappedDek: string): Promise<Uint8Array> {
  const kek = await getKekKey();
  const dekB64 = await decryptRaw(wrappedDek, kek);
  return base64ToBytes(dekB64);
}

/** Imports raw DEK bytes as a CryptoKey usable by encrypt/decrypt below. */
export async function importDek(
  dekBytes: Uint8Array,
  usages: KeyUsage[] = ["encrypt", "decrypt"],
): Promise<CryptoKey> {
  return importAesKey(dekBytes, usages);
}

/** ACTIONS ONLY. */
export async function encrypt(plaintext: string, dek: CryptoKey): Promise<string> {
  return encryptRaw(plaintext, dek);
}

/** Safe anywhere. */
export async function decrypt(payload: string, dek: CryptoKey): Promise<string> {
  return decryptRaw(payload, dek);
}

/** ACTIONS ONLY. */
export async function encryptNumber(value: number, dek: CryptoKey): Promise<string> {
  return encryptRaw(String(value), dek);
}

/** Safe anywhere. Matches the old service's `parseInt` truncation behavior intentionally
 *  (amounts are stored as whole PKR, never fractional). */
export async function decryptNumber(payload: string, dek: CryptoKey): Promise<number> {
  return parseInt(await decryptRaw(payload, dek), 10);
}

/** ACTIONS ONLY. */
export async function encryptJson<T>(value: T, dek: CryptoKey): Promise<string> {
  return encryptRaw(JSON.stringify(value), dek);
}

/** Safe anywhere. */
export async function decryptJson<T>(payload: string, dek: CryptoKey): Promise<T> {
  return JSON.parse(await decryptRaw(payload, dek)) as T;
}

/** Safe anywhere — deterministic. Used by the ledger hash chain (convex/ledger.ts). */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
