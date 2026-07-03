import type { AnalyticsEventPayload } from "../taxonomy/events.js";
import { sanitizeProperties } from "../privacy-guard.js";

const BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 10_000;

let apiUrl = "";
let sessionId = "";
let signKey = "";
let initialized = false;
const queue: AnalyticsEventPayload[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  if (!sessionId) {
    sessionId =
      sessionStorage.getItem("nexa_analytics_session") ??
      crypto.randomUUID();
    sessionStorage.setItem("nexa_analytics_session", sessionId);
  }
  return sessionId;
}

function detectBrowser(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Other";
}

function detectOs(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Win")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Other";
}

export function initAnalytics(url: string): void {
  if (typeof window === "undefined" || initialized) return;
  apiUrl = url.replace(/\/$/, "");
  initialized = true;
  getSessionId();

  void fetchSignKey();

  track("session_started");

  flushTimer = setInterval(() => {
    void flush();
  }, FLUSH_INTERVAL_MS);

  window.addEventListener("beforeunload", () => {
    track("session_ended");
    void flush(true);
  });

  window.addEventListener("error", (event) => {
    track("error_occurred", {
      message: event.message?.slice(0, 200) ?? "unknown",
      source: "frontend",
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const message =
      event.reason instanceof Error
        ? event.reason.message
        : String(event.reason);
    track("error_occurred", {
      message: message.slice(0, 200),
      source: "frontend_promise",
    });
  });
}

export function track(
  event: string,
  properties?: Record<string, string | number | boolean | null>,
): void {
  if (typeof window === "undefined") return;

  const payload: AnalyticsEventPayload = {
    event,
    properties: sanitizeProperties(properties),
    route: window.location.pathname,
    referrer: document.referrer || undefined,
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.1",
    platform: "web",
    browser: detectBrowser(),
    os: detectOs(),
    deviceType: /Mobi|Android/i.test(navigator.userAgent)
      ? "mobile"
      : "desktop",
    sessionId: getSessionId(),
    timestamp: new Date().toISOString(),
  };

  queue.push(payload);

  if (queue.length >= BATCH_SIZE) {
    void flush();
  }
}

export async function flush(useBeacon = false): Promise<void> {
  if (!apiUrl || queue.length === 0) return;

  const events = [...queue];
  queue.length = 0;

  const body = JSON.stringify({ events });
  const url = `${apiUrl}/analytics/events/batch`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (signKey) {
    headers["x-analytics-signature"] = await hmacSha256Hex(signKey, body);
  }

  try {
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      return;
    }

    await fetch(url, {
      method: "POST",
      credentials: "include",
      headers,
      body,
    });
  } catch {
    queue.unshift(...events);
  }
}

async function fetchSignKey(): Promise<void> {
  try {
    const res = await fetch(`${apiUrl}/analytics/sign-key`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = (await res.json()) as { key?: string };
      signKey = data.key ?? "";
    }
  } catch {
    // optional in dev
  }
}

async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function trackPageView(path: string): void {
  track("page_viewed", { path });
}
