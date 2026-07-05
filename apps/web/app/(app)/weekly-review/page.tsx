"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useEffect } from "react";
import {
  ContentSection,
  PageShell,
  StatStrip,
} from "@/components/layouts/surface";
import { api } from "@/lib/api";
import { track } from "@nexa/analytics/react";
import { cn, formatPKR } from "@/lib/utils";

interface WeeklyReviewData {
  review: {
    weekStart: string;
    weekEnd: string;
    income: number;
    spent: number;
    saved: number;
    overallRating: string;
    highestSpendingCategory: { category: string; amount: number } | null;
    lowestSpendingCategory: { category: string; amount: number } | null;
    vsLastWeek: {
      incomeChangePercent: number | null;
      spentChangePercent: number | null;
    };
    goalProgress: Array<{
      goalName: string;
      progressDelta: number;
      onTrack: boolean;
    }>;
  };
  narrative: string;
}

export default function WeeklyReviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["weekly-review"],
    queryFn: () => api<WeeklyReviewData>("/reviews/weekly"),
  });

  useEffect(() => {
    if (data) track("weekly_review_opened");
  }, [data]);

  return (
    <PageShell
      title="Weekly Review"
      description="Your calendar week summary (Mon–Sun)."
      narrow
    >
      {isLoading ? (
        <div className="space-y-8">
          <div className="h-28 animate-pulse rounded-xl bg-muted/40" />
          <div className="h-20 animate-pulse rounded-xl bg-muted/40" />
        </div>
      ) : data ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          <header className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {new Date(data.review.weekStart).toLocaleDateString("en-PK")} –{" "}
              {new Date(data.review.weekEnd).toLocaleDateString("en-PK")}
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
              { label: "Income", value: formatPKR(data.review.income) },
              { label: "Spent", value: formatPKR(data.review.spent) },
              {
                label: "Saved",
                value: formatPKR(data.review.saved),
                valueClassName: cn(
                  data.review.saved >= 0 ? "text-primary" : "text-destructive",
                ),
              },
            ]}
          />

          {data.review.highestSpendingCategory ? (
            <ContentSection title="Spending highlights">
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Highest</span>
                  <span>
                    {data.review.highestSpendingCategory.category} ·{" "}
                    {formatPKR(data.review.highestSpendingCategory.amount)}
                  </span>
                </li>
                {data.review.lowestSpendingCategory ? (
                  <li className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Lowest</span>
                    <span>
                      {data.review.lowestSpendingCategory.category} ·{" "}
                      {formatPKR(data.review.lowestSpendingCategory.amount)}
                    </span>
                  </li>
                ) : null}
              </ul>
            </ContentSection>
          ) : null}

          {data.review.goalProgress.length > 0 ? (
            <ContentSection title="Goal progress">
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
        </motion.div>
      ) : null}
    </PageShell>
  );
}
