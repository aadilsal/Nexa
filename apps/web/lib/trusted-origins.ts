import { expandTrustedOrigins } from "@nexa/shared";

export function getPrimaryAppOrigin(): string {
  const origins = expandTrustedOrigins(
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  );

  return origins[0] ?? "http://localhost:3000";
}

export function getTrustedOrigins(): string[] {
  return expandTrustedOrigins(
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL,
    process.env.TRUSTED_ORIGINS,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  );
}
