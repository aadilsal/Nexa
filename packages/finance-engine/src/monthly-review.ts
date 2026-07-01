import type { Category } from "@nexa/shared";
import { ENGINE_VERSION } from "@nexa/shared";
import type { ComputedGoal, EngineTransaction } from "./types.js";

export interface MonthlyReviewInput {
  cycleStart: Date;
  cycleEnd: Date;
  today: Date;
  transactions: EngineTransaction[];
  goals: ComputedGoal[];
  predictedMonthlyExpenses: number;
  recurringTotal: number;
  emergencyFundProgress: number;
  healthScore: number;
  savingsRate: number;
  savingsRateTarget: number;
  netCashFlow: number;
}

export interface MonthlyReviewOutput {
  version: string;
  periodStart: string;
  periodEnd: string;
  income: number;
  expenses: number;
  savings: number;
  netCashFlow: number;
  goalProgress: Array<{
    goalName: string;
    progress: number;
    onTrack: boolean;
    eta: string;
  }>;
  emergencyFundProgress: number;
  financialHealth: number;
  largestExpense: { amount: number; category: Category } | null;
  categoryBreakdown: Partial<Record<Category, number>>;
  recommendations: string[];
}

function sumByType(
  transactions: EngineTransaction[],
  type: "INCOME" | "EXPENSE",
): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((s, t) => s + t.amount, 0);
}

function groupByCategory(
  transactions: EngineTransaction[],
): Partial<Record<Category, number>> {
  const result: Partial<Record<Category, number>> = {};
  for (const tx of transactions) {
    if (tx.type !== "EXPENSE") continue;
    result[tx.category] = (result[tx.category] ?? 0) + tx.amount;
  }
  return result;
}

function buildRecommendations(input: {
  savingsRate: number;
  savingsRateTarget: number;
  healthScore: number;
  goals: ComputedGoal[];
  expenses: number;
  predictedMonthlyExpenses: number;
  emergencyFundProgress: number;
}): string[] {
  const recommendations: string[] = [];

  if (
    input.savingsRateTarget > 0 &&
    input.savingsRate < input.savingsRateTarget
  ) {
    recommendations.push(
      "Your savings rate is below target. Review discretionary spending categories.",
    );
  }

  if (input.emergencyFundProgress < 0.5) {
    recommendations.push(
      "Prioritize building your emergency fund to at least 50% of target.",
    );
  }

  const delayedGoals = input.goals.filter((g) => !g.onTrack);
  if (delayedGoals.length > 0) {
    recommendations.push(
      `${delayedGoals.length} goal(s) are behind schedule. Consider adjusting targets or increasing monthly contributions.`,
    );
  }

  if (
    input.predictedMonthlyExpenses > 0 &&
    input.expenses > input.predictedMonthlyExpenses
  ) {
    recommendations.push(
      "Spending exceeded your predicted monthly expenses. Check category variance for overspend areas.",
    );
  }

  if (input.healthScore < 60) {
    recommendations.push(
      "Financial health score is below 60. Focus on savings rate and spending consistency.",
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "You are on track this cycle. Keep logging transactions to maintain accurate forecasts.",
    );
  }

  return recommendations;
}

export function calculateMonthlyReview(
  input: MonthlyReviewInput,
): MonthlyReviewOutput {
  const income = sumByType(input.transactions, "INCOME");
  const expenses = sumByType(input.transactions, "EXPENSE");
  const savings = income - expenses;
  const categoryBreakdown = groupByCategory(input.transactions);

  const expenseTx = input.transactions
    .filter((t) => t.type === "EXPENSE")
    .sort((a, b) => b.amount - a.amount);
  const largest = expenseTx[0];

  return {
    version: ENGINE_VERSION,
    periodStart: input.cycleStart.toISOString(),
    periodEnd: input.cycleEnd.toISOString(),
    income,
    expenses,
    savings,
    netCashFlow: input.netCashFlow,
    goalProgress: input.goals.map((g) => ({
      goalName: g.name,
      progress: g.progress,
      onTrack: g.onTrack,
      eta: g.eta,
    })),
    emergencyFundProgress: Math.round(input.emergencyFundProgress * 1000) / 10,
    financialHealth: input.healthScore,
    largestExpense: largest
      ? { amount: largest.amount, category: largest.category }
      : null,
    categoryBreakdown,
    recommendations: buildRecommendations({
      savingsRate: input.savingsRate,
      savingsRateTarget: input.savingsRateTarget,
      healthScore: input.healthScore,
      goals: input.goals,
      expenses,
      predictedMonthlyExpenses: input.predictedMonthlyExpenses,
      emergencyFundProgress: input.emergencyFundProgress,
    }),
  };
}
