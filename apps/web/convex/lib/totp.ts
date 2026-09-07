// RFC 6238 TOTP (HMAC-SHA1, 30s step, 6 digits) — standard, compatible with Google
// Authenticator / Authy / any RFC-compliant authenticator app. HMAC-SHA1 is the TOTP
// spec's required algorithm for broad app compatibility; it is not used anywhere else
// in this codebase for anything security-load-bearing beyond this narrow, spec-mandated role.

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(bytes: Uint8Array): string {
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  let output = "";
  let i = 0;
  for (; i + 5 <= bits.length; i += 5) {
    output += BASE32_ALPHABET[parseInt(bits.substring(i, i + 5), 2)];
  }
  const remainder = bits.length - i;
  if (remainder > 0) {
    const lastChunk = bits.substring(i).padEnd(5, "0");
    output += BASE32_ALPHABET[parseInt(lastChunk, 2)];
  }
  return output;
}

function base32Decode(encoded: string): Uint8Array {
  const clean = encoded.toUpperCase().replace(/=+$/, "");
  let bits = "";
  for (const char of clean) {
    const val = BASE32_ALPHABET.indexOf(char);
    if (val === -1) throw new Error("Invalid base32 character in TOTP secret");
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
}

async function hotp(secretBytes: Uint8Array, counter: number): Promise<string> {
  const counterBuf = new ArrayBuffer(8);
  new DataView(counterBuf).setUint32(4, counter, false); // low 32 bits, big-endian; high 32 bits stay 0

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const hmac = new Uint8Array(await crypto.subtle.sign("HMAC", key, counterBuf));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (binCode % 1_000_000).toString().padStart(6, "0");
}

export function generateTotpSecret(): string {
  return base32Encode(crypto.getRandomValues(new Uint8Array(20))); // 160-bit, standard size
}

export async function verifyTotp(
  secretBase32: string,
  code: string,
  forTime = Date.now(),
): Promise<boolean> {
  const secretBytes = base32Decode(secretBase32);
  const counter = Math.floor(forTime / 1000 / 30);
  // Allow +/-1 step (30s) of clock drift between server and the user's phone.
  for (const delta of [0, -1, 1]) {
    if ((await hotp(secretBytes, counter + delta)) === code) return true;
  }
  return false;
}

export function buildOtpAuthUri(secretBase32: string, accountLabel: string, issuer: string): string {
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountLabel)}?${params.toString()}`;
}
