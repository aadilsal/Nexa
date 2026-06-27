import type { EngineGoal, EngineTransaction } from "./types.js";
import { addMonths, monthsBetween, sortByPriority } from "./utils.js";

export interface GoalRequirement {
  goal: EngineGoal;
  remainingAmount: number;
  monthsRemaining: number;
  requiredMonthlySavings: number;
}

export function calculateGoalRequirements(
  goals: EngineGoal[],
  today: Date,
): GoalRequirement[] {
  return sortByPriority(goals).map((goal) => {
    const remainingAmount = Math.max(0, goal.targetAmount - goal.storedCurrentAmount);
    const monthsRemaining = monthsBetween(today, goal.targetDate);
    const requiredMonthlySavings =
      remainingAmount > 0 ? Math.ceil(remainingAmount / monthsRemaining) : 0;

    return {
      goal,
      remainingAmount,
      monthsRemaining,
      requiredMonthlySavings,
    };
  });
}

export function calculateAggregateSavingsTarget(
  requirements: GoalRequirement[],
  expectedIncome: number,
): { requiredMonthlySavings: number; targetRate: number } {
  const requiredMonthlySavings = requirements.reduce(
    (sum, r) => sum + r.requiredMonthlySavings,
    0,
  );
  const targetRate =
    expectedIncome > 0 ? requiredMonthlySavings / expectedIncome : 0;

  return { requiredMonthlySavings, targetRate };
}

export interface AllocatedGoal extends GoalRequirement {
  currentAmount: number;
  progress: number;
  eta: Date;
  onTrack: boolean;
  delayDays: number;
}

export function allocateGoals(
  requirements: GoalRequirement[],
  transactions: EngineTransaction[],
  today: Date,
): AllocatedGoal[] {
  const income = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);
  const surplus = Math.max(0, income - expenses);

  let remainingSurplus = surplus;

  return requirements.map((req) => {
    const allocation = Math.min(remainingSurplus, req.remainingAmount);
    remainingSurplus -= allocation;

    const currentAmount = req.goal.storedCurrentAmount + allocation;
    const progress =
      req.goal.targetAmount > 0
        ? Math.min(100, Math.round((currentAmount / req.goal.targetAmount) * 100))
        : 100;

    let eta = req.goal.targetDate;
    let onTrack = true;
    let delayDays = 0;

    if (req.remainingAmount > 0 && req.requiredMonthlySavings > 0) {
      const monthsToComplete = Math.ceil(
        (req.goal.targetAmount - currentAmount) / req.requiredMonthlySavings,
      );
      eta = addMonths(today, monthsToComplete);
      if (eta > req.goal.targetDate) {
        onTrack = false;
        delayDays = Math.ceil(
          (eta.getTime() - req.goal.targetDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );
      }
    } else if (currentAmount >= req.goal.targetAmount) {
      eta = today;
    }

    return {
      ...req,
      currentAmount,
      progress,
      eta,
      onTrack,
      delayDays,
    };
  });
}

export function findEmergencyFund(
  allocated: AllocatedGoal[],
): AllocatedGoal | undefined {
  return allocated.find((g) => g.goal.isEmergencyFund);
}
