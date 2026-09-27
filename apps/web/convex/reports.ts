import { v } from "convex/values";
import { query } from "./_generated/server";
import { getPeriodBounds, calculatePeriodSummary, buildTrendBuckets, type ReportPeriod } from "@nexa/finance-engine";
import { requireSession } from "./lib/session";
import { getEffectiveTransactionsInRangeRaw } from "./ledger";
import { getCurrencyContext, toPrimary } from "./currencies";

// Ported from apps/api/src/modules/reports/reports.service.ts.

const periodValidator = v.union(v.literal("week"), v.literal("month"), v.literal("year"));

export const getSummary = query({
  args: { sessionToken: v.string(), period: periodValidator, date: v.optional(v.number()) },
  handler: async (ctx, { sessionToken, period, date }) => {
    await requireSession(ctx, sessionToken);
    const referenceDate = date ? new Date(date) : new Date();
    const { start, end } = getPeriodBounds(period as ReportPeriod, referenceDate);
    const currencyCtx = await getCurrencyContext(ctx);
    const transactions = await getEffectiveTransactionsInRangeRaw(ctx, start.getTime(), end.getTime());

    // Money lent/borrowed isn't spending or income — keep it out of reports.
    const converted = transactions.filter((tx) => tx.category !== "LOAN").map((tx) => ({
      amount: toPrimary(tx.amount, tx.currency, currencyCtx),
      type: tx.type,
      category: tx.category,
      createdAt: new Date(tx.createdAt),
      description: tx.description,
    }));

    return {
      ...calculatePeriodSummary(converted, start, end),
      trend: buildTrendBuckets(converted, period as ReportPeriod, start, end),
    };
  },
});
