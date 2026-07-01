import type { Category } from "@nexa/shared";
import { ENGINE_VERSION } from "@nexa/shared";
import type { EngineGoal, EngineTransaction } from "./types.js";
import { sumCharity } from "./safe-to-spend.js";

export type WeeklyRating =
  | "EXCELLENT"
  | "GOOD"
  | "FAIR"
  | "NEEDS_ATTENTION";

export interface WeeklyReviewInput {
  timezone: string;
  weekStart: Date;
  weekEnd: Date;
  transactions: EngineTransaction[];
  priorWeekTransactions: EngineTransaction[];
  goals: EngineGoal[];
  goalsAtWeekStart: EngineGoal[];
  expectedIncome: number;
  predictedMonthlyExpenses: number;
  savingsRateTarget: number;
  safeToSpendAtWeekStart?: number;
  safeToSpendAtWeekEnd?: number;
  healthScoreAtWeekStart?: number;
  healthScoreAtWeekEnd?: number;
}

export interface WeeklyReviewOutput {
  version: string;
  weekStart: string;
  weekEnd: string;
  income: number;
  spent: number;
  saved: number;
  byCategory: Partial<Record<Category, number>>;
  highestSpendingCategory: { category: Category; amount: number } | null;
  lowestSpendingCategory: { category: Category; amount: number } | null;
  vsLastWeek: {
    incomeDelta: number;
    spentDelta: number;
    savedDelta: number;
    incomeChangePercent: number | null;
    spentChangePercent: number | null;
  };
  savingsRate: number;
  savingsRateTarget: number;
  overallRating: WeeklyRating;
  goalProgress: Array<{
    goalName: string;
    progressStart: number;
    progressEnd: number;
    progressDelta: number;
    onTrack: boolean;
  }>;
  charityThisWeek: number;
  averageDailySpend: number;
  safeToSpendTrend: {
    start: number | null;
    end: number | null;
    delta: number | null;
  };
  healthScoreChange: {
    start: number | null;
    end: number | null;
    delta: number | null;
  };
  facts: {
    daysLogged: number;
    transactionCount: number;
    topExpenseDescription: string | null;
    emergencyFundProgressDelta: number | null;
    beatSavingsTarget: boolean;
  };
}

function sumByType(
  transactions: EngineTransaction[],
  type: "INCOME" | "EXPENSE",
): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((s, t) => s + t.amount, 0);
}

function groupExpensesByCategory(
  transactions: EngineTransaction[],
): Partial<Record<Category, number>> {
  const result: Partial<Record<Category, number>> = {};
  for (const tx of transactions) {
    if (tx.type !== "EXPENSE") continue;
    result[tx.category] = (result[tx.category] ?? 0) + tx.amount;
  }
  return result;
}

function findExtremeCategory(
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

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function goalProgressPercent(goal: EngineGoal): number {
  if (goal.targetAmount <= 0) return 100;
  return Math.min(
    100,
    Math.round((goal.storedCurrentAmount / goal.targetAmount) * 100),
  );
}

function computeOverallRating(
  savingsRate: number,
  savingsRateTarget: number,
  saved: number,
  goalsOnTrack: boolean,
): WeeklyRating {
  if (
    saved > 0 &&
    goalsOnTrack &&
    savingsRateTarget > 0 &&
    savingsRate >= savingsRateTarget
  ) {
    return "EXCELLENT";
  }
  if (savingsRateTarget > 0 && savingsRate >= savingsRateTarget * 0.8) {
    return "GOOD";
  }
  if (savingsRateTarget > 0 && savingsRate >= savingsRateTarget * 0.5) {
    return "FAIR";
  }
  return "NEEDS_ATTENTION";
}

function uniqueDaysLogged(transactions: EngineTransaction[]): number {
  const days = new Set(
    transactions.map((t) => t.createdAt.toISOString().slice(0, 10)),
  );
  return days.size;
}

export function getCalendarWeekBounds(
  reference: Date,
  _timezone: string,
): { weekStart: Date; weekEnd: Date } {
  const date = new Date(reference);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

export function filterTransactionsInRange(
  transactions: EngineTransaction[],
  start: Date,
  end: Date,
): EngineTransaction[] {
  return transactions.filter(
    (t) => t.createdAt >= start && t.createdAt <= end,
  );
}

export function calculateWeeklyReview(
  input: WeeklyReviewInput,
): WeeklyReviewOutput {
  const weekTx = filterTransactionsInRange(
    input.transactions,
    input.weekStart,
    input.weekEnd,
  );

  const income = sumByType(weekTx, "INCOME");
  const spent = sumByType(weekTx, "EXPENSE");
  const saved = income - spent;
  const savingsRate = income > 0 ? saved / income : 0;

  const byCategory = groupExpensesByCategory(weekTx);
  const highestSpendingCategory = findExtremeCategory(byCategory, "max");
  const lowestSpendingCategory = findExtremeCategory(byCategory, "min");

  const priorIncome = sumByType(input.priorWeekTransactions, "INCOME");
  const priorSpent = sumByType(input.priorWeekTransactions, "EXPENSE");
  const priorSaved = priorIncome - priorSpent;

  const goalProgress = input.goals.map((goalAfter) => {
    const goalBefore = input.goalsAtWeekStart.find((g) => g.id === goalAfter.id);
    const progressStart = goalBefore
      ? goalProgressPercent(goalBefore)
      : goalProgressPercent(goalAfter);
    const progressEnd = goalProgressPercent(goalAfter);
    const monthsRemaining = Math.max(
      1,
      Math.ceil(
        (goalAfter.targetDate.getTime() - input.weekEnd.getTime()) /
          (1000 * 60 * 60 * 24 * 30),
      ),
    );
    const remaining = Math.max(
      0,
      goalAfter.targetAmount - goalAfter.storedCurrentAmount,
    );
    const requiredMonthly =
      remaining > 0 ? Math.ceil(remaining / monthsRemaining) : 0;
    const monthsToComplete =
      requiredMonthly > 0
        ? Math.ceil(remaining / requiredMonthly)
        : 0;
    const eta = new Date(input.weekEnd);
    eta.setMonth(eta.getMonth() + monthsToComplete);
    const onTrack = eta <= goalAfter.targetDate;

    return {
      goalName: goalAfter.name,
      progressStart,
      progressEnd,
      progressDelta: progressEnd - progressStart,
      onTrack,
    };
  });

  const goalsOnTrack = goalProgress.every((g) => g.onTrack);
  const overallRating = computeOverallRating(
    savingsRate,
    input.savingsRateTarget,
    saved,
    goalsOnTrack,
  );

  const emergencyBefore = input.goalsAtWeekStart.find((g) => g.isEmergencyFund);
  const emergencyAfter = input.goals.find((g) => g.isEmergencyFund);
  const emergencyFundProgressDelta =
    emergencyBefore && emergencyAfter
      ? goalProgressPercent(emergencyAfter) - goalProgressPercent(emergencyBefore)
      : null;

  const expenseTx = weekTx.filter((t) => t.type === "EXPENSE");
  const topExpense = expenseTx.sort((a, b) => b.amount - a.amount)[0];

  const daysInWeek = Math.max(
    1,
    Math.ceil(
      (input.weekEnd.getTime() - input.weekStart.getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1,
  );
  const averageDailySpend = Math.round(spent / daysInWeek);

  const stsStart = input.safeToSpendAtWeekStart ?? null;
  const stsEnd = input.safeToSpendAtWeekEnd ?? null;
  const healthStart = input.healthScoreAtWeekStart ?? null;
  const healthEnd = input.healthScoreAtWeekEnd ?? null;

  return {
    version: ENGINE_VERSION,
    weekStart: input.weekStart.toISOString(),
    weekEnd: input.weekEnd.toISOString(),
    income,
    spent,
    saved,
    byCategory,
    highestSpendingCategory,
    lowestSpendingCategory,
    vsLastWeek: {
      incomeDelta: income - priorIncome,
      spentDelta: spent - priorSpent,
      savedDelta: saved - priorSaved,
      incomeChangePercent: pctChange(income, priorIncome),
      spentChangePercent: pctChange(spent, priorSpent),
    },
    savingsRate: Math.round(savingsRate * 1000) / 1000,
    savingsRateTarget: input.savingsRateTarget,
    overallRating,
    goalProgress,
    charityThisWeek: sumCharity(weekTx),
    averageDailySpend,
    safeToSpendTrend: {
      start: stsStart,
      end: stsEnd,
      delta: stsStart != null && stsEnd != null ? stsEnd - stsStart : null,
    },
    healthScoreChange: {
      start: healthStart,
      end: healthEnd,
      delta:
        healthStart != null && healthEnd != null
          ? healthEnd - healthStart
          : null,
    },
    facts: {
      daysLogged: uniqueDaysLogged(weekTx),
      transactionCount: weekTx.length,
      topExpenseDescription: topExpense ? String(topExpense.amount) : null,
      emergencyFundProgressDelta,
      beatSavingsTarget:
        input.savingsRateTarget > 0 &&
        savingsRate >= input.savingsRateTarget,
    },
  };
}
