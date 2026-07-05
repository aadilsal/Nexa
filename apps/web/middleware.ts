import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOGIN_LIMIT = 5;
const WINDOW_MS = 60_000;

const hits = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isAuthSignIn(pathname: string, method: string): boolean {
  if (method !== "POST") return false;
  return (
    pathname.startsWith("/api/auth/sign-in") ||
    pathname.startsWith("/api/auth/sign-up") ||
    pathname.includes("/sign-in/email") ||
    pathname.includes("/sign-up/email")
  );
}

export function middleware(request: NextRequest) {
  if (!isAuthSignIn(request.nextUrl.pathname, request.method)) {
    return NextResponse.next();
  }

  const ip = getClientIp(request);
  const key = `auth:${ip}`;
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now >= entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.next();
  }

  entry.count += 1;
  if (entry.count > LOGIN_LIMIT) {
    return NextResponse.json(
      { error: "Too many sign-in attempts — try again in a minute" },
      { status: 429 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*"],
};
