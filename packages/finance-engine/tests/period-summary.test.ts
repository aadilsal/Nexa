import { describe, expect, it } from "vitest";
import { calculatePeriodSummary } from "../src/category-breakdown.js";
import {
  getCalendarMonthBounds,
  getCalendarYearBounds,
  getPeriodBounds,
} from "../src/period-bounds.js";
import { buildTrendBuckets } from "../src/trend-buckets.js";
import type { PeriodTransaction } from "../src/category-breakdown.js";

const transactions: PeriodTransaction[] = [
  {
    amount: 170000,
    type: "INCOME",
    category: "INCOME",
    createdAt: new Date("2025-06-05"),
    description: "Salary",
  },
  {
    amount: 20000,
    type: "EXPENSE",
    category: "FOOD",
    createdAt: new Date("2025-06-10"),
    description: "Groceries",
  },
  {
    amount: 60000,
    type: "EXPENSE",
    category: "HOUSING",
    createdAt: new Date("2025-06-12"),
    description: "Rent",
  },
];

describe("calculatePeriodSummary", () => {
  it("sums income/expenses and groups categories", () => {
    const summary = calculatePeriodSummary(
      transactions,
      new Date("2025-06-01"),
      new Date("2025-06-30"),
    );

    expect(summary.income).toBe(170000);
    expect(summary.expenses).toBe(80000);
    expect(summary.saved).toBe(90000);
    expect(summary.byCategory.FOOD).toBe(20000);
    expect(summary.byCategory.HOUSING).toBe(60000);
    expect(summary.highestCategory?.category).toBe("HOUSING");
    expect(summary.lowestCategory?.category).toBe("FOOD");
    expect(summary.largestExpense?.category).toBe("HOUSING");
    expect(summary.largestExpense?.description).toBe("Rent");
    expect(summary.transactionCount).toBe(3);
  });

  it("handles an empty period without dividing by zero", () => {
    const summary = calculatePeriodSummary(
      [],
      new Date("2025-06-01"),
      new Date("2025-06-30"),
    );

    expect(summary.income).toBe(0);
    expect(summary.expenses).toBe(0);
    expect(summary.byCategory).toEqual({});
    expect(summary.highestCategory).toBeNull();
    expect(summary.largestExpense).toBeNull();
  });
});

describe("getCalendarMonthBounds", () => {
  it("returns first and last instant of the month", () => {
    const { start, end } = getCalendarMonthBounds(new Date("2025-06-15"));
    expect(start.toISOString()).toBe(new Date("2025-06-01T00:00:00.000").toISOString());
    expect(end.toISOString()).toBe(new Date("2025-06-30T23:59:59.999").toISOString());
  });

  it("handles December correctly (year rollover)", () => {
    const { start, end } = getCalendarMonthBounds(new Date("2025-12-10"));
    expect(start.getMonth()).toBe(11);
    expect(end.getMonth()).toBe(11);
    expect(end.getDate()).toBe(31);
  });
});

describe("getCalendarYearBounds", () => {
  it("returns Jan 1 to Dec 31 of the reference year", () => {
    const { start, end } = getCalendarYearBounds(new Date("2025-06-15"));
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(11);
    expect(end.getDate()).toBe(31);
  });
});

describe("buildTrendBuckets", () => {
  it("buckets a month's transactions by day", () => {
    const { start, end } = getCalendarMonthBounds(new Date("2025-06-15"));
    const buckets = buildTrendBuckets(transactions, "month", start, end);

    expect(buckets).toHaveLength(30);
    const day10 = buckets.find((b) => b.label === "10");
    const day12 = buckets.find((b) => b.label === "12");
    expect(day10?.expenses).toBe(20000);
    expect(day12?.expenses).toBe(60000);
    expect(buckets.find((b) => b.label === "1")?.expenses).toBe(0);
  });

  it("buckets a year's transactions by month", () => {
    const { start, end } = getCalendarYearBounds(new Date("2025-06-15"));
    const buckets = buildTrendBuckets(transactions, "year", start, end);

    expect(buckets).toHaveLength(12);
    expect(buckets.map((b) => b.label)).toEqual([
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ]);
    const june = buckets.find((b) => b.label === "Jun");
    expect(june?.income).toBe(170000);
    expect(june?.expenses).toBe(80000);
    expect(buckets.find((b) => b.label === "Jan")?.expenses).toBe(0);
  });
});

describe("getPeriodBounds", () => {
  it("dispatches to the correct bounds function per period", () => {
    const ref = new Date("2025-06-15");
    expect(getPeriodBounds("month", ref)).toEqual(getCalendarMonthBounds(ref));
    expect(getPeriodBounds("year", ref)).toEqual(getCalendarYearBounds(ref));
  });
});
