// Zakat on wealth, per the Hanafi school (predominant in Pakistan). Rules encoded:
// - Rate: 2.5% (1/40) of net zakatable wealth, due once a lunar (Hijri) year on the same Hijri
//   date nisab was first held, assessed on what is owned on that date.
// - Nisab: 52.5 tola (612.36 g) of silver for cash or mixed assets — the lower threshold, which
//   the Hanafi school applies as more beneficial to the poor (Mufti Taqi Usmani, Fiqhi Maqalat).
//   If the only zakatable wealth is gold, the gold nisab of 7.5 tola (87.48 g) applies instead.
// - Zakatable: cash (home, bank, savings, foreign currency), all gold and silver including worn
//   jewellery (Hanafi), money owed to you that you expect to recover, trade goods at sale value,
//   and investments/shares at market value.
// - Not zakatable: home, car, furniture, personal effects, tools; doubtful debts (zakat is paid
//   for one year when such money is actually recovered).
// - Deductible: debts due now / within about a month; for long-term loans only the next 12 months
//   of instalments, never the full balance.
// - Pakistan: banks auto-deduct zakat on 1st Ramadan from profit-bearing savings accounts; any
//   amount already deducted this Zakat year is credited against what is due.

export const ZAKAT_RATE = 0.025;
export const TOLA_GRAMS = 11.664;
export const SILVER_NISAB_GRAMS = 612.36; // 52.5 tola
export const GOLD_NISAB_GRAMS = 87.48; // 7.5 tola
/** Days in a lunar year — used to schedule the next Zakat date. */
export const LUNAR_YEAR_DAYS = 354;

export type NisabBasis = "silver" | "gold";

export interface ZakatInput {
  cash: number; // cash in hand + bank balances + savings (primary currency)
  goldGrams: number; // all gold incl. worn jewellery, in grams of the karat priced below
  goldPricePerGram: number;
  silverGrams: number;
  silverPricePerGram: number;
  receivables: number; // money owed to you that you expect back
  investments: number; // shares, mutual funds, crypto etc. at market value
  businessStock: number; // trade goods at sale value
  otherAssets: number;
  debtsDueNow: number; // debts/bills due now or within about a month
  loanInstallmentsNext12Months: number; // long-term loans: only the next 12 months
  alreadyDeducted: number; // e.g. deducted by your bank on 1st Ramadan this Zakat year
  nisabBasis?: NisabBasis; // default silver (Hanafi, mixed assets)
}

export interface ZakatResult {
  goldValue: number;
  silverValue: number;
  totalAssets: number;
  deductions: number;
  netZakatable: number;
  nisabBasisUsed: NisabBasis;
  nisabValue: number;
  meetsNisab: boolean;
  zakatDue: number; // gross 2.5%
  remainingToPay: number; // after crediting amounts already deducted
}

const nonNeg = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function calculateZakat(input: ZakatInput): ZakatResult {
  const goldValue = nonNeg(input.goldGrams) * nonNeg(input.goldPricePerGram);
  const silverValue = nonNeg(input.silverGrams) * nonNeg(input.silverPricePerGram);
  const otherWealth =
    nonNeg(input.cash) + nonNeg(input.receivables) + nonNeg(input.investments) + nonNeg(input.businessStock) + nonNeg(input.otherAssets);
  const totalAssets = goldValue + silverValue + otherWealth;
  const deductions = nonNeg(input.debtsDueNow) + nonNeg(input.loanInstallmentsNext12Months);
  const netZakatable = Math.max(0, totalAssets - deductions);

  // Gold-only holdings use the gold nisab; anything mixed (or cash) uses the chosen basis.
  const onlyGold = goldValue > 0 && silverValue === 0 && otherWealth === 0;
  const nisabBasisUsed: NisabBasis = onlyGold ? "gold" : (input.nisabBasis ?? "silver");
  const nisabValue =
    nisabBasisUsed === "gold" ? GOLD_NISAB_GRAMS * nonNeg(input.goldPricePerGram) : SILVER_NISAB_GRAMS * nonNeg(input.silverPricePerGram);

  // Without a price for the nisab metal we can't judge the threshold; treat as not met.
  const meetsNisab = nisabValue > 0 && netZakatable >= nisabValue;
  const zakatDue = meetsNisab ? Math.round(netZakatable * ZAKAT_RATE) : 0;
  const remainingToPay = Math.max(0, zakatDue - Math.round(nonNeg(input.alreadyDeducted)));

  return {
    goldValue: Math.round(goldValue),
    silverValue: Math.round(silverValue),
    totalAssets: Math.round(totalAssets),
    deductions: Math.round(deductions),
    netZakatable: Math.round(netZakatable),
    nisabBasisUsed,
    nisabValue: Math.round(nisabValue),
    meetsNisab,
    zakatDue,
    remainingToPay,
  };
}

/** Next Zakat date: one lunar year after the last one (same Hijri date). */
export function nextZakatDate(lastZakatDate: Date): Date {
  const next = new Date(lastZakatDate);
  next.setDate(next.getDate() + LUNAR_YEAR_DAYS);
  return next;
}
