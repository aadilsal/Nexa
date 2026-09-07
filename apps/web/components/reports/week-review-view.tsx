"use client";

import { useAction, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import type { WeeklyReviewOutput } from "@nexa/finance-engine";
import { ContentSection, StatStrip } from "@/components/layouts/surface";
import { CategoryBreakdownList } from "@/components/reports/category-breakdown-list";
import { SpendingTrendChart } from "@/components/reports/spending-trend-chart";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/session";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { track } from "@nexa/analytics/react";

interface WeeklyReviewData {
  review: WeeklyReviewOutput;
  narrative: string;
}

export function WeekReviewView() {
  const { token } = useSession();
  const { formatAmount } = useCurrency();
  const getWeeklyReview = useAction(api.reviews.getWeeklyReview);
  const [data, setData] = useState<WeeklyReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const trendData = useQuery(api.reports.getSummary, token ? { sessionToken: token, period: "week" } : "skip");

  const load = useCallback(() => {
    if (!token) return;
    setIsLoading(true);
    setIsError(false);
    getWeeklyReview({ sessionToken: token })
      .then((result) => setData(result as unknown as WeeklyReviewData))
      .catch(() => setIsError(true))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (data) track("weekly_review_opened");
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-28 animate-pulse rounded-xl bg-muted/40" />
        <div className="h-20 animate-pulse rounded-xl bg-muted/40" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium text-destructive">Couldn&apos;t load your weekly review</p>
        <p className="mt-2 text-muted-foreground">Your review is built from your logged transactions and goals — we couldn&apos;t fetch it right now.</p>
        <Button className="mt-4" size="sm" variant="outline" onClick={load}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {new Date(data.review.weekStart).toLocaleDateString()} – {new Date(data.review.weekEnd).toLocaleDateString()}
        </p>
        <h2 className="text-2xl font-semibold capitalize tracking-tight">{data.review.overallRating.replace(/_/g, " ").toLowerCase()} week</h2>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">{data.narrative}</p>
      </header>

      <StatStrip
        items={[
          { label: "Income", value: formatAmount(data.review.income) },
          { label: "Spent", value: formatAmount(data.review.spent) },
          { label: "Saved", value: formatAmount(data.review.saved), valueClassName: cn(data.review.saved >= 0 ? "text-primary" : "text-destructive") },
        ]}
      />

      {trendData?.trend.some((bucket) => bucket.expenses > 0) ? (
        <ContentSection title="Spending trend">
          <SpendingTrendChart data={trendData.trend} formatAmount={formatAmount} />
        </ContentSection>
      ) : null}

      <ContentSection title="Spending by category">
        <CategoryBreakdownList byCategory={data.review.byCategory} formatAmount={formatAmount} />
      </ContentSection>

      {data.review.goalProgress.length > 0 ? (
        <ContentSection title="Goal progress">
          <ul className="divide-y divide-border/50">
            {data.review.goalProgress.map((goal) => (
              <li key={goal.goalName} className="flex items-center justify-between gap-4 py-3 text-sm first:pt-0">
                <span>{goal.goalName}</span>
                <span className={cn("font-medium", goal.onTrack ? "text-success" : "text-warning")}>
                  {goal.progressDelta >= 0 ? "+" : ""}
                  {goal.progressDelta}%
                </span>
              </li>
            ))}
          </ul>
        </ContentSection>
      ) : null}
    </div>
  );
}
