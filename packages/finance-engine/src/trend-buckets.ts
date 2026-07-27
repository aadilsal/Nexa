import type { PeriodTransaction } from "./category-breakdown.js";
import type { ReportPeriod } from "./period-bounds.js";

export interface TrendBucket {
  label: string;
  bucketStart: string;
  bucketEnd: string;
  income: number;
  expenses: number;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function sumByType(
  transactions: PeriodTransaction[],
  type: "INCOME" | "EXPENSE",
): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((s, t) => s + t.amount, 0);
}

/**
 * Buckets a period's transactions for a trend chart: daily buckets for
 * week/month, monthly buckets for year (a year of daily bars would be
 * unreadable as a bar chart).
 */
export function buildTrendBuckets(
  transactions: PeriodTransaction[],
  period: ReportPeriod,
  periodStart: Date,
  periodEnd: Date,
): TrendBucket[] {
  if (period === "year") {
    const year = periodStart.getFullYear();
    return MONTH_LABELS.map((label, month) => {
      const bucketStart = new Date(year, month, 1, 0, 0, 0, 0);
      const bucketEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const bucketTx = transactions.filter(
        (t) => t.createdAt >= bucketStart && t.createdAt <= bucketEnd,
      );
      return {
        label,
        bucketStart: bucketStart.toISOString(),
        bucketEnd: bucketEnd.toISOString(),
        income: sumByType(bucketTx, "INCOME"),
        expenses: sumByType(bucketTx, "EXPENSE"),
      };
    });
  }

  const buckets: TrendBucket[] = [];
  const cursor = new Date(periodStart);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= periodEnd) {
    const bucketStart = new Date(cursor);
    const bucketEnd = new Date(cursor);
    bucketEnd.setHours(23, 59, 59, 999);

    const bucketTx = transactions.filter(
      (t) => t.createdAt >= bucketStart && t.createdAt <= bucketEnd,
    );

    buckets.push({
      label:
        period === "week"
          ? WEEKDAY_LABELS[bucketStart.getDay()]!
          : String(bucketStart.getDate()),
      bucketStart: bucketStart.toISOString(),
      bucketEnd: bucketEnd.toISOString(),
      income: sumByType(bucketTx, "INCOME"),
      expenses: sumByType(bucketTx, "EXPENSE"),
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return buckets;
}
