import { cn } from "@/lib/utils";

interface StatStripItem {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}

export function StatStrip({
  items,
  className,
}: {
  items: StatStripItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-3",
        items.length === 3 && "grid-cols-3",
        items.length === 2 && "grid-cols-2",
        items.length === 4 && "grid-cols-2 sm:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0 rounded-2xl bg-card p-3.5 shadow-card">
          <p className="text-xs font-medium text-muted-foreground">
            {item.label}
          </p>
          <p
            className={cn(
              "mt-1 truncate text-base font-semibold tabular-nums tracking-tight sm:text-lg",
              item.valueClassName,
            )}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
