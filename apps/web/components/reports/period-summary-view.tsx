"use client";

import { useQuery } from "@tanstack/react-query";
import { ContentSection, StatStrip } from "@/components/layouts/surface";
import { CategoryBreakdownList } from "@/components/reports/category-breakdown-list";
import { SpendingTrendChart, type TrendBucket } from "@/components/reports/spending-trend-chart";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS, type Category } from "@nexa/shared";
import type { ReportPeriod } from "@/lib/report-period";

interface PeriodSummaryData {
  periodStart: string;
  periodEnd: string;
  income: number;
  expenses: number;
  saved: number;
  byCategory: Partial<Record<Category, number>>;
  transactionCount: number;
  averageDailySpend: number;
  largestExpense: {
    amount: number;
    category: Category;
    description: string | null;
  } | null;
  trend: TrendBucket[];
}

function formatPeriodRange(start: string, end: string, period: ReportPeriod) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (period === "year") {
    return startDate.getFullYear().toString();
  }
  if (period === "month") {
    return startDate.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }
  return `${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`;
}

export function PeriodSummaryView({ period }: { period: ReportPeriod }) {
  const { formatAmount } = useCurrency();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reports-summary", period],
    queryFn: () => api<PeriodSummaryData>(`/reports/summary?period=${period}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-xl bg-muted/40" />
        <div className="h-40 animate-pulse rounded-xl bg-muted/40" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium text-destructive">Couldn&apos;t load this report</p>
        <Button className="mt-4" size="sm" variant="outline" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {formatPeriodRange(data.periodStart, data.periodEnd, period)}
        </p>
        <StatStrip
          items={[
            { label: "Income", value: formatAmount(data.income) },
            { label: "Spent", value: formatAmount(data.expenses) },
            {
              label: "Saved",
              value: formatAmount(data.saved),
              valueClassName: cn(
                data.saved >= 0 ? "text-primary" : "text-destructive",
              ),
            },
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

      {data.largestExpense ? (
        <ContentSection title="Largest expense">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span>
              {data.largestExpense.description ? (
                <>
                  {data.largestExpense.description}
                  <span className="ml-2 text-muted-foreground">
                    {CATEGORY_LABELS[data.largestExpense.category]}
                  </span>
                </>
              ) : (
                CATEGORY_LABELS[data.largestExpense.category]
              )}
            </span>
            <span className="font-mono font-medium tabular-nums">
              {formatAmount(data.largestExpense.amount)}
            </span>
          </div>
        </ContentSection>
      ) : null}
    </div>
  );
}
