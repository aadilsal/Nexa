"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportPeriod } from "@/lib/report-period";

function shiftDate(date: Date, period: ReportPeriod, direction: 1 | -1): Date {
  const next = new Date(date);
  if (period === "year") next.setFullYear(next.getFullYear() + direction);
  else next.setMonth(next.getMonth() + direction);
  return next;
}

function formatLabel(date: Date, period: ReportPeriod): string {
  if (period === "year") return date.getFullYear().toString();
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function isCurrentPeriod(date: Date, period: ReportPeriod, now: Date): boolean {
  if (period === "year") return date.getFullYear() === now.getFullYear();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export function PeriodNavigator({
  date,
  period,
  onChange,
}: {
  date: Date;
  period: Exclude<ReportPeriod, "week">;
  onChange: (date: Date) => void;
}) {
  const now = new Date();
  const atCurrent = isCurrentPeriod(date, period, now);

  return (
    <div className="flex items-center justify-between gap-4">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(shiftDate(date, period, -1))}
        aria-label={period === "year" ? "Previous year" : "Previous month"}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{formatLabel(date, period)}</p>
      <Button
        variant="outline"
        size="icon"
        disabled={atCurrent}
        onClick={() => onChange(shiftDate(date, period, 1))}
        aria-label={period === "year" ? "Next year" : "Next month"}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
