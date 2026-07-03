import { createHmac, timingSafeEqual } from "crypto";

export function signAnalyticsPayload(body: string): string {
  const secret = process.env.ANALYTICS_EVENT_SIGNING_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ANALYTICS_EVENT_SIGNING_SECRET must be set in production");
    }
    return "";
  }
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function verifyAnalyticsSignature(
  body: string,
  signature: string | undefined,
): boolean {
  const secret = process.env.ANALYTICS_EVENT_SIGNING_SECRET;
  if (!secret) return true; // dev mode — skip verification
  if (!signature) return false;

  const expected = signAnalyticsPayload(body);
  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex"),
    );
  } catch {
    return false;
  }
}
