import type { TransactionType } from "@nexa/shared";

// Month-to-date spending compared with the same days of last month ("you're spending 18% faster").

export interface PaceInputTx {
  amount: number;
  type: TransactionType;
  category: string;
  createdAt: number;
}

export interface SpendingPace {
  thisMonth: number;
  lastMonthSameDays: number;
  changePercent: number | null; // null when there's no comparable spending last month
}

export function calculateSpendingPace(transactions: PaceInputTx[], today: Date = new Date()): SpendingPace {
  const thisStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
  const lastStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).getTime();
  // Same elapsed time into last month, capped at last month's end.
  const lastCutoff = Math.min(lastStart + (today.getTime() - thisStart), thisStart);

  let thisMonth = 0;
  let lastMonthSameDays = 0;
  for (const tx of transactions) {
    if (tx.type !== "EXPENSE" || tx.category === "LOAN") continue;
    if (tx.createdAt >= thisStart && tx.createdAt <= today.getTime()) thisMonth += tx.amount;
    else if (tx.createdAt >= lastStart && tx.createdAt < lastCutoff) lastMonthSameDays += tx.amount;
  }

  return {
    thisMonth: Math.round(thisMonth),
    lastMonthSameDays: Math.round(lastMonthSameDays),
    changePercent: lastMonthSameDays > 0 ? Math.round(((thisMonth - lastMonthSameDays) / lastMonthSameDays) * 100) : null,
  };
}
