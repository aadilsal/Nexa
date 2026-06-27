import type { EngineTransaction } from "./types.js";
import type { AllocatedGoal } from "./goals.js";
import { findEmergencyFund } from "./goals.js";
import { scoreByProgress, scoreByRatio, stdDev } from "./utils.js";

export interface HealthScoreInput {
  totalIncome: number;
  totalExpenses: number;
  targetSavingsRate: number;
  allocatedGoals: AllocatedGoal[];
  transactions: EngineTransaction[];
  expectedIncome: number;
  completedCyclesCount: number;
}

export interface HealthScoreResult {
  overall: number;
  breakdown: {
    savingsRate: number;
    emergencyFund: number;
    goalProgress: number;
    spendingConsistency: number;
    incomeStability: number;
  };
}

function scoreSpendingConsistency(transactions: EngineTransaction[]): number {
  const dailySpend = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type !== "EXPENSE") continue;
    const key = tx.createdAt.toISOString().slice(0, 10);
    dailySpend.set(key, (dailySpend.get(key) ?? 0) + tx.amount);
  }

  const values = [...dailySpend.values()];
  if (values.length < 2) return 70;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 70;

  const cv = stdDev(values) / mean;

  if (cv <= 0.3) return 100;
  if (cv <= 0.5) return 80;
  if (cv <= 0.7) return 60;
  if (cv <= 1.0) return 40;
  return 20;
}

function scoreIncomeStability(
  actualIncome: number,
  expectedIncome: number,
): number {
  if (expectedIncome <= 0) return 70;
  const ratio = actualIncome / expectedIncome;
  if (ratio >= 1.0) return 100;
  if (ratio >= 0.9) return 80;
  if (ratio >= 0.75) return 60;
  return 30;
}

export function calculateHealthScore(input: HealthScoreInput): HealthScoreResult {
  const {
    totalIncome,
    totalExpenses,
    targetSavingsRate,
    allocatedGoals,
    transactions,
    expectedIncome,
    completedCyclesCount,
  } = input;

  const actualSavingsRate =
    totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
  const savingsRatio =
    targetSavingsRate > 0 ? actualSavingsRate / targetSavingsRate : 1;
  const savingsRateScore = scoreByRatio(savingsRatio);

  const emergencyFund = findEmergencyFund(allocatedGoals);
  const emergencyProgress =
    emergencyFund && emergencyFund.goal.targetAmount > 0
      ? emergencyFund.currentAmount / emergencyFund.goal.targetAmount
      : 0;
  const emergencyFundScore = scoreByProgress(emergencyProgress);

  const avgProgress =
    allocatedGoals.length > 0
      ? allocatedGoals.reduce((s, g) => s + g.progress, 0) /
        allocatedGoals.length /
        100
      : 0;
  const goalProgressScore = scoreByProgress(avgProgress);

  const spendingConsistencyScore =
    completedCyclesCount >= 1
      ? scoreSpendingConsistency(transactions)
      : 70;

  const incomeStabilityScore = scoreIncomeStability(
    totalIncome,
    expectedIncome,
  );

  const overall = Math.round(
    savingsRateScore * 0.3 +
      emergencyFundScore * 0.25 +
      goalProgressScore * 0.2 +
      spendingConsistencyScore * 0.15 +
      incomeStabilityScore * 0.1,
  );

  return {
    overall,
    breakdown: {
      savingsRate: savingsRateScore,
      emergencyFund: emergencyFundScore,
      goalProgress: goalProgressScore,
      spendingConsistency: spendingConsistencyScore,
      incomeStability: incomeStabilityScore,
    },
  };
}
