import { Injectable, Logger } from "@nestjs/common";
import {
  EXCHANGE_RATE_BASE,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
} from "@nexa/shared";
import { RedisService } from "../redis/redis.service";

const CACHE_KEY = "exchange_rates:usd";
const CACHE_TTL_SECONDS = 3600;
const FRANKFURTER_URL = "https://api.frankfurter.app/latest?from=USD";

/** Last-resort static rates (units per 1 USD) if API and cache are unavailable. */
const FALLBACK_RATES_PER_USD: Record<CurrencyCode, number> = {
  PKR: 278,
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  SAR: 3.75,
  CAD: 1.36,
  AUD: 1.52,
  INR: 83,
  CNY: 7.24,
  JPY: 149,
  CHF: 0.88,
  SGD: 1.34,
  MYR: 4.72,
  TRY: 32,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.38,
  OMR: 0.38,
  NZD: 1.64,
  HKD: 7.82,
  SEK: 10.5,
  NOK: 10.6,
  DKK: 6.87,
};

interface FrankfurterResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface LiveExchangeRates {
  base: typeof EXCHANGE_RATE_BASE;
  date: string | null;
  ratesPerUsd: Record<string, number>;
  source: "live" | "cache" | "fallback";
}

@Injectable()
export class ExchangeRatesService {
  private readonly logger = new Logger(ExchangeRatesService.name);

  constructor(private readonly redis: RedisService) {}

  async getRates(): Promise<LiveExchangeRates> {
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as LiveExchangeRates;
      return { ...parsed, source: "cache" };
    }

    try {
      const response = await fetch(FRANKFURTER_URL, {
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        throw new Error(`Frankfurter API returned ${response.status}`);
      }

      const data = (await response.json()) as FrankfurterResponse;
      const ratesPerUsd: Record<string, number> = { USD: 1 };

      for (const code of SUPPORTED_CURRENCIES) {
        if (code === "USD") continue;
        const rate = data.rates[code];
        if (rate && rate > 0) {
          ratesPerUsd[code] = rate;
        } else {
          ratesPerUsd[code] = FALLBACK_RATES_PER_USD[code];
        }
      }

      const payload: LiveExchangeRates = {
        base: EXCHANGE_RATE_BASE,
        date: data.date,
        ratesPerUsd,
        source: "live",
      };

      await this.redis.set(CACHE_KEY, JSON.stringify(payload), CACHE_TTL_SECONDS);
      return payload;
    } catch (err) {
      this.logger.warn(
        `Live exchange rate fetch failed: ${err instanceof Error ? err.message : err}`,
      );
      return {
        base: EXCHANGE_RATE_BASE,
        date: null,
        ratesPerUsd: { ...FALLBACK_RATES_PER_USD },
        source: "fallback",
      };
    }
  }

  async getRatesPerUsd(): Promise<Record<string, number>> {
    const { ratesPerUsd } = await this.getRates();
    return ratesPerUsd;
  }
}
