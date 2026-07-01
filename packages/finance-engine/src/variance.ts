import type { Category } from "@nexa/shared";
import type { EngineFixedExpense, EngineTransaction } from "./types.js";

export type BudgetStatus = "UNDER_BUDGET" | "OVER_BUDGET" | "ON_TRACK";

export interface VarianceResult {
  income: { expected: number; actual: number; variance: number };
  fixedExpenses: Array<{
    name: string;
    expected: number;
    actual: number;
    variance: number;
  }>;
  categories: Array<{
    category: Category;
    expected: number;
    actual: number;
    variance: number;
    status: BudgetStatus;
  }>;
}

const EXPENSE_CATEGORIES: Category[] = [
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
];

function budgetStatus(variance: number): BudgetStatus {
  if (variance > 0) return "UNDER_BUDGET";
  if (variance < 0) return "OVER_BUDGET";
  return "ON_TRACK";
}

export function calculateVariance(
  fixedExpenses: EngineFixedExpense[],
  transactions: EngineTransaction[],
  expectedIncome: number,
  predictedMonthlyExpenses = 0,
  recurringTotal = 0,
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

  const expectedByCategory = new Map<Category, number>();
  for (const expense of fixedExpenses) {
    expectedByCategory.set(
      expense.category,
      (expectedByCategory.get(expense.category) ?? 0) + expense.expectedAmount,
    );
  }

  const variableBudget = Math.max(0, predictedMonthlyExpenses - recurringTotal);
  const variablePerCategory =
    variableBudget > 0 && EXPENSE_CATEGORIES.length > 0
      ? Math.round(variableBudget / EXPENSE_CATEGORIES.length)
      : 0;

  for (const category of EXPENSE_CATEGORIES) {
    if (!expectedByCategory.has(category) && variablePerCategory > 0) {
      expectedByCategory.set(category, variablePerCategory);
    }
  }

  const categories = EXPENSE_CATEGORIES.map((category) => {
    const expected = expectedByCategory.get(category) ?? 0;
    const actual = transactions
      .filter((t) => t.type === "EXPENSE" && t.category === category)
      .reduce((s, t) => s + t.amount, 0);
    const variance = expected - actual;

    return {
      category,
      expected,
      actual,
      variance,
      status: budgetStatus(variance),
    };
  }).filter((row) => row.expected > 0 || row.actual > 0);

  return {
    income: {
      expected: expectedIncome,
      actual: actualIncome,
      variance: actualIncome - expectedIncome,
    },
    fixedExpenses: fixedExpenseVariance,
    categories,
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
