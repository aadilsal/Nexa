"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initAnalytics, trackPageView } from "../client/nexa-analytics.js";

export function AnalyticsProvider({
  children,
  apiUrl,
}: {
  children: React.ReactNode;
  apiUrl: string;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (apiUrl) initAnalytics(apiUrl);
  }, [apiUrl]);

  useEffect(() => {
    if (pathname) trackPageView(pathname);
  }, [pathname]);

  return <>{children}</>;
}

export { track, flush } from "../client/nexa-analytics.js";
