export type ReportPeriod = "week" | "month" | "year";

export const REPORT_PERIODS: readonly ReportPeriod[] = ["week", "month", "year"];

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  week: "Week",
  month: "Month",
  year: "Year",
};
