export type ReportPeriod = "week" | "month" | "year";

export function getCalendarMonthBounds(reference: Date): {
  start: Date;
  end: Date;
} {
  const start = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    1,
    0,
    0,
    0,
    0,
  );
  const end = new Date(
    reference.getFullYear(),
    reference.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  return { start, end };
}

export function getCalendarYearBounds(reference: Date): {
  start: Date;
  end: Date;
} {
  const start = new Date(reference.getFullYear(), 0, 1, 0, 0, 0, 0);
  const end = new Date(reference.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { start, end };
}

export function getCalendarWeekBoundsPlain(reference: Date): {
  start: Date;
  end: Date;
} {
  const date = new Date(reference);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(date);
  start.setDate(date.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function getPeriodBounds(
  period: ReportPeriod,
  referenceDate: Date,
): { start: Date; end: Date } {
  if (period === "week") return getCalendarWeekBoundsPlain(referenceDate);
  if (period === "month") return getCalendarMonthBounds(referenceDate);
  return getCalendarYearBounds(referenceDate);
}
