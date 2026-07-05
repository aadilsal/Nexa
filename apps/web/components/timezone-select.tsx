import {
  SUPPORTED_TIMEZONES,
  TIMEZONE_LABELS,
  type TimezoneId,
} from "@nexa/shared";
import { cn } from "@/lib/utils";

interface TimezoneSelectProps {
  value: TimezoneId;
  onChange: (value: TimezoneId) => void;
  className?: string;
  id?: string;
  error?: boolean;
}

export function TimezoneSelect({
  value,
  onChange,
  className,
  id,
  error,
}: TimezoneSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as TimezoneId)}
      className={cn(
        "w-full rounded-md border bg-card text-sm text-foreground",
        "[&>option]:bg-card [&>option]:text-foreground",
        "px-3 py-2",
        error ? "border-destructive" : "border-input",
        className,
      )}
    >
      {SUPPORTED_TIMEZONES.map((timezone) => (
        <option key={timezone} value={timezone}>
          {TIMEZONE_LABELS[timezone]}
        </option>
      ))}
    </select>
  );
}
