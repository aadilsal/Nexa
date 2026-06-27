import type { Category } from "@nexa/shared";
import type { EngineFixedExpense, EngineTransaction } from "./types.js";

export interface VarianceResult {
  income: { expected: number; actual: number; variance: number };
  fixedExpenses: Array<{
    name: string;
    expected: number;
    actual: number;
    variance: number;
  }>;
}

export function calculateVariance(
  fixedExpenses: EngineFixedExpense[],
  transactions: EngineTransaction[],
  expectedIncome: number,
): VarianceResult {
  const actualIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);

  const fixedExpenseVariance = fixedExpenses.map((expense) => {
    const actual = transactions
      .filter(
        (t) => t.type === "EXPENSE" && t.category === expense.category,
      )
      .reduce((s, t) => s + t.amount, 0);

    return {
      name: expense.name,
      expected: expense.expectedAmount,
      actual,
      variance: expense.expectedAmount - actual,
    };
  });

  return {
    income: {
      expected: expectedIncome,
      actual: actualIncome,
      variance: actualIncome - expectedIncome,
    },
    fixedExpenses: fixedExpenseVariance,
  };
}

export function sumByCategory(
  transactions: EngineTransaction[],
  category: Category,
): number {
  return transactions
    .filter((t) => t.type === "EXPENSE" && t.category === category)
    .reduce((s, t) => s + t.amount, 0);
}
