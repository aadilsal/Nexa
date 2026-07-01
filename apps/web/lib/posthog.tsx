"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

let posthogInitialized = false;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || posthogInitialized) return;

    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
      capture_pageview: false,
    });
    posthogInitialized = true;
  }, []);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.capture("$pageview", { path: pathname });
    }
  }, [pathname]);

  return <>{children}</>;
}

export function captureEvent(
  name: string,
  properties?: Record<string, string | number | boolean>,
) {
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.capture(name, properties);
  }
}
