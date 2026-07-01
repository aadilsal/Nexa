import type { Category } from "@nexa/shared";
import type { EngineTransaction, HistoricalCycle } from "./types.js";

export type SpendingTrendDirection = "HIGHER" | "LOWER" | "NORMAL";

export interface CategorySpendingTrend {
  category: Category;
  averageSpend: number;
  currentSpend: number;
  direction: SpendingTrendDirection;
  changePercent: number;
}

const EXPENSE_CATEGORIES = [
  "FOOD",
  "FUEL",
  "SHOPPING",
  "ENTERTAINMENT",
  "UTILITIES",
  "HEALTHCARE",
  "TRANSPORT",
  "HOUSING",
  "EDUCATION",
  "CHARITY",
  "INVESTMENT",
  "OTHER",
] as const satisfies readonly Category[];

function sumCategory(
  transactions: EngineTransaction[],
  category: Category,
): number {
  return transactions
    .filter((t) => t.type === "EXPENSE" && t.category === category)
    .reduce((s, t) => s + t.amount, 0);
}

function averageHistoricalCategorySpend(
  historicalCycles: HistoricalCycle[],
  category: Category,
): number {
  if (historicalCycles.length === 0) return 0;

  const totals = historicalCycles.map((cycle) =>
    sumCategory(cycle.transactions, category),
  );
  return Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
}

export function detectSpendingTrends(
  currentTransactions: EngineTransaction[],
  historicalCycles: HistoricalCycle[],
  thresholdPercent = 10,
): CategorySpendingTrend[] {
  const trends: CategorySpendingTrend[] = [];

  for (const category of EXPENSE_CATEGORIES) {
    const currentSpend = sumCategory(currentTransactions, category);
    const averageSpend = averageHistoricalCategorySpend(
      historicalCycles,
      category,
    );

    if (currentSpend === 0 && averageSpend === 0) continue;

    const baseline = averageSpend > 0 ? averageSpend : currentSpend;
    const changePercent =
      baseline > 0
        ? Math.round(((currentSpend - baseline) / baseline) * 1000) / 10
        : currentSpend > 0
          ? 100
          : 0;

    let direction: SpendingTrendDirection = "NORMAL";
    if (changePercent > thresholdPercent) direction = "HIGHER";
    else if (changePercent < -thresholdPercent) direction = "LOWER";

    trends.push({
      category,
      averageSpend,
      currentSpend,
      direction,
      changePercent,
    });
  }

  return trends.sort((a, b) => b.currentSpend - a.currentSpend);
}
