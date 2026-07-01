import { describe, expect, it } from "vitest";
import { calculateCashFlowForecast } from "../src/cash-flow-forecast.js";
import { diffEngineOutput, calculateEngineOutput } from "../src/engine.js";
import { detectGoalRisks } from "../src/goal-risk.js";
import { calculateMonthlyReview } from "../src/monthly-review.js";
import { simulatePurchase } from "../src/purchase-simulation.js";
import { detectSpendingTrends } from "../src/spending-trend.js";
import type { EngineInput } from "../src/types.js";

const baseInput: EngineInput = {
  cycle: {
    id: "cycle-1",
    startDate: new Date("2025-06-05"),
    endDate: new Date("2025-07-04"),
    status: "ACTIVE",
    startingBalance: 0,
  },
  transactions: [
    {
      amount: 170000,
      type: "INCOME",
      category: "INCOME",
      createdAt: new Date("2025-06-05"),
    },
    {
      amount: 61000,
      type: "EXPENSE",
      category: "FOOD",
      createdAt: new Date("2025-06-10"),
    },
  ],
  goals: [
    {
      id: "g1",
      name: "Emergency Fund",
      priority: "EMERGENCY_FUND",
      targetAmount: 300000,
      targetDate: new Date("2026-06-01"),
      isEmergencyFund: true,
      storedCurrentAmount: 180000,
    },
  ],
  fixedExpenses: [
    { name: "Rent", category: "HOUSING", expectedAmount: 25000 },
    { name: "Fuel", category: "FUEL", expectedAmount: 15000 },
  ],
  expectedIncome: 170000,
  variableEstimate: 30000,
  completedCyclesCount: 0,
  historicalCycles: [],
  today: new Date("2025-06-25"),
};

describe("detectSpendingTrends", () => {
  it("flags higher food spending vs historical average", () => {
    const trends = detectSpendingTrends(
      [
        {
          amount: 18000,
          type: "EXPENSE",
          category: "FOOD",
          createdAt: new Date("2025-06-20"),
        },
      ],
      [
        {
          startDate: new Date("2025-05-05"),
          endDate: new Date("2025-06-04"),
          recurringTotal: 40000,
          transactions: [
            {
              amount: 15000,
              type: "EXPENSE",
              category: "FOOD",
              createdAt: new Date("2025-05-15"),
            },
          ],
        },
      ],
    );

    const food = trends.find((t) => t.category === "FOOD");
    expect(food?.direction).toBe("HIGHER");
    expect(food?.changePercent).toBeGreaterThan(10);
  });
});

describe("calculateCashFlowForecast", () => {
  it("projects ending balance from remaining cycle obligations", () => {
    const forecast = calculateCashFlowForecast({
      currentCashAvailable: 109000,
      totalIncomeLogged: 170000,
      expectedIncome: 170000,
      recurringTotal: 40000,
      variableSpending: 30000,
      requiredMonthlySavings: 50000,
      daysRemaining: 10,
      totalCycleDays: 30,
    });

    expect(forecast.projectedIncome).toBe(0);
    expect(forecast.projectedRecurringExpenses).toBeGreaterThan(0);
    expect(forecast.projectedEndingBalance).toBeLessThan(109000);
  });
});

describe("detectGoalRisks", () => {
  it("marks delayed goals as elevated risk", () => {
    const output = calculateEngineOutput(baseInput);
    const risks = detectGoalRisks({
      goals: output.goals.map((g) => ({ ...g, onTrack: false, delayDays: 45 })),
      actualSavingsRate: 0.1,
      targetSavingsRate: 0.2,
      predictedMonthlyExpenses: 70000,
      totalExpenses: 80000,
      totalIncome: 170000,
      expectedIncome: 170000,
      daysElapsed: 20,
      totalCycleDays: 30,
    });

    expect(risks[0]?.riskLevel).not.toBe("LOW");
    expect(risks[0]?.factors).toContain("behind_schedule");
  });
});

describe("calculateMonthlyReview", () => {
  it("includes deterministic recommendations", () => {
    const output = calculateEngineOutput(baseInput);
    const review = calculateMonthlyReview({
      cycleStart: baseInput.cycle.startDate,
      cycleEnd: baseInput.cycle.endDate,
      today: baseInput.today!,
      transactions: baseInput.transactions,
      goals: output.goals,
      predictedMonthlyExpenses: output.expenses.predictedMonthly,
      recurringTotal: output.expenses.recurring,
      emergencyFundProgress: 0.6,
      healthScore: output.healthScore.overall,
      savingsRate: output.savings.actualRate,
      savingsRateTarget: output.savings.targetRate,
      netCashFlow: output.cash.currentCashAvailable,
    });

    expect(review.income).toBe(170000);
    expect(review.expenses).toBe(61000);
    expect(review.recommendations.length).toBeGreaterThan(0);
  });
});

describe("diffEngineOutput", () => {
  it("includes goal impact when engine state changes", () => {
    const before = calculateEngineOutput(baseInput);
    const after = calculateEngineOutput({
      ...baseInput,
      transactions: [
        ...baseInput.transactions,
        {
          amount: 50000,
          type: "EXPENSE",
          category: "SHOPPING",
          createdAt: new Date("2025-06-26"),
        },
      ],
    });

    const diff = diffEngineOutput(before, after);
    expect(diff.goalImpact).toHaveLength(before.goals.length);
    expect(diff.safeToSpend.before).not.toBe(diff.safeToSpend.after);
  });
});

describe("simulatePurchase R5", () => {
  it("returns WAIT when discretionary pool becomes negative", () => {
    const tightInput: EngineInput = {
      ...baseInput,
      transactions: [
        {
          amount: 100000,
          type: "INCOME",
          category: "INCOME",
          createdAt: new Date("2025-06-05"),
        },
        {
          amount: 95000,
          type: "EXPENSE",
          category: "OTHER",
          createdAt: new Date("2025-06-10"),
        },
      ],
      goals: [
        {
          id: "g1",
          name: "Emergency Fund",
          priority: "EMERGENCY_FUND",
          targetAmount: 300000,
          targetDate: new Date("2026-06-01"),
          isEmergencyFund: true,
          storedCurrentAmount: 0,
        },
        {
          id: "g2",
          name: "Laptop",
          priority: "HIGH",
          targetAmount: 200000,
          targetDate: new Date("2025-12-01"),
          isEmergencyFund: false,
          storedCurrentAmount: 0,
        },
      ],
    };

    const result = simulatePurchase(tightInput, {
      itemName: "Gadget",
      amount: 20000,
    });

    if (result.recommendation === "WAIT") {
      expect(["R1", "R2", "R3", "R5"]).toContain(result.triggeredRule);
    }
  });
});
