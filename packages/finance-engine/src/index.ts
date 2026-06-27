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

export { calculateEngineOutput as buildDashboardSummary } from "./engine.js";
