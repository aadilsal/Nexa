"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ContentSection, StatStrip } from "@/components/layouts/surface";
import { CategoryBreakdownList } from "@/components/reports/category-breakdown-list";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { FEATURE_HELP } from "@/lib/feature-help";
import { track } from "@nexa/analytics/react";
import type { Category } from "@nexa/shared";

interface WeeklyReviewData {
  review: {
    weekStart: string;
    weekEnd: string;
    income: number;
    spent: number;
    saved: number;
    overallRating: string;
    byCategory: Partial<Record<Category, number>>;
    goalProgress: Array<{
      goalName: string;
      progressDelta: number;
      onTrack: boolean;
    }>;
  };
  narrative: string;
}

export function WeekReviewView() {
  const { formatAmount } = useCurrency();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["weekly-review"],
    queryFn: () => api<WeeklyReviewData>("/reviews/weekly"),
  });

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
        <p className="mt-2 text-muted-foreground">
          Your review is built from your logged transactions and goals — we
          couldn&apos;t fetch it right now.
        </p>
        <Button className="mt-4" size="sm" variant="outline" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {new Date(data.review.weekStart).toLocaleDateString()} –{" "}
          {new Date(data.review.weekEnd).toLocaleDateString()}
        </p>
        <h2 className="text-2xl font-semibold capitalize tracking-tight">
          {data.review.overallRating.replace(/_/g, " ").toLowerCase()} week
        </h2>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          {data.narrative}
        </p>
      </header>

      <StatStrip
        items={[
          { label: "Income", value: formatAmount(data.review.income) },
          { label: "Spent", value: formatAmount(data.review.spent) },
          {
            label: "Saved",
            value: formatAmount(data.review.saved),
            valueClassName: cn(
              data.review.saved >= 0 ? "text-primary" : "text-destructive",
            ),
          },
        ]}
      />

      <ContentSection title="Spending by category">
        <CategoryBreakdownList byCategory={data.review.byCategory} formatAmount={formatAmount} />
      </ContentSection>

      {data.review.goalProgress.length > 0 ? (
        <ContentSection title="Goal progress" info={FEATURE_HELP.goalProgress}>
          <ul className="divide-y divide-border/50">
            {data.review.goalProgress.map((goal) => (
              <li
                key={goal.goalName}
                className="flex items-center justify-between gap-4 py-3 text-sm first:pt-0"
              >
                <span>{goal.goalName}</span>
                <span
                  className={cn(
                    "font-medium",
                    goal.onTrack ? "text-success" : "text-warning",
                  )}
                >
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
