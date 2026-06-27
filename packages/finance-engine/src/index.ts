import type { Category, TransactionType } from "@nexa/shared";
import {
  CATEGORY_KEYWORDS,
  DEFAULT_EMERGENCY_FUND_MONTHS,
  ENGINE_VERSION,
  INCOME_KEYWORDS,
} from "@nexa/shared";

export { ENGINE_VERSION };

export interface ParsedTransactionResult {
  description: string;
  amount: number;
  category: Category;
  type: TransactionType;
  confidence: number;
}

function extractAmount(input: string): { amount: number; text: string } | null {
  const amountAtEnd = input.match(/^(.+?)\s+(\d+(?:,\d{3})*(?:\.\d+)?)\s*$/i);
  if (amountAtEnd) {
    return {
      text: amountAtEnd[1].trim(),
      amount: parseInt(amountAtEnd[2].replace(/,/g, ""), 10),
    };
  }

  const amountAtStart = input.match(/^(\d+(?:,\d{3})*(?:\.\d+)?)\s+(.+)$/i);
  if (amountAtStart) {
    return {
      text: amountAtStart[2].trim(),
      amount: parseInt(amountAtStart[1].replace(/,/g, ""), 10),
    };
  }

  return null;
}

function matchCategory(description: string): { category: Category; confidence: number } {
  const normalized = description.toLowerCase().trim();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "OTHER" || category === "INCOME") continue;

    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return { category: category as Category, confidence: 0.9 };
      }
    }
  }

  return { category: "OTHER", confidence: 0.5 };
}

function isIncomeDescription(description: string): boolean {
  const normalized = description.toLowerCase();
  return INCOME_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function parseTransactionInput(rawInput: string): ParsedTransactionResult {
  const trimmed = rawInput.trim();
  const extracted = extractAmount(trimmed);

  if (!extracted || extracted.amount <= 0 || !extracted.text) {
    throw new Error("Could not parse transaction. Use format: 'Description 5000'");
  }

  const isIncome = isIncomeDescription(extracted.text);

  if (isIncome) {
    return {
      description: extracted.text,
      amount: extracted.amount,
      category: "INCOME",
      type: "INCOME",
      confidence: 0.95,
    };
  }

  const { category, confidence } = matchCategory(extracted.text);

  return {
    description: extracted.text,
    amount: extracted.amount,
    category,
    type: "EXPENSE",
    confidence,
  };
}

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

export interface CycleDates {
  startDate: Date;
  endDate: Date;
}

export function getDaysRemaining(endDate: Date, today: Date = new Date()): number {
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

export function computeCycleDates(
  payday: number,
  referenceDate: Date = new Date(),
): CycleDates {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();

  let startDate: Date;
  let endDate: Date;

  if (day >= payday) {
    startDate = new Date(year, month, payday);
    endDate = new Date(year, month + 1, payday - 1);
  } else {
    startDate = new Date(year, month - 1, payday);
    endDate = new Date(year, month, payday - 1);
  }

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

export function computeNextCycleDates(currentEndDate: Date, payday: number): CycleDates {
  const nextStart = new Date(currentEndDate);
  nextStart.setDate(nextStart.getDate() + 1);
  nextStart.setHours(0, 0, 0, 0);

  const nextEnd = new Date(nextStart);
  nextEnd.setMonth(nextEnd.getMonth() + 1);
  nextEnd.setDate(payday - 1);
  nextEnd.setHours(23, 59, 59, 999);

  return { startDate: nextStart, endDate: nextEnd };
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

export interface DashboardInput {
  cycle: {
    id: string;
    startDate: Date;
    endDate: Date;
    status: "ACTIVE" | "COMPLETED" | "PENDING_CONFIRMATION";
    startingBalance: number;
  };
  transactions: Array<{ amount: number; type: TransactionType }>;
  goals: Array<{
    id: string;
    name: string;
    priority: string;
    targetAmount: number;
    targetDate: Date;
    isEmergencyFund: boolean;
  }>;
}

export function buildDashboardSummary(input: DashboardInput) {
  const daysRemaining = getDaysRemaining(input.cycle.endDate);
  const cash = calculateCashPosition({
    startingBalance: input.cycle.startingBalance,
    transactions: input.transactions,
  });

  return {
    version: ENGINE_VERSION,
    calculatedAt: new Date().toISOString(),
    cycle: {
      id: input.cycle.id,
      startDate: input.cycle.startDate.toISOString(),
      endDate: input.cycle.endDate.toISOString(),
      daysRemaining,
      status: input.cycle.status,
      startingBalance: input.cycle.startingBalance,
    },
    cash,
    goals: input.goals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      priority: goal.priority,
      targetAmount: goal.targetAmount,
      progress: 0,
      targetDate: goal.targetDate.toISOString(),
      isEmergencyFund: goal.isEmergencyFund,
    })),
    transactionCount: input.transactions.length,
  };
}
