import { CATEGORY_LABELS, type Category } from "@nexa/shared";
import { CATEGORY_ICONS } from "@/lib/category-visuals";
import { EmptyState } from "@/components/widgets/empty-state";
import { Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryBreakdownListProps {
  byCategory: Partial<Record<Category, number>>;
  formatAmount: (amount: number) => string;
  className?: string;
}

export function CategoryBreakdownList({
  byCategory,
  formatAmount,
  className,
}: CategoryBreakdownListProps) {
  const entries = (Object.entries(byCategory) as [Category, number][])
    .filter(([, amount]) => (amount ?? 0) > 0)
    .sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No spending in this period"
        description="Once you log expenses, they'll show up here grouped by category."
      />
    );
  }

  const max = entries[0]![1];

  return (
    <ul className={cn("space-y-4", className)}>
      {entries.map(([category, amount]) => {
        const Icon = CATEGORY_ICONS[category];
        const widthPercent = max > 0 ? Math.max(4, (amount / max) * 100) : 0;
        return (
          <li key={category} className="space-y-1.5">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {CATEGORY_LABELS[category]}
              </span>
              <span className="font-mono tabular-nums">{formatAmount(amount)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
              <div
                className="h-full rounded-full bg-chart-1"
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
