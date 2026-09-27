export { parseTransactionInput } from "./parser.js";
export type { ParsedTransactionResult } from "./parser.js";

export { parseBankMessage } from "./bank-message.js";

export { separateLoans, summarizeLoans, loanPerson, LOAN_CATEGORY } from "./loans.js";
export type { LoanBalance } from "./loans.js";
export { detectRecurring } from "./recurring.js";
export type { RecurringCharge, RecurringInputTx } from "./recurring.js";
export { calculateSpendingPace } from "./pace.js";
export type { SpendingPace } from "./pace.js";
export {
  calculateZakat,
  nextZakatDate,
  ZAKAT_RATE,
  TOLA_GRAMS,
  SILVER_NISAB_GRAMS,
  GOLD_NISAB_GRAMS,
  LUNAR_YEAR_DAYS,
} from "./zakat.js";
export type { ZakatInput, ZakatResult, NisabBasis } from "./zakat.js";
export { calculateIncomeTax, taxYearFor, slabTax, TAX_TABLES } from "./tax.js";
export type { IncomeTaxInput, IncomeTaxResult, TaxSlab, TaxTable } from "./tax.js";
export type { BankMessageResult, BankMessageOptions } from "./bank-message.js";

export {
  calculateCashPosition,
  calculatePredictedMonthlyExpenses,
  suggestEmergencyFundTarget,
} from "./expenses.js";
export type { CashPositionInput, CashPositionResult } from "./expenses.js";

export {
  getDaysRemaining,
  computeCycleDates,
  computeNextCycleDates,
} from "./cycle.js";
export type { CycleDates } from "./cycle.js";

export { calculateEngineOutput, diffEngineOutput } from "./engine.js";

export { computePersistedGoalAmounts } from "./goal-persistence.js";

export { simulatePurchase } from "./purchase-simulation.js";
export type {
  PurchaseSimulationInput,
  PurchaseSimulationOutput,
  PurchaseRecommendation,
  PurchaseTriggeredRule,
} from "./purchase-simulation.js";

export {
  calculateWeeklyReview,
  getCalendarWeekBounds,
  filterTransactionsInRange,
} from "./weekly-review.js";
export type {
  WeeklyReviewInput,
  WeeklyReviewOutput,
  WeeklyRating,
} from "./weekly-review.js";

export { calculateMonthlyReview } from "./monthly-review.js";
export type {
  MonthlyReviewInput,
  MonthlyReviewOutput,
} from "./monthly-review.js";

export {
  groupExpensesByCategory,
  findExtremeCategory,
  calculatePeriodSummary,
} from "./category-breakdown.js";
export type { PeriodSummary, PeriodTransaction } from "./category-breakdown.js";

export {
  getPeriodBounds,
  getCalendarMonthBounds,
  getCalendarYearBounds,
} from "./period-bounds.js";
export type { ReportPeriod } from "./period-bounds.js";

export { buildTrendBuckets } from "./trend-buckets.js";
export type { TrendBucket } from "./trend-buckets.js";

export { detectSpendingTrends } from "./spending-trend.js";
export type {
  CategorySpendingTrend,
  SpendingTrendDirection,
} from "./spending-trend.js";

export { calculateCashFlowForecast } from "./cash-flow-forecast.js";
export type { CashFlowForecast, CashFlowForecastInput } from "./cash-flow-forecast.js";

export { detectGoalRisks } from "./goal-risk.js";
export type { GoalRisk, GoalRiskLevel, GoalRiskInput } from "./goal-risk.js";

export type {
  EngineInput,
  EngineOutput,
  EngineTransaction,
  EngineGoal,
  EngineFixedExpense,
  EngineCycle,
  HistoricalCycle,
  ComputedGoal,
  PostLogEngineDiff,
} from "./types.js";

export type { BudgetStatus } from "./variance.js";
