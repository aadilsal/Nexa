"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { CATEGORIES, CATEGORY_LABELS, type Category, type CurrencyCode } from "@nexa/shared";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useSession } from "@/lib/session";
import { useCurrency } from "@/lib/currency";
import { CATEGORY_ICONS, CATEGORY_TONES } from "@/lib/category-visuals";
import { cn } from "@/lib/utils";

export interface FeedTransaction {
  id: string;
  description: string;
  amount: number;
  currency?: string;
  category: string;
  type: "INCOME" | "EXPENSE";
  createdAt: number;
}

function asCategory(value: string): Category {
  return (CATEGORIES.includes(value as Category) ? value : "OTHER") as Category;
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(ts) === dayKey(today.getTime())) return "Today";
  if (dayKey(ts) === dayKey(yesterday.getTime())) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(d.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  });
}

/** Category badge that doubles as the recategorise control: a native <select> sits invisibly
 *  on top, so a tap opens the platform picker (iOS wheel) without cluttering the row. */
function CategoryBadge({ id, category }: { id: string; category: Category }) {
  const { token } = useSession();
  const updateCategory = useAction(api.transactions.updateCategory);
  const [pending, setPending] = useState(false);
  const Icon = CATEGORY_ICONS[category];

  return (
    <span className={cn("relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full", CATEGORY_TONES[category], pending && "opacity-50")}>
      <Icon className="h-5 w-5" aria-hidden="true" />
      <select
        aria-label={`Category: ${CATEGORY_LABELS[category]}. Change category`}
        value={category}
        disabled={pending || !token}
        onChange={async (e) => {
          if (!token) return;
          setPending(true);
          try {
            await updateCategory({ sessionToken: token, eventId: id as Id<"transactionEvents">, category: e.target.value as Category });
          } finally {
            setPending(false);
          }
        }}
        className="absolute inset-0 cursor-pointer appearance-none rounded-full opacity-0"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
    </span>
  );
}

/** Transactions grouped by day with a net total per day — one scannable list, no pages. */
export function TransactionFeed({ items, className }: { items: FeedTransaction[]; className?: string }) {
  const { formatAmount } = useCurrency();

  const groups: Array<{ key: string; label: string; net: number; items: FeedTransaction[] }> = [];
  for (const tx of items) {
    const key = dayKey(tx.createdAt);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = { key, label: dayLabel(tx.createdAt), net: 0, items: [] };
      groups.push(group);
    }
    group.items.push(tx);
    group.net += tx.type === "INCOME" ? tx.amount : -tx.amount;
  }

  return (
    <div className={cn("space-y-5", className)}>
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label}>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
            <span className={cn("text-xs font-medium tabular-nums", group.net >= 0 ? "text-financial-positive" : "text-muted-foreground")}>
              {group.net >= 0 ? "+" : "−"}
              {formatAmount(Math.abs(group.net))}
            </span>
          </div>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-card">
            {group.items.map((tx) => {
              const category = asCategory(tx.category);
              const income = tx.type === "INCOME";
              return (
                <li key={tx.id} className="flex min-h-16 items-center gap-3 px-4 py-2.5">
                  <CategoryBadge id={tx.id} category={category} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-foreground">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[category]} · {new Date(tx.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className={cn("shrink-0 text-[15px] font-semibold tabular-nums", income ? "text-financial-positive" : "text-foreground")}>
                    {income ? "+" : "−"}
                    {formatAmount(tx.amount, tx.currency as CurrencyCode | undefined)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
