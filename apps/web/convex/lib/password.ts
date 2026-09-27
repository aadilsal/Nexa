// Login is TOTP-only (see convex/auth.ts); password hashing was removed. Only the
// recovery-code generator remains here.

/** ACTIONS ONLY. 10 chars from an ambiguity-free alphabet (no 0/O/1/I/L), grouped for readability. */
export function generateRecoveryCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]);
  return `${chars.slice(0, 5).join("")}-${chars.slice(5).join("")}`;
}
