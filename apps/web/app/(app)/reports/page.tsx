"use client";

import { useState } from "react";
import { PeriodSummaryView } from "@/components/reports/period-summary-view";
import { PeriodNavigator } from "@/components/reports/period-navigator";
import { TransactionHistoryList } from "@/components/reports/transaction-history-list";
import { cn } from "@/lib/utils";

type Period = "month" | "year";
const PERIODS: Array<{ value: Period; label: string }> = [
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

export default function ActivityPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [dates, setDates] = useState<Record<Period, number>>(() => ({ month: Date.now(), year: Date.now() }));
  const date = dates[period];

  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight tracking-tight">Activity</h1>

      <div role="tablist" aria-label="Period" className="mb-4 grid grid-cols-2 rounded-xl bg-muted p-1">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            role="tab"
            type="button"
            aria-selected={period === p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              "h-9 rounded-lg text-sm font-medium transition-colors",
              period === p.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <PeriodNavigator
        date={new Date(date)}
        period={period}
        onChange={(next) => setDates((prev) => ({ ...prev, [period]: next.getTime() }))}
      />

      <div className="mt-4 space-y-8">
        <PeriodSummaryView period={period} date={date} />
        <TransactionHistoryList key={`${period}-${date}`} period={period} date={date} />
      </div>
    </>
  );
}
