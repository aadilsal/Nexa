import { BadRequestException, Injectable } from "@nestjs/common";
import {
  buildTrendBuckets,
  calculatePeriodSummary,
  getPeriodBounds,
  type PeriodSummary,
  type ReportPeriod,
  type TrendBucket,
} from "@nexa/finance-engine";
import { RateLimitService } from "../../common/rate-limit/rate-limit.service";
import { CurrencyService } from "../../common/currency/currency.service";
import { LedgerService } from "../transactions/ledger.service";

const VALID_PERIODS: ReportPeriod[] = ["week", "month", "year"];

@Injectable()
export class ReportsService {
  constructor(
    private readonly ledger: LedgerService,
    private readonly currency: CurrencyService,
    private readonly rateLimit: RateLimitService,
  ) {}

  parsePeriod(value: string | undefined): ReportPeriod {
    if (!value || !VALID_PERIODS.includes(value as ReportPeriod)) {
      throw new BadRequestException(
        `period must be one of: ${VALID_PERIODS.join(", ")}`,
      );
    }
    return value as ReportPeriod;
  }

  async getSummary(
    userId: string,
    period: ReportPeriod,
    referenceDate: Date,
  ): Promise<PeriodSummary & { trend: TrendBucket[] }> {
    await this.rateLimit.assertUserLimit(userId, "reports", 60, 60);

    const { start, end } = getPeriodBounds(period, referenceDate);
    const currencyCtx = await this.currency.getUserContext(userId);
    const transactions = await this.ledger.getEffectiveTransactionsInRange(
      userId,
      start,
      end,
    );

    const converted = transactions.map((tx) => ({
      amount: this.currency.toPrimary(tx.amount, tx.currency, currencyCtx),
      type: tx.type,
      category: tx.category,
      createdAt: tx.createdAt,
      description: tx.description,
    }));

    return {
      ...calculatePeriodSummary(converted, start, end),
      trend: buildTrendBuckets(converted, period, start, end),
    };
  }
}
