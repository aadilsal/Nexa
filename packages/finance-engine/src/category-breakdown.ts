import type { Category } from "@nexa/shared";
import type { EngineTransaction } from "./types.js";

export function groupExpensesByCategory(
  transactions: EngineTransaction[],
): Partial<Record<Category, number>> {
  const result: Partial<Record<Category, number>> = {};
  for (const tx of transactions) {
    if (tx.type !== "EXPENSE") continue;
    result[tx.category] = (result[tx.category] ?? 0) + tx.amount;
  }
  return result;
}

export function findExtremeCategory(
  byCategory: Partial<Record<Category, number>>,
  mode: "max" | "min",
): { category: Category; amount: number } | null {
  const entries = Object.entries(byCategory).filter(
    (entry): entry is [Category, number] => (entry[1] ?? 0) > 0,
  );

  if (entries.length === 0) return null;

  entries.sort((a, b) => (mode === "max" ? b[1] - a[1] : a[1] - b[1]));
  const [category, amount] = entries[0]!;
  return { category, amount };
}

function sumByType(
  transactions: EngineTransaction[],
  type: "INCOME" | "EXPENSE",
): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((s, t) => s + t.amount, 0);
}

export interface PeriodTransaction extends EngineTransaction {
  description?: string;
}

export interface PeriodSummary {
  periodStart: string;
  periodEnd: string;
  income: number;
  expenses: number;
  saved: number;
  savingsRate: number;
  byCategory: Partial<Record<Category, number>>;
  highestCategory: { category: Category; amount: number } | null;
  lowestCategory: { category: Category; amount: number } | null;
  transactionCount: number;
  averageDailySpend: number;
  largestExpense: {
    amount: number;
    category: Category;
    description: string | null;
  } | null;
}

export function calculatePeriodSummary(
  transactions: PeriodTransaction[],
  periodStart: Date,
  periodEnd: Date,
): PeriodSummary {
  const income = sumByType(transactions, "INCOME");
  const expenses = sumByType(transactions, "EXPENSE");
  const saved = income - expenses;
  const savingsRate = income > 0 ? saved / income : 0;

  const byCategory = groupExpensesByCategory(transactions);
  const highestCategory = findExtremeCategory(byCategory, "max");
  const lowestCategory = findExtremeCategory(byCategory, "min");

  const expenseTx = transactions
    .filter((t) => t.type === "EXPENSE")
    .sort((a, b) => b.amount - a.amount);
  const largest = expenseTx[0];

  const daysInPeriod = Math.max(
    1,
    Math.ceil(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1,
  );

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    income,
    expenses,
    saved,
    savingsRate: Math.round(savingsRate * 1000) / 1000,
    byCategory,
    highestCategory,
    lowestCategory,
    transactionCount: transactions.length,
    averageDailySpend: Math.round(expenses / daysInPeriod),
    largestExpense: largest
      ? {
          amount: largest.amount,
          category: largest.category,
          description: largest.description ?? null,
        }
      : null,
  };
}
