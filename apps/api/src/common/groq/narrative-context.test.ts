import { describe, expect, it } from "vitest";
import {
  buildDeterministicNarrative,
  buildDisplayValues,
  finalizeNarrative,
  resolvePlaceholders,
} from "./narrative-context";

describe("narrative-context", () => {
  it("builds purchase display values", () => {
    const values = buildDisplayValues({
      itemName: "IPHONE 16 PRO",
      amount: 260_000,
      currency: "PKR",
      impacts: {
        savingsRateBefore: 0.831,
        savingsRateAfter: -0.04,
        emergencyFundDelayDays: 1,
      },
      suggestedWaitUntil: "2026-11-15T00:00:00.000Z",
    });

    expect(values.itemName).toBe("IPHONE 16 PRO");
    expect(values.purchaseAmount).toContain("260");
    expect(values.savingsRateBefore).toBe("83.1%");
    expect(values.savingsRateAfter).toBe("-4%");
    expect(values.suggestedWaitUntil).toBeTruthy();
  });

  it("resolves [amount] placeholders in purchase copy", () => {
    const data = {
      itemName: "IPHONE 16 PRO",
      amount: 260_000,
      currency: "PKR",
      recommendation: "WAIT",
      impacts: {
        savingsRateBefore: 0.831,
        savingsRateAfter: -0.04,
        emergencyFundDelayDays: 1,
      },
      suggestedWaitUntil: "2026-11-15T00:00:00.000Z",
    };
    const values = buildDisplayValues(data);
    const raw =
      "Wait for IPHONE [amount] PRO at PKR 260,000. Savings rate drops from 0.831 to -[amount]. Wait until [amount]-[amount]-[amount].";

    const resolved = resolvePlaceholders(raw, values);
    expect(resolved).not.toMatch(/\[amount\]/i);
    expect(resolved).toContain("IPHONE 16 PRO");
    expect(resolved).toContain("-4%");
  });

  it("builds weekly review narrative with savings rate percent", () => {
    const narrative = buildDeterministicNarrative({
      weekStart: "2026-06-01",
      income: 25_000,
      spent: 4_218,
      saved: 20_782,
      savingsRate: 0.831,
      savingsRateTarget: 0.1,
      overallRating: "GOOD",
      highestSpendingCategory: { category: "SHOPPING", amount: 3_491 },
      currency: "PKR",
    });

    expect(narrative).toContain("25,000");
    expect(narrative).toContain("83.1%");
    expect(narrative).not.toMatch(/\[amount\]/i);
  });

  it("falls back to deterministic narrative when placeholders remain", () => {
    const data = {
      weekStart: "2026-06-01",
      income: 25_000,
      spent: 4_218,
      saved: 20_782,
      savingsRate: 0.831,
      savingsRateTarget: 0.1,
      overallRating: "GOOD",
      currency: "PKR",
    };

    const finalized = finalizeNarrative(
      "You saved [amount]% this week.",
      data,
      "PKR",
    );

    expect(finalized).toContain("83.1%");
    expect(finalized).not.toMatch(/\[amount\]/i);
  });
});
