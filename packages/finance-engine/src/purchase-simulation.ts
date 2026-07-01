import { DEFAULT_EMERGENCY_FUND_MONTHS } from "@nexa/shared";
import { calculateEngineOutput } from "./engine.js";
import { calculatePredictedMonthlyExpenses } from "./expenses.js";
import { calculateHistoricalVariableAverage } from "./safe-to-spend.js";
import type { EngineInput, EngineOutput } from "./types.js";

export type PurchaseRecommendation = "WAIT" | "GO_AHEAD";
export type PurchaseTriggeredRule = "R1" | "R2" | "R3" | "R4" | "R5" | null;

export interface PurchaseSimulationInput {
  itemName: string;
  amount: number;
  purchaseDate?: Date;
}

export interface PurchaseSimulationOutput {
  recommendation: PurchaseRecommendation;
  triggeredRule: PurchaseTriggeredRule;
  impacts: {
    emergencyFundDelayDays: number;
    savingsRateBefore: number;
    savingsRateAfter: number;
    goalDelays: Array<{ goalName: string; delayDays: number }>;
  };
  suggestedWaitUntil: string | null;
  before: Pick<EngineOutput, "safeToSpend" | "healthScore" | "savings" | "goals">;
  after: Pick<EngineOutput, "safeToSpend" | "healthScore" | "savings" | "goals">;
}

const MAX_WAIT_SEARCH_DAYS = 730;

function applyHypotheticalPurchase(
  input: EngineInput,
  purchase: PurchaseSimulationInput,
): EngineInput {
  const purchaseDate = purchase.purchaseDate ?? input.today ?? new Date();

  return {
    ...input,
    transactions: [
      ...input.transactions,
      {
        amount: purchase.amount,
        type: "EXPENSE",
        category: "OTHER",
        createdAt: purchaseDate,
      },
    ],
  };
}

function evaluateRules(
  before: EngineOutput,
  after: EngineOutput,
  purchaseAmount: number,
): PurchaseTriggeredRule {
  const emergencyFund = findEmergencyFundFromOutput(after);
  const predictedMonthly = after.expenses.predictedMonthly;

  if (emergencyFund && predictedMonthly > 0) {
    const monthsCovered = emergencyFund.currentAmount / predictedMonthly;
    if (monthsCovered < DEFAULT_EMERGENCY_FUND_MONTHS) {
      return "R1";
    }
  } else if (predictedMonthly > 0) {
    const monthsCovered = after.cash.currentCashAvailable / predictedMonthly;
    if (monthsCovered < DEFAULT_EMERGENCY_FUND_MONTHS) {
      return "R1";
    }
  }

  for (const goal of after.goals) {
    if (goal.delayDays > 30) {
      return "R2";
    }
  }

  if (after.safeToSpend.unclampedDiscretionaryPool < 0) {
    return "R5";
  }

  const income = after.cash.totalIncome;
  if (income > 0) {
    const projectedRate =
      (income - after.cash.totalExpenses) / income;
    if (projectedRate < after.savings.targetRate) {
      return "R3";
    }
  } else if (purchaseAmount > 0) {
    return "R3";
  }

  void before;
  return "R4";
}

function findEmergencyFundFromOutput(output: EngineOutput) {
  return output.goals.find((g) => g.isEmergencyFund);
}

function buildImpacts(before: EngineOutput, after: EngineOutput) {
  const beforeEmergency = findEmergencyFundFromOutput(before);
  const afterEmergency = findEmergencyFundFromOutput(after);

  const emergencyFundDelayDays =
    (afterEmergency?.delayDays ?? 0) - (beforeEmergency?.delayDays ?? 0);

  const goalDelays = after.goals
    .filter((g) => g.delayDays > 0)
    .map((g) => ({
      goalName: g.name,
      delayDays: g.delayDays,
    }));

  return {
    emergencyFundDelayDays,
    savingsRateBefore: before.savings.actualRate,
    savingsRateAfter: after.savings.actualRate,
    goalDelays,
  };
}

function getPredictedMonthly(input: EngineInput): number {
  const recurringTotal = input.fixedExpenses.reduce(
    (s, e) => s + e.expectedAmount,
    0,
  );
  const historicalVariableAverage = calculateHistoricalVariableAverage(
    input.historicalCycles,
  );
  return calculatePredictedMonthlyExpenses({
    recurringTotal,
    variableEstimate: input.variableEstimate,
    historicalVariableAverage: historicalVariableAverage ?? undefined,
    completedCyclesCount: input.completedCyclesCount,
  });
}

function projectInputForward(
  input: EngineInput,
  targetDate: Date,
): EngineInput {
  const today = input.today ?? new Date();
  const daysForward = Math.max(
    0,
    Math.ceil(
      (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  if (daysForward === 0) {
    return input;
  }

  const predictedMonthly = getPredictedMonthly(input);
  const netDailySavings = (input.expectedIncome - predictedMonthly) / 30;

  const projectedGoals = input.goals.map((goal) => {
    const requirements = calculateGoalRequirementsForGoal(goal, today);
    const dailyContribution = requirements.requiredMonthlySavings / 30;
    const projected = Math.min(
      goal.targetAmount,
      goal.storedCurrentAmount + dailyContribution * daysForward,
    );
    return { ...goal, storedCurrentAmount: Math.round(projected) };
  });

  const projectedCash = Math.max(
    0,
    Math.round(
      (input.cycle.startingBalance +
        input.transactions.reduce(
          (sum, tx) => sum + (tx.type === "INCOME" ? tx.amount : -tx.amount),
          0,
        ) +
        netDailySavings * daysForward) as number,
    ),
  );

  const startingBalance = input.cycle.startingBalance;
  const currentNet =
    input.transactions.reduce(
      (sum, tx) => sum + (tx.type === "INCOME" ? tx.amount : -tx.amount),
      0,
    ) + startingBalance;
  const cashDelta = projectedCash - currentNet;

  return {
    ...input,
    goals: projectedGoals,
    today: targetDate,
    transactions:
      cashDelta > 0
        ? [
            ...input.transactions,
            {
              amount: cashDelta,
              type: "INCOME" as const,
              category: "INCOME" as const,
              createdAt: targetDate,
            },
          ]
        : cashDelta < 0
          ? [
              ...input.transactions,
              {
                amount: Math.abs(cashDelta),
                type: "EXPENSE" as const,
                category: "OTHER" as const,
                createdAt: targetDate,
              },
            ]
          : input.transactions,
  };
}

function calculateGoalRequirementsForGoal(
  goal: EngineInput["goals"][0],
  today: Date,
) {
  const remainingAmount = Math.max(
    0,
    goal.targetAmount - goal.storedCurrentAmount,
  );
  const monthsRemaining = Math.max(
    1,
    Math.ceil(
      (goal.targetDate.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24 * 30),
    ),
  );
  const requiredMonthlySavings =
    remainingAmount > 0
      ? Math.ceil(remainingAmount / monthsRemaining)
      : 0;

  return { requiredMonthlySavings };
}

function findSuggestedWaitUntil(
  input: EngineInput,
  purchase: PurchaseSimulationInput,
): string | null {
  const today = input.today ?? new Date();
  const baseline = evaluatePurchase(input, purchase);

  if (baseline.recommendation === "GO_AHEAD") {
    return null;
  }

  for (let offset = 1; offset <= MAX_WAIT_SEARCH_DAYS; offset++) {
    const candidate = new Date(today);
    candidate.setDate(candidate.getDate() + offset);

    const projected = projectInputForward(input, candidate);
    const result = evaluatePurchase(projected, {
      ...purchase,
      purchaseDate: candidate,
    });

    if (result.recommendation === "GO_AHEAD") {
      return candidate.toISOString();
    }
  }

  return null;
}

export function simulatePurchase(
  input: EngineInput,
  purchase: PurchaseSimulationInput,
): PurchaseSimulationOutput {
  const core = evaluatePurchase(input, purchase);

  const suggestedWaitUntil =
    core.recommendation === "WAIT"
      ? findSuggestedWaitUntil(input, purchase)
      : null;

  return { ...core, suggestedWaitUntil };
}

function evaluatePurchase(
  input: EngineInput,
  purchase: PurchaseSimulationInput,
): Omit<PurchaseSimulationOutput, "suggestedWaitUntil"> {
  const beforeOutput = calculateEngineOutput(input);
  const simulatedInput = applyHypotheticalPurchase(input, purchase);
  const afterOutput = calculateEngineOutput(simulatedInput);

  const triggeredRule = evaluateRules(
    beforeOutput,
    afterOutput,
    purchase.amount,
  );
  const recommendation: PurchaseRecommendation =
    triggeredRule === "R4" ? "GO_AHEAD" : "WAIT";

  return {
    recommendation,
    triggeredRule: recommendation === "GO_AHEAD" ? "R4" : triggeredRule,
    impacts: buildImpacts(beforeOutput, afterOutput),
    before: {
      safeToSpend: beforeOutput.safeToSpend,
      healthScore: beforeOutput.healthScore,
      savings: beforeOutput.savings,
      goals: beforeOutput.goals,
    },
    after: {
      safeToSpend: afterOutput.safeToSpend,
      healthScore: afterOutput.healthScore,
      savings: afterOutput.savings,
      goals: afterOutput.goals,
    },
  };
}
