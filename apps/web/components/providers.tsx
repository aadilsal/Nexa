"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider } from "convex/react";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { convex } from "@/lib/convex-client";
import { SessionProvider } from "@/lib/session";
import { registerServiceWorker } from "@/lib/push-client";
import { ChunkErrorHandler } from "./chunk-error-handler";
import { NavigationProgress } from "./navigation-progress";

export function Providers({ children }: { children: React.ReactNode }) {
  // Push notifications need the service worker registered on every load.
  useEffect(() => {
    void registerServiceWorker();
  }, []);

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

  return (
    <>
      <ChunkErrorHandler />
      <NavigationProgress />
      <ConvexProvider client={convex}>
        <SessionProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            <Toaster />
          </QueryClientProvider>
        </SessionProvider>
      </ConvexProvider>
    </>
  );
}
