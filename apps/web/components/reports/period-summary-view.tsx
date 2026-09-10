"use client";

import { useQuery } from "convex/react";
import { ContentSection, StatStrip } from "@/components/layouts/surface";
import { CategoryBreakdownList } from "@/components/reports/category-breakdown-list";
import { SpendingTrendChart } from "@/components/reports/spending-trend-chart";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/session";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS, type Category } from "@nexa/shared";
import type { ReportPeriod } from "@/lib/report-period";

export function PeriodSummaryView({ period, date }: { period: ReportPeriod; date?: number }) {
  const { token } = useSession();
  const { formatAmount } = useCurrency();

  const data = useQuery(api.reports.getSummary, token ? { sessionToken: token, period, date } : "skip");

  if (data === undefined) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-xl bg-muted/40" />
        <div className="h-40 animate-pulse rounded-xl bg-muted/40" />
      </div>
    );
  }

  const largestExpense = data.largestExpense as { amount: number; category: Category; description: string | null } | null;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <StatStrip
          items={[
            { label: "Income", value: formatAmount(data.income) },
            { label: "Spent", value: formatAmount(data.expenses) },
            { label: "Saved", value: formatAmount(data.saved), valueClassName: cn(data.saved >= 0 ? "text-primary" : "text-destructive") },
          ]}
        />
      </div>

      {data.trend.some((bucket) => bucket.expenses > 0) ? (
        <ContentSection title="Spending trend">
          <SpendingTrendChart data={data.trend} formatAmount={formatAmount} />
        </ContentSection>
      ) : null}

      <ContentSection title="Spending by category">
        <CategoryBreakdownList byCategory={data.byCategory} formatAmount={formatAmount} />
      </ContentSection>

      {largestExpense ? (
        <ContentSection title="Largest expense">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span>
              {largestExpense.description ? (
                <>
                  {largestExpense.description}
                  <span className="ml-2 text-muted-foreground">{CATEGORY_LABELS[largestExpense.category]}</span>
                </>
              ) : (
                CATEGORY_LABELS[largestExpense.category]
              )}
            </span>
            <span className="font-mono font-medium tabular-nums">{formatAmount(largestExpense.amount)}</span>
          </div>
        </ContentSection>
      ) : null}
    </div>
  );
}
