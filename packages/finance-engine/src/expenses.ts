import type { TransactionType } from "@nexa/shared";
import { DEFAULT_EMERGENCY_FUND_MONTHS } from "@nexa/shared";

export interface CashPositionInput {
  startingBalance: number;
  transactions: Array<{ amount: number; type: TransactionType }>;
}

export interface CashPositionResult {
  startingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  currentCashAvailable: number;
}

export function calculateCashPosition(input: CashPositionInput): CashPositionResult {
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const tx of input.transactions) {
    if (tx.type === "INCOME") {
      totalIncome += tx.amount;
    } else {
      totalExpenses += tx.amount;
    }
  }

  return {
    startingBalance: input.startingBalance,
    totalIncome,
    totalExpenses,
    currentCashAvailable: input.startingBalance + totalIncome - totalExpenses,
  };
}

export interface PredictedExpensesInput {
  recurringTotal: number;
  variableEstimate?: number;
  historicalVariableAverage?: number;
  completedCyclesCount: number;
}

export function calculatePredictedMonthlyExpenses(
  input: PredictedExpensesInput,
): number {
  const variable =
    input.completedCyclesCount >= 2 && input.historicalVariableAverage != null
      ? input.historicalVariableAverage
      : (input.variableEstimate ?? 0);

  return input.recurringTotal + variable;
}

export function suggestEmergencyFundTarget(predictedMonthlyExpenses: number): number {
  return predictedMonthlyExpenses * DEFAULT_EMERGENCY_FUND_MONTHS;
}
