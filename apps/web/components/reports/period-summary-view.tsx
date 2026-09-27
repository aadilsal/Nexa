"use client";

import { useQuery } from "convex/react";
import { StatStrip } from "@/components/layouts/surface";
import { CategoryBreakdownList } from "@/components/reports/category-breakdown-list";
import { SpendingTrendChart } from "@/components/reports/spending-trend-chart";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/session";
import { useCurrency } from "@/lib/currency";
import type { ReportPeriod } from "@/lib/report-period";

export function PeriodSummaryView({ period, date }: { period: ReportPeriod; date?: number }) {
  const { token } = useSession();
  const { formatAmount } = useCurrency();

  const data = useQuery(api.reports.getSummary, token ? { sessionToken: token, period, date } : "skip");

  if (data === undefined) {
    return (
      <div className="space-y-3">
        <div className="h-20 animate-pulse rounded-2xl bg-card" />
        <div className="h-48 animate-pulse rounded-2xl bg-card" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StatStrip
        items={[
          { label: "Income", value: formatAmount(data.income), valueClassName: "text-financial-positive" },
          { label: "Spent", value: formatAmount(data.expenses) },
          { label: "Saved", value: formatAmount(data.saved), valueClassName: data.saved >= 0 ? "text-primary" : "text-financial-negative" },
        ]}
      />

      {data.trend.some((bucket) => bucket.expenses > 0) ? (
        <section>
          <h2 className="mb-3 px-1 text-base font-semibold tracking-tight">Spending over time</h2>
          <div className="rounded-2xl bg-card p-4 shadow-card">
            <SpendingTrendChart data={data.trend} formatAmount={formatAmount} />
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 px-1 text-base font-semibold tracking-tight">By category</h2>
        <CategoryBreakdownList byCategory={data.byCategory} formatAmount={formatAmount} />
      </section>
    </div>
  );
}
