import { cn } from "@/lib/utils";

export interface EnumSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
  labels?: Partial<Record<T, string>>;
  id?: string;
  className?: string;
  compact?: boolean;
  error?: boolean;
  disabled?: boolean;
}

export function EnumSelect<T extends string>({
  value,
  onChange,
  options,
  labels,
  id,
  className,
  compact = false,
  error = false,
  disabled = false,
}: EnumSelectProps<T>) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as T)}
      className={cn(
        "w-full rounded-lg border border-input bg-card text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        "[&>option]:bg-card [&>option]:text-foreground",
        compact ? "px-2 py-1.5" : "h-10 px-3 py-2",
        error && "border-destructive focus-visible:ring-destructive",
        className,
      )}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {labels?.[option] ?? option}
        </option>
      ))}
    </select>
  );
}
