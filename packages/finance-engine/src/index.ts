export { parseTransactionInput } from "./parser.js";
export type { ParsedTransactionResult } from "./parser.js";

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
