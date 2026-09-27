import { describe, expect, it } from "vitest";
import { calculateZakat, GOLD_NISAB_GRAMS, SILVER_NISAB_GRAMS, type ZakatInput } from "../src/zakat";
import { loanPerson, separateLoans, summarizeLoans } from "../src/loans";
import { detectRecurring } from "../src/recurring";
import { calculateSpendingPace } from "../src/pace";
import { parseTransactionInput } from "../src/parser";
import { calculateIncomeTax, taxYearFor } from "../src/tax";

describe("calculateIncomeTax (Pakistan)", () => {
  const base = { businessIncome: 0, itExportIncome: 0, psebRegistered: false, filer: true, taxYear: 2027 };

  it("applies Tax Year 2027 salaried slabs at bracket edges", () => {
    expect(calculateIncomeTax({ ...base, salaryIncome: 600_000 }).totalTax).toBe(0);
    expect(calculateIncomeTax({ ...base, salaryIncome: 1_200_000 }).totalTax).toBe(6_000);
    expect(calculateIncomeTax({ ...base, salaryIncome: 2_200_000 }).totalTax).toBe(116_000);
    expect(calculateIncomeTax({ ...base, salaryIncome: 4_100_000 }).totalTax).toBe(541_000);
    expect(calculateIncomeTax({ ...base, salaryIncome: 7_000_000 }).totalTax).toBe(1_424_000);
    expect(calculateIncomeTax({ ...base, salaryIncome: 12_000_000 }).surcharge).toBe(0); // abolished in TY2027
  });

  it("uses non-salaried slabs when salary is 75% or less of taxable income", () => {
    const r = calculateIncomeTax({ ...base, salaryIncome: 600_000, businessIncome: 600_000 });
    expect(r.regime).toBe("non-salaried");
    expect(r.totalTax).toBe(90_000); // 15% of the 600k above the threshold
  });

  it("taxes IT export income separately at the section 154A final rate", () => {
    expect(calculateIncomeTax({ ...base, salaryIncome: 0, itExportIncome: 4_000_000, psebRegistered: true }).totalTax).toBe(10_000);
    expect(calculateIncomeTax({ ...base, salaryIncome: 0, itExportIncome: 4_000_000 }).totalTax).toBe(40_000);
  });

  it("flags outdated rates instead of guessing for a future tax year", () => {
    const r = calculateIncomeTax({ ...base, salaryIncome: 1_200_000, taxYear: 2028 });
    expect(r.taxYear).toBe(2027);
    expect(r.ratesOutdated).toBe(true);
  });

  it("names the tax year by the June it ends in", () => {
    expect(taxYearFor(new Date(2026, 8, 27))).toBe(2027);
    expect(taxYearFor(new Date(2026, 5, 30))).toBe(2026);
  });
});

const DAY = 24 * 60 * 60 * 1000;

const baseZakat: ZakatInput = {
  cash: 0,
  goldGrams: 0,
  goldPricePerGram: 30000,
  silverGrams: 0,
  silverPricePerGram: 300,
  receivables: 0,
  investments: 0,
  businessStock: 0,
  otherAssets: 0,
  debtsDueNow: 0,
  loanInstallmentsNext12Months: 0,
  alreadyDeducted: 0,
};

describe("calculateZakat (Hanafi)", () => {
  it("charges 2.5% of net wealth above the silver nisab", () => {
    const r = calculateZakat({ ...baseZakat, cash: 1_000_000 });
    expect(r.nisabBasisUsed).toBe("silver");
    expect(r.nisabValue).toBe(Math.round(SILVER_NISAB_GRAMS * 300)); // 183,708
    expect(r.meetsNisab).toBe(true);
    expect(r.zakatDue).toBe(25_000);
  });

  it("owes nothing below nisab", () => {
    const r = calculateZakat({ ...baseZakat, cash: 150_000 });
    expect(r.meetsNisab).toBe(false);
    expect(r.zakatDue).toBe(0);
  });

  it("deducts debts due now and only 12 months of long-term instalments", () => {
    const r = calculateZakat({ ...baseZakat, cash: 1_000_000, debtsDueNow: 100_000, loanInstallmentsNext12Months: 100_000 });
    expect(r.netZakatable).toBe(800_000);
    expect(r.zakatDue).toBe(20_000);
  });

  it("includes jewellery gold and receivables in zakatable wealth", () => {
    const r = calculateZakat({ ...baseZakat, cash: 200_000, goldGrams: 10, receivables: 50_000 });
    expect(r.totalAssets).toBe(200_000 + 300_000 + 50_000);
    expect(r.zakatDue).toBe(Math.round(550_000 * 0.025));
  });

  it("uses the gold nisab when gold is the only zakatable wealth", () => {
    const below = calculateZakat({ ...baseZakat, goldGrams: 80 });
    expect(below.nisabBasisUsed).toBe("gold");
    expect(below.meetsNisab).toBe(false);
    const above = calculateZakat({ ...baseZakat, goldGrams: GOLD_NISAB_GRAMS });
    expect(above.meetsNisab).toBe(true);
  });

  it("credits zakat the bank already deducted", () => {
    const r = calculateZakat({ ...baseZakat, cash: 1_000_000, alreadyDeducted: 12_000 });
    expect(r.zakatDue).toBe(25_000);
    expect(r.remainingToPay).toBe(13_000);
  });
});

describe("loans", () => {
  it("extracts the person from bank and manual descriptions", () => {
    expect(loanPerson("Transfer to Imad Mehar")).toBe("Imad Mehar");
    expect(loanPerson("From Muhammad Ruban Ahmed")).toBe("Muhammad Ruban Ahmed");
    expect(loanPerson("Lent Ali")).toBe("Ali");
    expect(loanPerson("Ali paid back")).toBe("Ali");
  });

  it("keeps loans out of stats but in cash, and tracks who owes whom", () => {
    const txs = [
      { type: "EXPENSE" as const, amount: 5000, category: "LOAN", description: "Lent Ali", createdAt: 1 },
      { type: "INCOME" as const, amount: 2000, category: "LOAN", description: "Ali paid back", createdAt: 2 },
      { type: "INCOME" as const, amount: 3000, category: "LOAN", description: "Borrowed from Sara", createdAt: 3 },
      { type: "EXPENSE" as const, amount: 800, category: "FOOD", description: "Lunch", createdAt: 4 },
    ];
    const { regular, netLoanFlow } = separateLoans(txs);
    expect(regular).toHaveLength(1);
    expect(netLoanFlow).toBe(-5000 + 2000 + 3000);
    const summary = summarizeLoans(txs);
    expect(summary.owedToYou).toBe(3000); // Ali still owes 3000
    expect(summary.youOwe).toBe(3000); // you owe Sara 3000
  });

  it("parses loan direction from manual entries", () => {
    expect(parseTransactionInput("Lent Ali 5000")).toMatchObject({ category: "LOAN", type: "EXPENSE" });
    expect(parseTransactionInput("Ali paid back 5000")).toMatchObject({ category: "LOAN", type: "INCOME" });
  });
});

describe("detectRecurring", () => {
  const now = Date.UTC(2026, 8, 27);
  it("finds a steady monthly subscription", () => {
    const txs = [0, 1, 2].map((i) => ({
      description: "ACME* SOFTWARE SUB +14155550100",
      amount: 5900 + i * 30,
      type: "EXPENSE" as const,
      category: "OTHER",
      createdAt: now - (2 - i) * 30 * DAY - 5 * DAY,
    }));
    const [charge] = detectRecurring(txs, now);
    expect(charge).toMatchObject({ cadence: "monthly", occurrences: 3 });
    expect(charge!.monthlyCost).toBeGreaterThan(5900);
  });

  it("ignores irregular, varying or stopped charges", () => {
    const irregular = [1, 4].map((d) => ({ description: "Jazz top up", amount: 1300, type: "EXPENSE" as const, category: "UTILITIES", createdAt: now - d * DAY }));
    const stopped = [200, 170, 140].map((d) => ({ description: "Gym", amount: 3000, type: "EXPENSE" as const, category: "HEALTHCARE", createdAt: now - d * DAY }));
    expect(detectRecurring([...irregular, ...stopped], now)).toEqual([]);
  });
});

describe("calculateSpendingPace", () => {
  it("compares month-to-date with the same days last month", () => {
    const today = new Date(2026, 8, 10, 12);
    const txs = [
      { amount: 12000, type: "EXPENSE" as const, category: "FOOD", createdAt: new Date(2026, 8, 5).getTime() },
      { amount: 10000, type: "EXPENSE" as const, category: "FOOD", createdAt: new Date(2026, 7, 5).getTime() },
      { amount: 99999, type: "EXPENSE" as const, category: "FOOD", createdAt: new Date(2026, 7, 25).getTime() }, // after same-day cutoff
      { amount: 5000, type: "EXPENSE" as const, category: "LOAN", createdAt: new Date(2026, 8, 6).getTime() }, // loans excluded
    ];
    expect(calculateSpendingPace(txs, today)).toEqual({ thisMonth: 12000, lastMonthSameDays: 10000, changePercent: 20 });
  });
});
