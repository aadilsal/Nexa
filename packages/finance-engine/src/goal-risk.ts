import type { ComputedGoal } from "./types.js";

export type GoalRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface GoalRisk {
  goalId: string;
  goalName: string;
  riskLevel: GoalRiskLevel;
  riskScore: number;
  factors: string[];
}

export interface GoalRiskInput {
  goals: ComputedGoal[];
  actualSavingsRate: number;
  targetSavingsRate: number;
  predictedMonthlyExpenses: number;
  totalExpenses: number;
  totalIncome: number;
  expectedIncome: number;
  daysElapsed: number;
  totalCycleDays: number;
}

function toRiskLevel(score: number): GoalRiskLevel {
  if (score >= 67) return "HIGH";
  if (score >= 34) return "MEDIUM";
  return "LOW";
}

export function detectGoalRisks(input: GoalRiskInput): GoalRisk[] {
  const {
    goals,
    actualSavingsRate,
    targetSavingsRate,
    predictedMonthlyExpenses,
    totalExpenses,
    totalIncome,
    expectedIncome,
    daysElapsed,
    totalCycleDays,
  } = input;

  const cycleProgress =
    totalCycleDays > 0 ? daysElapsed / totalCycleDays : 1;
  const expectedSpendToDate = predictedMonthlyExpenses * cycleProgress;
  const expectedIncomeToDate = expectedIncome * cycleProgress;

  const sharedFactors: string[] = [];
  let sharedScore = 0;

  if (targetSavingsRate > 0 && actualSavingsRate < targetSavingsRate) {
    sharedFactors.push("insufficient_savings");
    sharedScore += 25;
  }

  if (expectedIncome > 0 && totalIncome < expectedIncomeToDate * 0.9) {
    sharedFactors.push("reduced_income");
    sharedScore += 25;
  }

  if (
    predictedMonthlyExpenses > 0 &&
    totalExpenses > expectedSpendToDate * 1.1
  ) {
    sharedFactors.push("increased_spending");
    sharedScore += 20;
  }

  return goals.map((goal) => {
    const factors = [...sharedFactors];
    let score = sharedScore;

    if (!goal.onTrack) {
      factors.push("behind_schedule");
      score += 30;
    }

    if (goal.delayDays > 60) {
      score += 15;
    }

    return {
      goalId: goal.id,
      goalName: goal.name,
      riskLevel: toRiskLevel(Math.min(100, score)),
      riskScore: Math.min(100, score),
      factors,
    };
  });
}
