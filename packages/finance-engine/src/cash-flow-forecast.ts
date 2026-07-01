import { roundPKR } from "./utils.js";

export interface CashFlowForecast {
  projectedIncome: number;
  projectedRecurringExpenses: number;
  projectedVariableSpending: number;
  projectedGoalContributions: number;
  projectedEndingBalance: number;
}

export interface CashFlowForecastInput {
  currentCashAvailable: number;
  totalIncomeLogged: number;
  expectedIncome: number;
  recurringTotal: number;
  variableSpending: number;
  requiredMonthlySavings: number;
  daysRemaining: number;
  totalCycleDays: number;
}

export function calculateCashFlowForecast(
  input: CashFlowForecastInput,
): CashFlowForecast {
  const {
    currentCashAvailable,
    totalIncomeLogged,
    expectedIncome,
    recurringTotal,
    variableSpending,
    requiredMonthlySavings,
    daysRemaining,
    totalCycleDays,
  } = input;

  const remainingRatio =
    totalCycleDays > 0 ? daysRemaining / totalCycleDays : 0;

  const projectedIncome = roundPKR(
    Math.max(0, expectedIncome - totalIncomeLogged),
  );
  const projectedRecurringExpenses = roundPKR(
    recurringTotal * remainingRatio,
  );
  const projectedVariableSpending = roundPKR(
    variableSpending * remainingRatio,
  );
  const projectedGoalContributions = roundPKR(
    requiredMonthlySavings * remainingRatio,
  );

  const projectedEndingBalance = roundPKR(
    currentCashAvailable +
      projectedIncome -
      projectedRecurringExpenses -
      projectedVariableSpending -
      projectedGoalContributions,
  );

  return {
    projectedIncome,
    projectedRecurringExpenses,
    projectedVariableSpending,
    projectedGoalContributions,
    projectedEndingBalance,
  };
}
