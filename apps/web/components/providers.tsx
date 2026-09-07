"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider } from "convex/react";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AnalyticsProvider } from "@nexa/analytics/react";
import { convex } from "@/lib/convex-client";
import { SessionProvider } from "@/lib/session";
import { ChunkErrorHandler } from "./chunk-error-handler";
import { NavigationProgress } from "./navigation-progress";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 120_000,
            gcTime: 600_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ChunkErrorHandler />
      <NavigationProgress />
      <ConvexProvider client={convex}>
        <SessionProvider>
          <AnalyticsProvider apiUrl={apiUrl}>
            <QueryClientProvider client={queryClient}>
              {children}
              <Toaster />
            </QueryClientProvider>
          </AnalyticsProvider>
        </SessionProvider>
      </ConvexProvider>
    </ThemeProvider>
  );
}
