import { ENGINE_VERSION } from "@nexa/shared";
import { calculateCashPosition } from "./expenses.js";
import { getDaysRemaining } from "./cycle.js";
import {
  allocateGoals,
  calculateAggregateSavingsTarget,
  calculateGoalRequirements,
  findEmergencyFund,
} from "./goals.js";
import { calculateHealthScore } from "./health-score.js";
import {
  calculateHistoricalVariableAverage,
  calculateSafeToSpend,
  sumCharity,
} from "./safe-to-spend.js";
import type { EngineInput, EngineOutput } from "./types.js";
import { calculateVariance } from "./variance.js";
import { calculatePredictedMonthlyExpenses } from "./expenses.js";
import { getTotalCycleDays } from "./utils.js";

export function calculateEngineOutput(input: EngineInput): EngineOutput {
  const today = input.today ?? new Date();
  const recurringTotal = input.fixedExpenses.reduce(
    (s, e) => s + e.expectedAmount,
    0,
  );

  const historicalVariableAverage = calculateHistoricalVariableAverage(
    input.historicalCycles,
  );

  const predictedMonthly = calculatePredictedMonthlyExpenses({
    recurringTotal,
    variableEstimate: input.variableEstimate,
    historicalVariableAverage: historicalVariableAverage ?? undefined,
    completedCyclesCount: input.completedCyclesCount,
  });

  const variable =
    input.completedCyclesCount >= 2 && historicalVariableAverage != null
      ? historicalVariableAverage
      : input.variableEstimate;

  const cash = calculateCashPosition({
    startingBalance: input.cycle.startingBalance,
    transactions: input.transactions,
  });

  const goalRequirements = calculateGoalRequirements(input.goals, today);
  const { requiredMonthlySavings, targetRate } = calculateAggregateSavingsTarget(
    goalRequirements,
    input.expectedIncome,
  );

  const allocatedGoals = allocateGoals(
    goalRequirements,
    input.transactions,
    today,
  );

  const emergencyFund = findEmergencyFund(allocatedGoals);
  const totalCycleDays = getTotalCycleDays(
    input.cycle.startDate,
    input.cycle.endDate,
  );
  const daysRemaining = getDaysRemaining(input.cycle.endDate, today);
  const daysElapsed = totalCycleDays - daysRemaining;

  const safeToSpend = calculateSafeToSpend({
    currentCashAvailable: cash.currentCashAvailable,
    recurringTotal,
    totalCycleDays,
    daysRemaining,
    daysElapsed,
    requiredMonthlySavings,
    emergencyFundRequiredMonthly:
      emergencyFund?.requiredMonthlySavings ?? 0,
    emergencyFundCurrent: emergencyFund?.currentAmount ?? 0,
    emergencyFundTarget: emergencyFund?.goal.targetAmount ?? 0,
    historicalCycles: input.historicalCycles,
    today,
  });

  const healthScore = calculateHealthScore({
    totalIncome: cash.totalIncome,
    totalExpenses: cash.totalExpenses,
    targetSavingsRate: targetRate,
    allocatedGoals,
    transactions: input.transactions,
    expectedIncome: input.expectedIncome,
    completedCyclesCount: input.completedCyclesCount,
  });

  const variance = calculateVariance(
    input.fixedExpenses,
    input.transactions,
    input.expectedIncome,
  );

  const projectedSavings = cash.totalIncome - cash.totalExpenses;
  const actualRate =
    cash.totalIncome > 0 ? projectedSavings / cash.totalIncome : 0;

  const yearStart = new Date(today.getFullYear(), 0, 1);
  const yearTransactions = [
    ...input.transactions,
    ...input.historicalCycles.flatMap((c) => c.transactions),
  ].filter((t) => t.createdAt >= yearStart);

  return {
    version: ENGINE_VERSION,
    calculatedAt: today.toISOString(),
    cycle: {
      id: input.cycle.id,
      startDate: input.cycle.startDate.toISOString(),
      endDate: input.cycle.endDate.toISOString(),
      daysRemaining,
      status: input.cycle.status,
      startingBalance: input.cycle.startingBalance,
    },
    cash,
    safeToSpend,
    healthScore,
    savings: {
      actualRate: Math.round(actualRate * 1000) / 1000,
      targetRate: Math.round(targetRate * 1000) / 1000,
      projectedSavings,
    },
    goals: allocatedGoals.map((g) => ({
      id: g.goal.id,
      name: g.goal.name,
      priority: g.goal.priority,
      targetAmount: g.goal.targetAmount,
      currentAmount: g.currentAmount,
      progress: g.progress,
      targetDate: g.goal.targetDate.toISOString(),
      isEmergencyFund: g.goal.isEmergencyFund,
      requiredMonthlySavings: g.requiredMonthlySavings,
      eta: g.eta.toISOString(),
      onTrack: g.onTrack,
      delayDays: g.delayDays,
    })),
    expenses: {
      predictedMonthly,
      recurring: recurringTotal,
      variable,
      variableSource:
        input.completedCyclesCount >= 2 && historicalVariableAverage != null
          ? "HISTORICAL"
          : "ESTIMATED",
    },
    variance,
    charity: {
      thisCycle: sumCharity(input.transactions),
      thisYear: sumCharity(yearTransactions, today.getFullYear()),
    },
    transactionCount: input.transactions.length,
  };
}

export function diffEngineOutput(
  before: EngineOutput,
  after: EngineOutput,
): {
  safeToSpend: { before: number; after: number };
  healthScore: { before: number; after: number };
} {
  return {
    safeToSpend: {
      before: before.safeToSpend.today,
      after: after.safeToSpend.today,
    },
    healthScore: {
      before: before.healthScore.overall,
      after: after.healthScore.overall,
    },
  };
}
