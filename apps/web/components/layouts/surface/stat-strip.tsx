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
        "grid divide-y divide-border/50 sm:divide-x sm:divide-y-0",
        items.length === 3 && "sm:grid-cols-3",
        items.length === 2 && "sm:grid-cols-2",
        items.length === 4 && "sm:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="px-0 py-5 sm:px-6 sm:first:pl-0 sm:last:pr-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {item.label}
          </p>
          <p
            className={cn(
              "mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight",
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
