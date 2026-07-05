"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AnalyticsProvider } from "@nexa/analytics/react";
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
      <AnalyticsProvider apiUrl={apiUrl}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster />
        </QueryClientProvider>
      </AnalyticsProvider>
    </ThemeProvider>
  );
}
