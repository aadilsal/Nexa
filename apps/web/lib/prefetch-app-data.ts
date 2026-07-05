import type { QueryClient } from "@tanstack/react-query";
import { api } from "./api";

const STALE = {
  onboarding: 120_000,
  dashboard: 300_000,
  transactions: 120_000,
} as const;

export function prefetchAppData(queryClient: QueryClient) {
  return Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ["onboarding-status"],
      queryFn: () => api<{ complete: boolean }>("/onboarding/status"),
      staleTime: STALE.onboarding,
    }),
    queryClient.prefetchQuery({
      queryKey: ["dashboard"],
      queryFn: () => api("/dashboard"),
      staleTime: STALE.dashboard,
    }),
    queryClient.prefetchQuery({
      queryKey: ["transactions"],
      queryFn: () => api("/transactions"),
      staleTime: STALE.transactions,
    }),
  ]);
}

export { STALE as APP_QUERY_STALE };
