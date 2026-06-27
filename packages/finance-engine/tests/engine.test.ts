import { describe, expect, it } from "vitest";
import {
  calculateCashPosition,
  calculatePredictedMonthlyExpenses,
  parseTransactionInput,
  suggestEmergencyFundTarget,
} from "../src/index.js";

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
