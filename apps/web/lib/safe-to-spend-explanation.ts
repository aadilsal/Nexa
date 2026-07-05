import type { SafeToSpendExplanation } from "@/components/widgets/safe-to-spend-card";

function getTotalCycleDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );
}

function prorateForCycle(
  monthlyAmount: number,
  daysRemaining: number,
  totalCycleDays: number,
): number {
  return Math.round(monthlyAmount * (daysRemaining / totalCycleDays));
}

interface DashboardGoal {
  id: string;
  name: string;
  progress: number;
  targetAmount: number;
  isEmergencyFund: boolean;
  requiredMonthlySavings?: number;
  eta: string;
  onTrack: boolean;
}

interface DashboardForExplanation {
  cycle: { startDate: string; endDate: string; daysRemaining: number };
  cash: {
    startingBalance: number;
    totalIncome: number;
    totalExpenses: number;
  };
  goals: DashboardGoal[];
  variance: {
    fixedExpenses: Array<{ name: string; expected: number }>;
  };
  safeToSpend: {
    breakdown?: {
      emergencyFundProtection: number;
    };
  };
}

export function buildSafeToSpendExplanation(
  dashboard: DashboardForExplanation,
): SafeToSpendExplanation | undefined {
  if (!dashboard.safeToSpend.breakdown) return undefined;

  const totalCycleDays = getTotalCycleDays(
    dashboard.cycle.startDate,
    dashboard.cycle.endDate,
  );
  const { daysRemaining } = dashboard.cycle;

  const fixedBills = dashboard.variance.fixedExpenses.map((expense) => ({
    name: expense.name,
    monthlyAmount: expense.expected,
    reservedAmount: prorateForCycle(
      expense.expected,
      daysRemaining,
      totalCycleDays,
    ),
  }));

  const goalContributions = dashboard.goals
    .filter(
      (goal) =>
        !goal.isEmergencyFund && (goal.requiredMonthlySavings ?? 0) > 0,
    )
    .map((goal) => ({
      name: goal.name,
      monthlyAmount: goal.requiredMonthlySavings ?? 0,
      reservedAmount: prorateForCycle(
        goal.requiredMonthlySavings ?? 0,
        daysRemaining,
        totalCycleDays,
      ),
    }));

  const emergencyGoal = dashboard.goals.find((goal) => goal.isEmergencyFund);
  const emergencyFund =
    emergencyGoal &&
    dashboard.safeToSpend.breakdown.emergencyFundProtection > 0
      ? {
          name: emergencyGoal.name,
          monthlyAmount: emergencyGoal.requiredMonthlySavings ?? 0,
          reservedAmount:
            dashboard.safeToSpend.breakdown.emergencyFundProtection,
        }
      : undefined;

  return {
    totalCycleDays,
    daysRemaining,
    cashDetail: {
      startingBalance: dashboard.cash.startingBalance,
      incomeLogged: dashboard.cash.totalIncome,
      expensesLogged: dashboard.cash.totalExpenses,
    },
    fixedBills,
    goalContributions,
    emergencyFund,
  };
}
