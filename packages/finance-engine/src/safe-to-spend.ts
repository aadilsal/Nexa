import type { EngineTransaction, HistoricalCycle } from "./types.js";
import { clamp, getDayOfWeek, roundPKR } from "./utils.js";

const DAY_NAMES = 7;

export function calculateDayOfWeekMultipliers(
  historicalCycles: HistoricalCycle[],
  minCycles = 2,
): Record<number, number> | null {
  if (historicalCycles.length < minCycles) return null;

  const spendByDay: number[] = Array(DAY_NAMES).fill(0);
  const countByDay: number[] = Array(DAY_NAMES).fill(0);

  for (const cycle of historicalCycles) {
    for (const tx of cycle.transactions) {
      if (tx.type !== "EXPENSE") continue;
      const day = getDayOfWeek(tx.createdAt);
      spendByDay[day] += tx.amount;
      countByDay[day] += 1;
    }
  }

  const avgByDay = spendByDay.map((total, i) =>
    countByDay[i] > 0 ? total / countByDay[i] : 0,
  );

  const nonZero = avgByDay.filter((v) => v > 0);
  if (nonZero.length === 0) return null;

  const overallAvg = nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
  if (overallAvg === 0) return null;

  const multipliers: Record<number, number> = {};
  for (let day = 0; day < DAY_NAMES; day++) {
    const raw = avgByDay[day] > 0 ? avgByDay[day] / overallAvg : 1;
    multipliers[day] = clamp(raw, 0.85, 1.15);
  }

  return multipliers;
}

export function getTrendMultiplier(
  historicalCycles: HistoricalCycle[],
  today: Date,
): number {
  const multipliers = calculateDayOfWeekMultipliers(historicalCycles);
  if (!multipliers) return 1;
  return multipliers[getDayOfWeek(today)] ?? 1;
}

export interface SafeToSpendInput {
  currentCashAvailable: number;
  recurringTotal: number;
  totalCycleDays: number;
  daysRemaining: number;
  daysElapsed: number;
  requiredMonthlySavings: number;
  emergencyFundRequiredMonthly: number;
  emergencyFundCurrent: number;
  emergencyFundTarget: number;
  historicalCycles: HistoricalCycle[];
  today: Date;
}

export interface SafeToSpendResult {
  today: number;
  baseline: number;
  trendMultiplier: number;
  discretionaryPool: number;
}

export function calculateSafeToSpend(input: SafeToSpendInput): SafeToSpendResult {
  const {
    currentCashAvailable,
    recurringTotal,
    totalCycleDays,
    daysRemaining,
    daysElapsed,
    requiredMonthlySavings,
    emergencyFundRequiredMonthly,
    emergencyFundCurrent,
    emergencyFundTarget,
    historicalCycles,
    today,
  } = input;

  const remainingFixedRatio = daysRemaining / totalCycleDays;
  const remainingFixedExpenses = roundPKR(recurringTotal * remainingFixedRatio);

  const remainingGoalContributions = roundPKR(
    requiredMonthlySavings * remainingFixedRatio,
  );

  let emergencyFundProtection = 0;
  if (emergencyFundTarget > 0 && emergencyFundCurrent < emergencyFundTarget) {
    const remainingEmergencyNeeded = emergencyFundTarget - emergencyFundCurrent;
    const proratedEmergency = roundPKR(
      emergencyFundRequiredMonthly * remainingFixedRatio,
    );
    emergencyFundProtection = Math.min(remainingEmergencyNeeded, proratedEmergency);
  }

  const discretionaryPool = Math.max(
    0,
    currentCashAvailable -
      remainingFixedExpenses -
      remainingGoalContributions -
      emergencyFundProtection,
  );

  const effectiveDaysRemaining = Math.max(daysRemaining, 1);
  const baseline =
    daysRemaining === 0
      ? discretionaryPool
      : discretionaryPool / effectiveDaysRemaining;

  const trendMultiplier = getTrendMultiplier(historicalCycles, today);
  const adjusted = baseline * trendMultiplier;
  const todayAmount = roundPKR(Math.max(0, adjusted));

  return {
    today: todayAmount,
    baseline: roundPKR(Math.max(0, baseline)),
    trendMultiplier,
    discretionaryPool,
  };
}

export function calculateHistoricalVariableAverage(
  historicalCycles: HistoricalCycle[],
  maxCycles = 3,
): number | null {
  const cycles = historicalCycles.slice(0, maxCycles);
  if (cycles.length < 2) return null;

  const variables = cycles.map((cycle) => {
    const expenses = cycle.transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((s, t) => s + t.amount, 0);
    return Math.max(0, expenses - cycle.recurringTotal);
  });

  return Math.round(
    variables.reduce((a, b) => a + b, 0) / variables.length,
  );
}

export function sumCharity(
  transactions: EngineTransaction[],
  year?: number,
): number {
  return transactions
    .filter(
      (t) =>
        t.type === "EXPENSE" &&
        t.category === "CHARITY" &&
        (year == null || t.createdAt.getFullYear() === year),
    )
    .reduce((s, t) => s + t.amount, 0);
}
