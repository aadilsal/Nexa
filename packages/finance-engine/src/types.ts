import type { Category, GoalPriority, TransactionType } from "@nexa/shared";

export interface EngineTransaction {
  amount: number;
  type: TransactionType;
  category: Category;
  createdAt: Date;
}

export interface EngineGoal {
  id: string;
  name: string;
  priority: GoalPriority;
  targetAmount: number;
  targetDate: Date;
  isEmergencyFund: boolean;
  storedCurrentAmount: number;
}

export interface EngineFixedExpense {
  name: string;
  category: Category;
  expectedAmount: number;
}

export interface EngineCycle {
  id: string;
  startDate: Date;
  endDate: Date;
  status: "ACTIVE" | "COMPLETED" | "PENDING_CONFIRMATION";
  startingBalance: number;
}

export interface HistoricalCycle {
  startDate: Date;
  endDate: Date;
  transactions: EngineTransaction[];
  recurringTotal: number;
}

export interface EngineInput {
  cycle: EngineCycle;
  transactions: EngineTransaction[];
  goals: EngineGoal[];
  fixedExpenses: EngineFixedExpense[];
  expectedIncome: number;
  variableEstimate: number;
  completedCyclesCount: number;
  historicalCycles: HistoricalCycle[];
  today?: Date;
}

export interface ComputedGoal {
  id: string;
  name: string;
  priority: GoalPriority;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  targetDate: string;
  isEmergencyFund: boolean;
  requiredMonthlySavings: number;
  eta: string;
  onTrack: boolean;
  delayDays: number;
}

export interface EngineOutput {
  version: string;
  calculatedAt: string;
  cycle: {
    id: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    status: string;
    startingBalance: number;
  };
  cash: {
    startingBalance: number;
    totalIncome: number;
    totalExpenses: number;
    currentCashAvailable: number;
  };
  safeToSpend: {
    today: number;
    baseline: number;
    trendMultiplier: number;
    discretionaryPool: number;
  };
  healthScore: {
    overall: number;
    breakdown: {
      savingsRate: number;
      emergencyFund: number;
      goalProgress: number;
      spendingConsistency: number;
      incomeStability: number;
    };
  };
  savings: {
    actualRate: number;
    targetRate: number;
    projectedSavings: number;
  };
  goals: ComputedGoal[];
  expenses: {
    predictedMonthly: number;
    recurring: number;
    variable: number;
    variableSource: "ESTIMATED" | "HISTORICAL";
  };
  variance: {
    income: { expected: number; actual: number; variance: number };
    fixedExpenses: Array<{
      name: string;
      expected: number;
      actual: number;
      variance: number;
    }>;
  };
  charity: {
    thisCycle: number;
    thisYear: number;
  };
  transactionCount: number;
}

export interface PostLogEngineDiff {
  safeToSpend: { before: number; after: number };
  healthScore: { before: number; after: number };
}
