import { describe, expect, it } from "vitest";
import { computePersistedGoalAmounts } from "../src/goal-persistence.js";
import { simulatePurchase } from "../src/purchase-simulation.js";
import {
  calculateWeeklyReview,
  filterTransactionsInRange,
  getCalendarWeekBounds,
} from "../src/weekly-review.js";
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

describe("computePersistedGoalAmounts", () => {
  it("allocates cycle surplus to goals by priority", () => {
    const persisted = computePersistedGoalAmounts(
      baseInput.goals,
      baseInput.transactions,
      baseInput.today,
    );

    expect(persisted.g1).toBe(180000 + (170000 - 61000));
  });
});

describe("simulatePurchase", () => {
  it("returns GO_AHEAD for small purchase", () => {
    const result = simulatePurchase(baseInput, {
      itemName: "Coffee",
      amount: 5000,
    });

    expect(result.recommendation).toBe("GO_AHEAD");
    expect(result.triggeredRule).toBe("R4");
    expect(result.suggestedWaitUntil).toBeNull();
  });

  it("returns WAIT for large purchase", () => {
    const result = simulatePurchase(baseInput, {
      itemName: "iPhone",
      amount: 320000,
    });

    expect(result.recommendation).toBe("WAIT");
    expect(["R1", "R2", "R3"]).toContain(result.triggeredRule);
    expect(result.impacts.savingsRateAfter).toBeLessThan(
      result.impacts.savingsRateBefore,
    );
  });
});

describe("calculateWeeklyReview", () => {
  it("computes calendar week stats", () => {
    const { weekStart, weekEnd } = getCalendarWeekBounds(
      new Date("2025-06-25"),
      "Asia/Karachi",
    );

    expect(weekStart.getDay()).toBe(1);

    const weekTx = filterTransactionsInRange(
      [
        {
          amount: 170000,
          type: "INCOME",
          category: "INCOME",
          createdAt: new Date("2025-06-24"),
        },
        {
          amount: 61000,
          type: "EXPENSE",
          category: "FOOD",
          createdAt: new Date("2025-06-24"),
        },
      ],
      weekStart,
      weekEnd,
    );

    const review = calculateWeeklyReview({
      timezone: "Asia/Karachi",
      weekStart,
      weekEnd,
      transactions: weekTx,
      priorWeekTransactions: [],
      goals: baseInput.goals,
      goalsAtWeekStart: baseInput.goals.map((g) => ({
        ...g,
        storedCurrentAmount: g.storedCurrentAmount - 5000,
      })),
      expectedIncome: 170000,
      predictedMonthlyExpenses: 70000,
      savingsRateTarget: 0.2,
    });

    expect(review.income).toBe(170000);
    expect(review.spent).toBe(61000);
    expect(review.saved).toBe(109000);
    expect(review.overallRating).toBeDefined();
    expect(review.version).toBe("1.0.0");
  });
});
