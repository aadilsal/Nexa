import { Injectable } from "@nestjs/common";
import {
  convertCurrency,
  normalizeCurrency,
  type CurrencyCode,
} from "@nexa/shared";
import { PrismaService } from "../prisma/prisma.module";
import { ExchangeRatesService } from "./exchange-rates.service";

export interface UserCurrencyContext {
  primaryCurrency: CurrencyCode;
  ratesPerUsd: Record<string, number>;
  ratesDate: string | null;
}

@Injectable()
export class CurrencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exchangeRates: ExchangeRatesService,
  ) {}

  async buildContext(
    primaryCurrency?: string | null,
  ): Promise<UserCurrencyContext> {
    const { ratesPerUsd, date } = await this.exchangeRates.getRates();
    return {
      primaryCurrency: normalizeCurrency(primaryCurrency),
      ratesPerUsd,
      ratesDate: date,
    };
  }

  async getUserContext(userId: string): Promise<UserCurrencyContext> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { primaryCurrency: true },
    });
    return this.buildContext(settings?.primaryCurrency);
  }

  toPrimary(
    amount: number,
    currency: string | null | undefined,
    ctx: UserCurrencyContext,
  ): number {
    const from = normalizeCurrency(currency, ctx.primaryCurrency);
    return convertCurrency(
      amount,
      from,
      ctx.primaryCurrency,
      ctx.ratesPerUsd,
    );
  }
}
