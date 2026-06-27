export interface CycleDates {
  startDate: Date;
  endDate: Date;
}

export function getDaysRemaining(endDate: Date, today: Date = new Date()): number {
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

export function computeCycleDates(
  payday: number,
  referenceDate: Date = new Date(),
): CycleDates {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();

  let startDate: Date;
  let endDate: Date;

  if (day >= payday) {
    startDate = new Date(year, month, payday);
    endDate = new Date(year, month + 1, payday - 1);
  } else {
    startDate = new Date(year, month - 1, payday);
    endDate = new Date(year, month, payday - 1);
  }

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

export function computeNextCycleDates(currentEndDate: Date, payday: number): CycleDates {
  const nextStart = new Date(currentEndDate);
  nextStart.setDate(nextStart.getDate() + 1);
  nextStart.setHours(0, 0, 0, 0);

  const nextEnd = new Date(nextStart);
  nextEnd.setMonth(nextEnd.getMonth() + 1);
  nextEnd.setDate(payday - 1);
  nextEnd.setHours(23, 59, 59, 999);

  return { startDate: nextStart, endDate: nextEnd };
}
