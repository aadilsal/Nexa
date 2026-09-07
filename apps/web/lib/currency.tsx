"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { DEFAULT_CURRENCY, formatMoney, type CurrencyCode } from "@nexa/shared";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/session";

interface CurrencyContextValue {
  primaryCurrency: CurrencyCode;
  ratesDate: string | null;
  formatAmount: (amount: number, currency?: CurrencyCode) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  primaryCurrency: DEFAULT_CURRENCY,
  ratesDate: null,
  formatAmount: (amount, currency) => formatMoney(amount, currency ?? DEFAULT_CURRENCY),
  isLoading: false,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { token } = useSession();
  const settings = useQuery(api.settings.get, token ? { sessionToken: token } : "skip");
  const rates = useQuery(api.currencies.getRates, token ? { sessionToken: token } : "skip");

  const value = useMemo<CurrencyContextValue>(() => {
    const primaryCurrency = (settings?.primaryCurrency ?? DEFAULT_CURRENCY) as CurrencyCode;
    return {
      primaryCurrency,
      ratesDate: null,
      formatAmount: (amount, currency) => formatMoney(amount, currency ?? primaryCurrency),
      isLoading: token != null && settings === undefined,
    };
  }, [settings, token]);

  void rates;
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
