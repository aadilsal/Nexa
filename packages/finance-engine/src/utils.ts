export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function roundPKR(value: number): number {
  return Math.round(value);
}

export function scoreByRatio(ratio: number): number {
  if (ratio >= 1.0) return 100;
  if (ratio >= 0.8) return 80;
  if (ratio >= 0.6) return 60;
  if (ratio >= 0.4) return 40;
  return 20;
}

export function scoreByProgress(progress: number): number {
  if (progress >= 1.0) return 100;
  if (progress >= 0.75) return 80;
  if (progress >= 0.5) return 60;
  if (progress >= 0.25) return 40;
  return 20;
}

export function getTotalCycleDays(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );
}

export function monthsBetween(from: Date, to: Date): number {
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth());
  const dayAdjust = to.getDate() < from.getDate() ? -1 : 0;
  return Math.max(1, months + dayAdjust);
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

const PRIORITY_ORDER: Record<string, number> = {
  EMERGENCY_FUND: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export function sortByPriority<T extends { priority: string }>(goals: T[]): T[] {
  return [...goals].sort(
    (a, b) =>
      (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99),
  );
}

export function getDayOfWeek(date: Date): number {
  return date.getDay();
}
