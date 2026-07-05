import { DAYS_OF_MONTH } from "@nexa/shared";
import { EnumSelect } from "@/components/enum-select";

const DAY_OPTIONS = DAYS_OF_MONTH.map(String);

const DAY_LABELS = Object.fromEntries(
  DAYS_OF_MONTH.map((day) => [String(day), `${day}${ordinalSuffix(day)}`]),
);

interface DayOfMonthSelectProps {
  value: number;
  onChange: (value: number) => void;
  id?: string;
  className?: string;
  error?: boolean;
}

export function DayOfMonthSelect({
  value,
  onChange,
  id,
  className,
  error,
}: DayOfMonthSelectProps) {
  return (
    <EnumSelect
      id={id}
      value={String(value)}
      onChange={(next) => onChange(Number(next))}
      options={DAY_OPTIONS}
      labels={DAY_LABELS}
      className={className}
      error={error}
    />
  );
}

function ordinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
