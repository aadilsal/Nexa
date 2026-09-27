import type { Category, TransactionType } from "@nexa/shared";

// Money lent to / borrowed from people (category LOAN). It moves cash but is neither spending
// nor income, so it is kept out of every spending/income/savings statistic while still counting
// towards cash on hand.

export const LOAN_CATEGORY: Category = "LOAN";

interface LoanLike {
  type: TransactionType;
  amount: number;
  category: string;
}

/** Splits out loan transactions; `netLoanFlow` (+in / −out) keeps cash totals exact. */
export function separateLoans<T extends LoanLike>(transactions: T[]): { regular: T[]; netLoanFlow: number } {
  const regular: T[] = [];
  let netLoanFlow = 0;
  for (const tx of transactions) {
    if (tx.category === LOAN_CATEGORY) netLoanFlow += tx.type === "INCOME" ? tx.amount : -tx.amount;
    else regular.push(tx);
  }
  return { regular, netLoanFlow };
}

const LEADING = /^(transfer(red)? to|sent to|from|lent to|lent|loan to|loan from|borrowed from|borrowed|paid back by|repaid by|refund from|udhaar|udhar)\s+/i;
const TRAILING = /\s+(paid back|repaid|returned|loan|udhaar|udhar)$/i;

/** Person a loan transaction refers to, e.g. "Transfer to Imad Mehar" → "Imad Mehar". */
export function loanPerson(description: string): string {
  let name = description.trim();
  for (let i = 0; i < 2; i++) name = name.replace(LEADING, "").replace(TRAILING, "").trim();
  return name
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ") || "Someone";
}

export interface LoanBalance {
  person: string;
  lent: number; // money that went out to them (you lent / you repaid them)
  received: number; // money that came in from them (they repaid / you borrowed)
  balance: number; // > 0: they owe you; < 0: you owe them
  lastActivity: number;
}

export function summarizeLoans(
  transactions: Array<LoanLike & { description: string; createdAt: number }>,
): { people: LoanBalance[]; owedToYou: number; youOwe: number } {
  const byPerson = new Map<string, LoanBalance>();
  for (const tx of transactions) {
    if (tx.category !== LOAN_CATEGORY) continue;
    const person = loanPerson(tx.description);
    const key = person.toLowerCase();
    const entry = byPerson.get(key) ?? { person, lent: 0, received: 0, balance: 0, lastActivity: 0 };
    if (tx.type === "EXPENSE") entry.lent += tx.amount;
    else entry.received += tx.amount;
    entry.balance = entry.lent - entry.received;
    entry.lastActivity = Math.max(entry.lastActivity, tx.createdAt);
    byPerson.set(key, entry);
  }
  const people = [...byPerson.values()].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  return {
    people,
    owedToYou: people.reduce((s, p) => s + Math.max(0, p.balance), 0),
    youOwe: people.reduce((s, p) => s + Math.max(0, -p.balance), 0),
  };
}
