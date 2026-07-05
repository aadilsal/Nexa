import { z } from "zod";

/** Currencies available in the app (rates fetched live from USD hub). */
export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "PKR",
  "AED",
  "SAR",
  "CAD",
  "AUD",
  "INR",
  "CNY",
  "JPY",
  "CHF",
  "SGD",
  "MYR",
  "TRY",
  "QAR",
  "KWD",
  "BHD",
  "OMR",
  "NZD",
  "HKD",
  "SEK",
  "NOK",
  "DKK",
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const CurrencySchema = z.enum(SUPPORTED_CURRENCIES);

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export const EXCHANGE_RATE_BASE = "USD" as const;

/**
 * Convert using rates where each value is units of that currency per 1 USD.
 * e.g. ratesPerUsd.PKR = 278 means 1 USD = 278 PKR.
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  ratesPerUsd: Record<string, number>,
): number {
  if (from === to) return amount;
  const fromRate = ratesPerUsd[from];
  const toRate = ratesPerUsd[to];
  if (!fromRate || !toRate || fromRate <= 0 || toRate <= 0) {
    return amount;
  }
  const inUsd = amount / fromRate;
  return Math.round(inUsd * toRate);
}

export function normalizeCurrency(
  value: string | null | undefined,
  fallback: CurrencyCode = DEFAULT_CURRENCY,
): CurrencyCode {
  const parsed = CurrencySchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}

export function formatMoney(amount: number, currency: CurrencyCode): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  PKR: "Pakistani Rupee",
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  AED: "UAE Dirham",
  SAR: "Saudi Riyal",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  INR: "Indian Rupee",
  CNY: "Chinese Yuan",
  JPY: "Japanese Yen",
  CHF: "Swiss Franc",
  SGD: "Singapore Dollar",
  MYR: "Malaysian Ringgit",
  TRY: "Turkish Lira",
  QAR: "Qatari Riyal",
  KWD: "Kuwaiti Dinar",
  BHD: "Bahraini Dinar",
  OMR: "Omani Rial",
  NZD: "New Zealand Dollar",
  HKD: "Hong Kong Dollar",
  SEK: "Swedish Krona",
  NOK: "Norwegian Krone",
  DKK: "Danish Krone",
};

const LOCALE_CURRENCY_MAP: Record<string, CurrencyCode> = {
  US: "USD",
  GB: "GBP",
  PK: "PKR",
  AE: "AED",
  SA: "SAR",
  CA: "CAD",
  AU: "AUD",
  IN: "INR",
  CN: "CNY",
  JP: "JPY",
  CH: "CHF",
  SG: "SGD",
  MY: "MYR",
  TR: "TRY",
  QA: "QAR",
  KW: "KWD",
  BH: "BHD",
  OM: "OMR",
  NZ: "NZD",
  HK: "HKD",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
};

/** Guess a sensible default currency from a BCP-47 locale (e.g. en-US). */
export function guessCurrencyFromLocale(locale?: string): CurrencyCode {
  if (!locale) return DEFAULT_CURRENCY;

  const parts = locale.replace("_", "-").split("-");
  const region = parts[1]?.toUpperCase();
  if (region && LOCALE_CURRENCY_MAP[region]) {
    return LOCALE_CURRENCY_MAP[region];
  }

  return DEFAULT_CURRENCY;
}
