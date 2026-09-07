import { bytesToHex } from "./crypto";

// PBKDF2-SHA256 rather than argon2id/bcrypt: Web Crypto's `deriveBits` supports PBKDF2
// natively in Convex's default runtime (no "use node" action needed, so login stays fast).
// This is a deliberate trade-off for a single-user app: the realistic threat here is online
// guessing against the login action (throttled by lib/ratelimit.ts), not offline cracking of
// a stolen hash, since an attacker with DB access already has the KEK-protected financial
// data as the bigger prize. A high iteration count (600k, OWASP's current PBKDF2-HMAC-SHA256
// baseline) still makes offline cracking expensive if ever needed.
export const DEFAULT_PBKDF2_ITERATIONS = 600_000;

export async function hashPassword(
  password: string,
  saltBytes: Uint8Array,
  iterations: number,
): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes as unknown as BufferSource, iterations, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

/** ACTIONS ONLY — real entropy needed. */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/** ACTIONS ONLY. 10 chars from an ambiguity-free alphabet (no 0/O/1/I/L), grouped for readability. */
export function generateRecoveryCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]);
  return `${chars.slice(0, 5).join("")}-${chars.slice(5).join("")}`;
}
