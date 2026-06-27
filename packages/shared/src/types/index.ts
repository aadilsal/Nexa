import type { Category, CycleStatus, GoalPriority, TransactionType } from "../constants/index.js";

export interface TransactionPayload {
  description: string;
  amount: number;
  category: Category;
  type: TransactionType;
  notes?: string;
}

export interface EffectiveTransaction extends TransactionPayload {
  eventId: string;
  createdAt: string;
}

export interface CycleInfo {
  id: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  status: CycleStatus;
  startingBalance: number;
}

export interface GoalData {
  id: string;
  name: string;
  priority: GoalPriority;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  isEmergencyFund: boolean;
}

export interface FixedExpenseData {
  id: string;
  name: string;
  category: Category;
  expectedAmount: number;
}

export interface IncomeExpectationData {
  id: string;
  name: string;
  expectedAmount: number;
}

export interface DashboardSummary {
  version: string;
  calculatedAt: string;
  cycle: CycleInfo;
  cash: {
    startingBalance: number;
    totalIncome: number;
    totalExpenses: number;
    currentCashAvailable: number;
  };
  goals: Array<{
    id: string;
    name: string;
    priority: GoalPriority;
    targetAmount: number;
    progress: number;
    targetDate: string;
    isEmergencyFund: boolean;
  }>;
  transactionCount: number;
}

export interface PostLogFeedback {
  transaction: TransactionPayload & { eventId: string };
  cash: {
    before: number;
    after: number;
  };
}
