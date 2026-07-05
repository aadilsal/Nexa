import { CURRENCY_LABELS, SUPPORTED_CURRENCIES, type CurrencyCode } from "@nexa/shared";
import { cn } from "@/lib/utils";

interface CurrencySelectProps {
  value: CurrencyCode;
  onChange: (value: CurrencyCode) => void;
  className?: string;
  id?: string;
  compact?: boolean;
}

export function CurrencySelect({
  value,
  onChange,
  className,
  id,
  compact = false,
}: CurrencySelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as CurrencyCode)}
      className={cn(
        "rounded-md border border-input bg-background text-sm",
        compact ? "px-2 py-1.5" : "px-3 py-2",
        className,
      )}
    >
      {SUPPORTED_CURRENCIES.map((code) => (
        <option key={code} value={code}>
          {compact ? code : CURRENCY_LABELS[code]}
        </option>
      ))}
    </select>
  );
}
