"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  type CurrencyCode,
} from "@nexa/shared";
import { api } from "@/lib/api";
import { hasLocalAuthSession, useSession } from "@/lib/auth-client";

interface CurrencyContextValue {
  primaryCurrency: CurrencyCode;
  ratesDate: string | null;
  formatAmount: (amount: number, currency?: CurrencyCode) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  primaryCurrency: DEFAULT_CURRENCY,
  ratesDate: null,
  formatAmount: (amount, currency) =>
    formatMoney(amount, currency ?? DEFAULT_CURRENCY),
  isLoading: false,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["profile-currency"],
    queryFn: async () => {
      const profile = await api<{
        settings: { primaryCurrency: string };
      }>("/users/me");
      return profile.settings;
    },
    enabled: Boolean(session) || hasLocalAuthSession(),
    staleTime: 300_000,
  });

  const { data: ratesMeta } = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: () =>
      api<{ date: string | null; source: string }>("/currencies"),
    staleTime: 3600_000,
  });

  const value = useMemo<CurrencyContextValue>(() => {
    const primaryCurrency = (data?.primaryCurrency ??
      DEFAULT_CURRENCY) as CurrencyCode;
    return {
      primaryCurrency,
      ratesDate: ratesMeta?.date ?? null,
      formatAmount: (amount, currency) =>
        formatMoney(amount, currency ?? primaryCurrency),
      isLoading,
    };
  }, [data, ratesMeta, isLoading]);

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
