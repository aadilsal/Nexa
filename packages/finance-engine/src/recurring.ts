import type { TransactionType } from "@nexa/shared";

// Detects subscriptions and other recurring charges from transaction history: the same payee
// charged a similar amount at a regular weekly or monthly interval.

export interface RecurringInputTx {
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  createdAt: number;
}

export interface RecurringCharge {
  name: string;
  cadence: "weekly" | "monthly";
  averageAmount: number;
  monthlyCost: number;
  occurrences: number;
  lastDate: number;
  nextDate: number;
}

const DAY = 24 * 60 * 60 * 1000;

/** Payee key: lowercase words without digits/punctuation, so "ACME* SUB +1415" ≈ "Acme sub". */
function payeeKey(description: string): string {
  return description
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 3)
    .join(" ");
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export function detectRecurring(transactions: RecurringInputTx[], today: number = Date.now()): RecurringCharge[] {
  const groups = new Map<string, RecurringInputTx[]>();
  for (const tx of transactions) {
    if (tx.type !== "EXPENSE" || tx.category === "LOAN") continue;
    const key = payeeKey(tx.description);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(tx);
    groups.set(key, list);
  }

  const charges: RecurringCharge[] = [];
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    list.sort((a, b) => a.createdAt - b.createdAt);
    const gaps = list.slice(1).map((tx, i) => (tx.createdAt - list[i]!.createdAt) / DAY);
    const gap = median(gaps);
    const cadence = gap >= 25 && gap <= 35 ? "monthly" : gap >= 6 && gap <= 8 ? "weekly" : null;
    if (!cadence) continue;

    const amounts = list.map((t) => t.amount);
    if (Math.max(...amounts) > Math.min(...amounts) * 1.25) continue; // amount must be steady

    const last = list[list.length - 1]!;
    if (today - last.createdAt > gap * 1.6 * DAY) continue; // stopped — probably cancelled

    const averageAmount = Math.round(amounts.reduce((s, a) => s + a, 0) / amounts.length);
    charges.push({
      name: last.description,
      cadence,
      averageAmount,
      monthlyCost: cadence === "monthly" ? averageAmount : Math.round(averageAmount * 4.33),
      occurrences: list.length,
      lastDate: last.createdAt,
      nextDate: last.createdAt + Math.round(gap) * DAY,
    });
  }
  return charges.sort((a, b) => b.monthlyCost - a.monthlyCost);
}
