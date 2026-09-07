import { v } from "convex/values";
import { query, action, internalAction, internalQuery, internalMutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  SUPPORTED_CURRENCIES,
  EXCHANGE_RATE_BASE,
  convertCurrency,
  normalizeCurrency,
  type CurrencyCode,
} from "@nexa/shared";
import { requireSession } from "./lib/session";
import { getSettingsRow } from "./settings";

// Ported from apps/api/src/common/currency/{currency,exchange-rates}.service.ts. The old
// Redis 1hr TTL cache becomes a singleton `exchangeRatesCache` row, refreshed by a daily
// cron (see crons.ts) and lazily on-demand if it's ever gone stale/missing.

const FRANKFURTER_URL = "https://api.frankfurter.app/latest?from=USD";

/** Last-resort static rates (units per 1 USD) if the API and cache are both unavailable. */
const FALLBACK_RATES_PER_USD: Record<CurrencyCode, number> = {
  PKR: 278, USD: 1, EUR: 0.92, GBP: 0.79, AED: 3.67, SAR: 3.75, CAD: 1.36, AUD: 1.52,
  INR: 83, CNY: 7.24, JPY: 149, CHF: 0.88, SGD: 1.34, MYR: 4.72, TRY: 32, QAR: 3.64,
  KWD: 0.31, BHD: 0.38, OMR: 0.38, NZD: 1.64, HKD: 7.82, SEK: 10.5, NOK: 10.6, DKK: 6.87,
};

export const _getCacheRaw = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("exchangeRatesCache").first(),
});

export const _upsertCache = internalMutation({
  args: { ratesPerUsd: v.record(v.string(), v.number()), date: v.union(v.string(), v.null()) },
  handler: async (ctx, { ratesPerUsd, date }) => {
    const existing = await ctx.db.query("exchangeRatesCache").first();
    const row = { ratesPerUsd, date, fetchedAt: Date.now() };
    if (existing) await ctx.db.patch(existing._id, row);
    else await ctx.db.insert("exchangeRatesCache", row);
  },
});

/** INTERNAL ACTION — the only place allowed to call an external API. */
export const _fetchRates = internalAction({
  args: {},
  handler: async () => {
    try {
      const response = await fetch(FRANKFURTER_URL, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`Frankfurter API returned ${response.status}`);
      const data = (await response.json()) as { date: string; rates: Record<string, number> };

      const ratesPerUsd: Record<string, number> = { USD: 1 };
      for (const code of SUPPORTED_CURRENCIES) {
        if (code === "USD") continue;
        const rate = data.rates[code];
        ratesPerUsd[code] = rate && rate > 0 ? rate : FALLBACK_RATES_PER_USD[code];
      }
      return { ratesPerUsd, date: data.date };
    } catch {
      return { ratesPerUsd: { ...FALLBACK_RATES_PER_USD }, date: null };
    }
  },
});

/** Public entry point the frontend calls to trigger + persist a refresh. */
export const refresh = action({
  args: {},
  handler: async (ctx): Promise<{ ok: true }> => {
    await ctx.runAction(internal.currencies._fetchRatesAndCache, {});
    return { ok: true };
  },
});

/** Used by crons.ts (fetch + persist in one call). */
export const _fetchRatesAndCache = internalAction({
  args: {},
  handler: async (ctx) => {
    const { ratesPerUsd, date } = await ctx.runAction(internal.currencies._fetchRates, {});
    await ctx.runMutation(internal.currencies._upsertCache, { ratesPerUsd, date });
  },
});

export interface CurrencyContext {
  primaryCurrency: CurrencyCode;
  ratesPerUsd: Record<string, number>;
}

/** Safe in query/mutation contexts — reads the cache row, never fetches live. */
export async function getCurrencyContext(ctx: QueryCtx | MutationCtx): Promise<CurrencyContext> {
  const settings = await getSettingsRow(ctx);
  const cache = await ctx.db.query("exchangeRatesCache").first();
  return {
    primaryCurrency: normalizeCurrency(settings.primaryCurrency),
    ratesPerUsd: cache?.ratesPerUsd ?? FALLBACK_RATES_PER_USD,
  };
}

export function toPrimary(amount: number, currency: string | null | undefined, ctx: CurrencyContext): number {
  const from = normalizeCurrency(currency, ctx.primaryCurrency);
  return convertCurrency(amount, from, ctx.primaryCurrency, ctx.ratesPerUsd);
}

export const list = query({
  args: {},
  handler: async () => SUPPORTED_CURRENCIES,
});

export const getRates = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireSession(ctx, sessionToken);
    return getCurrencyContext(ctx);
  },
});

export { EXCHANGE_RATE_BASE };
