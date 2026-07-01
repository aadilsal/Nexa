import type { EngineTransaction, HistoricalCycle } from "./types.js";
import { clamp, getDayOfWeek, roundPKR } from "./utils.js";

const DAY_NAMES = 7;

export function calculateDayOfWeekMultipliers(
  historicalCycles: HistoricalCycle[],
  minCycles = 2,
): Record<number, number> | null {
  if (historicalCycles.length < minCycles) return null;

  const dailyTotalsByDow: number[][] = Array.from({ length: DAY_NAMES }, () => []);

  for (const cycle of historicalCycles) {
    const dailySpend = new Map<string, number>();
    for (const tx of cycle.transactions) {
      if (tx.type !== "EXPENSE") continue;
      const key = tx.createdAt.toISOString().slice(0, 10);
      dailySpend.set(key, (dailySpend.get(key) ?? 0) + tx.amount);
    }

    for (const [dateKey, amount] of dailySpend) {
      const day = getDayOfWeek(new Date(dateKey));
      dailyTotalsByDow[day].push(amount);
    }
  }

  const avgByDay = dailyTotalsByDow.map((totals) =>
    totals.length > 0
      ? totals.reduce((a, b) => a + b, 0) / totals.length
      : 0,
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
  unclampedDiscretionaryPool: number;
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

  const unclampedDiscretionaryPool =
    currentCashAvailable -
    remainingFixedExpenses -
    remainingGoalContributions -
    emergencyFundProtection;

  const discretionaryPool = Math.max(0, unclampedDiscretionaryPool);

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
    unclampedDiscretionaryPool: roundPKR(unclampedDiscretionaryPool),
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
