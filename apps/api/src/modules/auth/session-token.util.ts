import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
] as const;

function getBearerToken(authHeader?: string): string | null {
  if (!authHeader?.toLowerCase().startsWith("bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token || null;
}

function base64UrlToBuffer(value: string): Buffer {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function splitSignedValue(value: string): { token: string; signature: string } | null {
  const dot = value.indexOf(".");
  if (dot <= 0) return null;
  const token = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  if (!token || !signature) return null;
  return { token, signature };
}

function verifySignedValue(value: string, secret: string): string | null {
  const decoded = value.includes("%") ? decodeURIComponent(value) : value;
  const parts = splitSignedValue(decoded);
  if (!parts) return decoded;

  const expected = createHmac("sha256", secret)
    .update(parts.token)
    .digest("base64url")
    .replace(/=/g, "");

  try {
    const actual = base64UrlToBuffer(parts.signature);
    const expectedBuf = base64UrlToBuffer(expected);
    if (
      actual.length !== expectedBuf.length ||
      !timingSafeEqual(actual, expectedBuf)
    ) {
      return null;
    }
    return parts.token;
  } catch {
    return null;
  }
}

function resolveSessionToken(raw: string, secret: string): string | null {
  const unsigned = verifySignedValue(raw, secret);
  if (unsigned) return unsigned;
  return raw.includes(".") ? null : raw;
}

export async function extractSessionToken(
  headers: { authorization?: string },
  cookies: Record<string, string | undefined>,
  secret: string,
): Promise<string | null> {
  const bearer = getBearerToken(headers.authorization);
  if (bearer) {
    return resolveSessionToken(bearer, secret);
  }

  for (const name of SESSION_COOKIE_NAMES) {
    const raw = cookies[name];
    if (!raw) continue;
    const token = resolveSessionToken(raw, secret);
    if (token) return token;
  }

  return null;
}
