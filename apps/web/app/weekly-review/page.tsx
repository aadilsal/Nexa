"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useEffect } from "react";
import { AppNav } from "@/components/app-nav";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { captureEvent } from "@/lib/posthog";
import { formatPKR } from "@/lib/utils";

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
    if (data) captureEvent("weekly_review_opened");
  }, [data]);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <AppNav />
      <h1 className="mb-2 text-2xl font-bold">Weekly Review</h1>
      <p className="mb-8 text-muted-foreground">
        Your calendar week summary (Mon–Sun).
      </p>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        </div>
      ) : data ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <Card>
            <CardDescription>
              {new Date(data.review.weekStart).toLocaleDateString("en-PK")} –{" "}
              {new Date(data.review.weekEnd).toLocaleDateString("en-PK")}
            </CardDescription>
            <CardTitle className="mt-2 capitalize">
              {data.review.overallRating.replace(/_/g, " ").toLowerCase()} week
            </CardTitle>
            <p className="mt-4 text-sm leading-relaxed">{data.narrative}</p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardDescription>Income</CardDescription>
              <p className="mt-1 font-mono text-xl font-bold">
                {formatPKR(data.review.income)}
              </p>
            </Card>
            <Card>
              <CardDescription>Spent</CardDescription>
              <p className="mt-1 font-mono text-xl font-bold">
                {formatPKR(data.review.spent)}
              </p>
            </Card>
            <Card>
              <CardDescription>Saved</CardDescription>
              <p className="mt-1 font-mono text-xl font-bold text-primary">
                {formatPKR(data.review.saved)}
              </p>
            </Card>
          </div>

          {data.review.highestSpendingCategory && (
            <Card>
              <CardTitle className="mb-2 text-base">Spending highlights</CardTitle>
              <p className="text-sm">
                Highest: {data.review.highestSpendingCategory.category} (
                {formatPKR(data.review.highestSpendingCategory.amount)})
              </p>
              {data.review.lowestSpendingCategory && (
                <p className="mt-1 text-sm">
                  Lowest: {data.review.lowestSpendingCategory.category} (
                  {formatPKR(data.review.lowestSpendingCategory.amount)})
                </p>
              )}
            </Card>
          )}
        </motion.div>
      ) : null}
    </main>
  );
}
