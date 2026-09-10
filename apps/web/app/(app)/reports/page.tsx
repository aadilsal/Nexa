"use client";

import { useState } from "react";
import { PageShell, ContentSection } from "@/components/layouts/surface";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeekReviewView } from "@/components/reports/week-review-view";
import { PeriodSummaryView } from "@/components/reports/period-summary-view";
import { PeriodNavigator } from "@/components/reports/period-navigator";
import { TransactionHistoryList } from "@/components/reports/transaction-history-list";
import { REPORT_PERIODS, REPORT_PERIOD_LABELS, type ReportPeriod } from "@/lib/report-period";

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("week");
  const [dates, setDates] = useState<Record<ReportPeriod, number>>(() => {
    const now = Date.now();
    return { week: now, month: now, year: now };
  });

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
          <TabsContent key={option} value={option} className="space-y-8">
            {option === "week" ? (
              <WeekReviewView />
            ) : (
              <>
                <PeriodNavigator
                  date={new Date(dates[option])}
                  period={option}
                  onChange={(next) => setDates((prev) => ({ ...prev, [option]: next.getTime() }))}
                />
                <PeriodSummaryView period={option} date={dates[option]} />
              </>
            )}

            <ContentSection title="Transactions">
              <TransactionHistoryList key={`${option}-${dates[option]}`} period={option} date={dates[option]} />
            </ContentSection>
          </TabsContent>
        ))}
      </Tabs>
    </PageShell>
  );
}
