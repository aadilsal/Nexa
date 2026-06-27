import { describe, expect, it } from "vitest";
import { calculateHealthScore } from "../src/health-score.js";
import { calculateSafeToSpend } from "../src/safe-to-spend.js";
import {
  calculateCashPosition,
  calculateEngineOutput,
  calculatePredictedMonthlyExpenses,
  parseTransactionInput,
  suggestEmergencyFundTarget,
} from "../src/index.js";
import type { EngineInput } from "../src/types.js";

describe("parseTransactionInput", () => {
  it("parses expense with description first", () => {
    const result = parseTransactionInput("Petrol 7550");
    expect(result).toEqual({
      description: "Petrol",
      amount: 7550,
      category: "FUEL",
      type: "EXPENSE",
      confidence: 0.9,
    });
  });

  it("parses income", () => {
    const result = parseTransactionInput("Salary 120000");
    expect(result).toEqual({
      description: "Salary",
      amount: 120000,
      category: "INCOME",
      type: "INCOME",
      confidence: 0.95,
    });
  });

  it("defaults unknown to OTHER", () => {
    const result = parseTransactionInput("XYZ 500");
    expect(result.category).toBe("OTHER");
    expect(result.type).toBe("EXPENSE");
  });
});

describe("calculateCashPosition", () => {
  it("computes cash from starting balance and transactions", () => {
    const result = calculateCashPosition({
      startingBalance: 15000,
      transactions: [
        { amount: 120000, type: "INCOME" },
        { amount: 45000, type: "INCOME" },
        { amount: 58000, type: "EXPENSE" },
      ],
    });

    expect(result.currentCashAvailable).toBe(122000);
  });
});

describe("predicted expenses", () => {
  it("uses estimate during cold start", () => {
    expect(
      calculatePredictedMonthlyExpenses({
        recurringTotal: 40000,
        variableEstimate: 30000,
        completedCyclesCount: 1,
      }),
    ).toBe(70000);
  });

  it("suggests emergency fund target", () => {
    expect(suggestEmergencyFundTarget(70000)).toBe(210000);
  });
});

describe("calculateSafeToSpend", () => {
  it("matches spec test vector", () => {
    const result = calculateSafeToSpend({
      currentCashAvailable: 109000,
      recurringTotal: 45000,
      totalCycleDays: 30,
      daysRemaining: 10,
      daysElapsed: 20,
      requiredMonthlySavings: 75000,
      emergencyFundRequiredMonthly: 20000,
      emergencyFundCurrent: 180000,
      emergencyFundTarget: 300000,
      historicalCycles: [],
      today: new Date("2025-06-21"),
    });

    expect(result.discretionaryPool).toBe(62333);
    expect(result.baseline).toBe(6233);
    expect(result.today).toBe(6233);
  });
});

describe("calculateHealthScore", () => {
  it("matches spec weighted formula", () => {
    const result = calculateHealthScore({
      totalIncome: 170000,
      totalExpenses: 61000,
      targetSavingsRate: 0.2,
      allocatedGoals: [],
      transactions: [],
      expectedIncome: 170000,
      completedCyclesCount: 0,
    });

    // With empty goals, uses defaults for goal progress
    expect(result.overall).toBeGreaterThan(0);
    expect(result.breakdown.savingsRate).toBe(100);
  });
});

describe("calculateEngineOutput", () => {
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
        storedCurrentAmount: 0,
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

  it("produces full engine output", () => {
    const output = calculateEngineOutput(baseInput);

    expect(output.version).toBe("1.0.0");
    expect(output.cash.currentCashAvailable).toBe(109000);
    expect(output.safeToSpend.today).toBeGreaterThanOrEqual(0);
    expect(output.healthScore.overall).toBeGreaterThan(0);
    expect(output.goals).toHaveLength(1);
    expect(output.expenses.predictedMonthly).toBe(70000);
  });
});
