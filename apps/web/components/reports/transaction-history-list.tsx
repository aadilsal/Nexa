"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@nexa/shared";
import { EnumSelect } from "@/components/enum-select";
import { RecategorizeSelect } from "@/components/recategorize-select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/widgets/empty-state";
import { api } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { ReportPeriod } from "@/lib/report-period";
import type { CurrencyCode } from "@nexa/shared";

interface HistoryItem {
  id: string;
  description: string;
  amount: number;
  currency?: string;
  category: string;
  type: string;
  createdAt: string;
}

interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

type CategoryFilter = "ALL" | Category;

const FILTER_OPTIONS: readonly CategoryFilter[] = ["ALL", ...CATEGORIES];
const FILTER_LABELS: Record<CategoryFilter, string> = {
  ALL: "All categories",
  ...CATEGORY_LABELS,
};

export function TransactionHistoryList({ period }: { period: ReportPeriod }) {
  const { formatAmount } = useCurrency();
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["transactions-history", period, category, page],
    queryFn: () => {
      const params = new URLSearchParams({
        period,
        page: String(page),
        pageSize: "25",
      });
      if (category !== "ALL") params.set("category", category);
      return api<HistoryResponse>(`/transactions/history?${params.toString()}`);
    },
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <EnumSelect
          value={category}
          onChange={(value) => {
            setCategory(value);
            setPage(1);
          }}
          options={FILTER_OPTIONS}
          labels={FILTER_LABELS}
          compact
          className="w-auto min-w-36"
        />
        {data && data.total > 0 ? (
          <span className="text-xs text-muted-foreground">
            {data.total} transaction{data.total === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions found"
          description="Try a different category filter or period."
        />
      ) : (
        <>
          <ul className="divide-y divide-border/50">
            {data.items.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{tx.description}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <RecategorizeSelect transactionId={tx.id} category={tx.category} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 font-mono text-sm tabular-nums",
                    tx.type === "INCOME" ? "text-financial-positive" : "text-foreground",
                  )}
                >
                  {tx.type === "INCOME" ? "+" : "−"}
                  {formatAmount(tx.amount, tx.currency as CurrencyCode | undefined)}
                </span>
              </li>
            ))}
          </ul>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
