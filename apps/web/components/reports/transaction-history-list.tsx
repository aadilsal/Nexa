"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { ChevronDown } from "lucide-react";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@nexa/shared";
import { Button } from "@/components/ui/button";
import { TransactionFeed } from "@/components/transaction-feed";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/session";
import type { ReportPeriod } from "@/lib/report-period";

const STEP = 40;

/** Day-grouped transactions for a period with a category filter and "Show more" (no pages). */
export function TransactionHistoryList({ period, date }: { period: ReportPeriod; date?: number }) {
  const { token } = useSession();
  const [category, setCategory] = useState<"ALL" | Category>("ALL");
  const [limit, setLimit] = useState(STEP);

  const data = useQuery(
    api.transactions.history,
    token
      ? { sessionToken: token, period, date, page: 1, pageSize: limit, category: category === "ALL" ? undefined : category }
      : "skip",
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <h2 className="text-base font-semibold tracking-tight">
          Transactions{data ? <span className="ml-1.5 font-normal text-muted-foreground">{data.total}</span> : null}
        </h2>
        <label className="relative flex min-h-11 items-center">
          <span className="sr-only">Filter by category</span>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as "ALL" | Category);
              setLimit(STEP);
            }}
            className="h-9 cursor-pointer appearance-none rounded-full bg-card py-0 pl-3.5 pr-8 text-sm font-medium text-foreground shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="ALL">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </label>
      </div>

      {data === undefined ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-card">No transactions in this period.</p>
      ) : (
        <>
          <TransactionFeed items={data.items} />
          {data.total > data.items.length ? (
            <Button variant="outline" className="mt-4 h-11 w-full rounded-xl" onClick={() => setLimit((n) => n + STEP)}>
              Show more ({data.total - data.items.length} left)
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}
