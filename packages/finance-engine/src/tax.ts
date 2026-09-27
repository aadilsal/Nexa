// Pakistan income tax for individuals (Income Tax Ordinance 2001, Division I Part I First
// Schedule, as amended by each year's Finance Act). A tax year runs 1 July – 30 June and is named
// after the year it ends in (Tax Year 2027 = 1 Jul 2026 – 30 Jun 2027).
//
// Rates are data, one table per tax year, and the calculator picks the table for the date. When
// a new Finance Act takes effect (1 July) its table must be added below; until then the latest
// table is used and `ratesOutdated` is set so the app can warn instead of silently guessing.
//
// Rules applied:
// - Salaried slabs apply to total taxable income only when salary exceeds 75% of it; otherwise
//   the non-salaried (business individual) slabs apply.
// - IT/IT-enabled export income remitted through banks (section 154A) is a separate final tax:
//   0.25% for filers registered with PSEB, 1% otherwise (doubled for non-filers).

export interface TaxSlab {
  from: number; // slab applies to income above this
  fixed: number; // tax on income up to `from`
  rate: number; // on the excess over `from`
}

export interface TaxTable {
  taxYear: number;
  law: string;
  salaried: TaxSlab[];
  nonSalaried: TaxSlab[];
  surcharge?: { threshold: number; salariedRate: number; nonSalariedRate: number }; // % of tax
  itExport: { filerPseb: number; filerNoPseb: number; nonFilerPseb: number; nonFilerNoPseb: number };
}

const IT_EXPORT_2026_2029 = { filerPseb: 0.0025, filerNoPseb: 0.01, nonFilerPseb: 0.005, nonFilerNoPseb: 0.02 };

const NON_SALARIED: TaxSlab[] = [
  { from: 0, fixed: 0, rate: 0 },
  { from: 600_000, fixed: 0, rate: 0.15 },
  { from: 1_200_000, fixed: 90_000, rate: 0.2 },
  { from: 1_600_000, fixed: 170_000, rate: 0.3 },
  { from: 3_200_000, fixed: 650_000, rate: 0.4 },
  { from: 5_600_000, fixed: 1_610_000, rate: 0.45 },
];

export const TAX_TABLES: Record<number, TaxTable> = {
  2026: {
    taxYear: 2026,
    law: "Finance Act 2025",
    salaried: [
      { from: 0, fixed: 0, rate: 0 },
      { from: 600_000, fixed: 0, rate: 0.01 },
      { from: 1_200_000, fixed: 6_000, rate: 0.11 },
      { from: 2_200_000, fixed: 116_000, rate: 0.23 },
      { from: 3_200_000, fixed: 346_000, rate: 0.3 },
      { from: 4_100_000, fixed: 616_000, rate: 0.35 },
    ],
    nonSalaried: NON_SALARIED,
    surcharge: { threshold: 10_000_000, salariedRate: 0.09, nonSalariedRate: 0.1 },
    itExport: IT_EXPORT_2026_2029,
  },
  2027: {
    taxYear: 2027,
    law: "Finance Act 2026 (in force 1 July 2026; salaried surcharge abolished)",
    salaried: [
      { from: 0, fixed: 0, rate: 0 },
      { from: 600_000, fixed: 0, rate: 0.01 },
      { from: 1_200_000, fixed: 6_000, rate: 0.11 },
      { from: 2_200_000, fixed: 116_000, rate: 0.2 },
      { from: 3_200_000, fixed: 316_000, rate: 0.25 },
      { from: 4_100_000, fixed: 541_000, rate: 0.29 },
      { from: 5_600_000, fixed: 976_000, rate: 0.32 },
      { from: 7_000_000, fixed: 1_424_000, rate: 0.35 },
    ],
    nonSalaried: NON_SALARIED,
    itExport: IT_EXPORT_2026_2029,
  },
};

/** Tax year a date falls in (July starts the next tax year). */
export function taxYearFor(date: Date = new Date()): number {
  return date.getMonth() >= 6 ? date.getFullYear() + 1 : date.getFullYear();
}

export function slabTax(income: number, slabs: TaxSlab[]): number {
  let applicable = slabs[0]!;
  for (const slab of slabs) if (income > slab.from) applicable = slab;
  return applicable.fixed + Math.max(0, income - applicable.from) * applicable.rate;
}

export interface IncomeTaxInput {
  salaryIncome: number; // annual, PKR
  businessIncome: number; // annual non-salary taxable income (freelance not under 154A, rent…)
  itExportIncome: number; // annual IT export remittances under section 154A
  psebRegistered: boolean;
  filer: boolean; // on FBR's Active Taxpayers List
  taxYear?: number;
}

export interface IncomeTaxResult {
  taxYear: number;
  law: string;
  ratesOutdated: boolean; // true when no table exists yet for the requested year
  regime: "salaried" | "non-salaried";
  normalTax: number;
  surcharge: number;
  exportTax: number;
  exportRate: number;
  totalTax: number;
  totalIncome: number;
  effectiveRate: number;
  monthly: number;
}

export function calculateIncomeTax(input: IncomeTaxInput): IncomeTaxResult {
  const requested = input.taxYear ?? taxYearFor();
  const years = Object.keys(TAX_TABLES).map(Number).sort((a, b) => a - b);
  const year = TAX_TABLES[requested] ? requested : years.filter((y) => y <= requested).pop() ?? years[years.length - 1]!;
  const table = TAX_TABLES[year]!;

  const salary = Math.max(0, input.salaryIncome || 0);
  const business = Math.max(0, input.businessIncome || 0);
  const taxable = salary + business;
  const regime = taxable > 0 && salary / taxable > 0.75 ? "salaried" : "non-salaried";
  const normalTax = slabTax(taxable, regime === "salaried" ? table.salaried : table.nonSalaried);
  const surcharge =
    table.surcharge && taxable > table.surcharge.threshold
      ? normalTax * (regime === "salaried" ? table.surcharge.salariedRate : table.surcharge.nonSalariedRate)
      : 0;

  const exportIncome = Math.max(0, input.itExportIncome || 0);
  const r = table.itExport;
  const exportRate = input.filer ? (input.psebRegistered ? r.filerPseb : r.filerNoPseb) : input.psebRegistered ? r.nonFilerPseb : r.nonFilerNoPseb;
  const exportTax = exportIncome * exportRate;

  const totalTax = Math.round(normalTax + surcharge + exportTax);
  const totalIncome = taxable + exportIncome;
  return {
    taxYear: year,
    law: table.law,
    ratesOutdated: year !== requested,
    regime,
    normalTax: Math.round(normalTax),
    surcharge: Math.round(surcharge),
    exportTax: Math.round(exportTax),
    exportRate,
    totalTax,
    totalIncome,
    effectiveRate: totalIncome > 0 ? totalTax / totalIncome : 0,
    monthly: Math.round(totalTax / 12),
  };
}
