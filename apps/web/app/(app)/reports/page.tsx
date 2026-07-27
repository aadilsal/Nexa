"use client";

import { useState } from "react";
import { PageShell, ContentSection } from "@/components/layouts/surface";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeekReviewView } from "@/components/reports/week-review-view";
import { PeriodSummaryView } from "@/components/reports/period-summary-view";
import { TransactionHistoryList } from "@/components/reports/transaction-history-list";
import { REPORT_PERIODS, REPORT_PERIOD_LABELS, type ReportPeriod } from "@/lib/report-period";

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("week");

  return (
    <PageShell
      title="Reports"
      description="See how much you're spending, by category, week to week, month to month, or over the year."
      narrow
    >
      <Tabs value={period} onValueChange={(value) => setPeriod(value as ReportPeriod)}>
        <TabsList>
          {REPORT_PERIODS.map((option) => (
            <TabsTrigger key={option} value={option}>
              {REPORT_PERIOD_LABELS[option]}
            </TabsTrigger>
          ))}
        </TabsList>

        {REPORT_PERIODS.map((option) => (
          <TabsContent key={option} value={option}>
            {option === "week" ? <WeekReviewView /> : <PeriodSummaryView period={option} />}

            <ContentSection title="Transactions" className="mt-8">
              <TransactionHistoryList key={option} period={option} />
            </ContentSection>
          </TabsContent>
        ))}
      </Tabs>
    </PageShell>
  );
}
