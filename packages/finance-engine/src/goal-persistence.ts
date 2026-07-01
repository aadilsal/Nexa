import {
  allocateGoals,
  calculateGoalRequirements,
} from "./goals.js";
import type { EngineGoal, EngineTransaction } from "./types.js";

/** Persisted stored amounts after applying cycle surplus waterfall. */
export function computePersistedGoalAmounts(
  goals: EngineGoal[],
  transactions: EngineTransaction[],
  today: Date = new Date(),
): Record<string, number> {
  const requirements = calculateGoalRequirements(goals, today);
  const allocated = allocateGoals(requirements, transactions, today);
  const result: Record<string, number> = {};

  for (const goal of allocated) {
    result[goal.goal.id] = goal.currentAmount;
  }

  return result;
}
