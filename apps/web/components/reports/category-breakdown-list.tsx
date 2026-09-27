import { CATEGORY_LABELS, type Category } from "@nexa/shared";
import { CATEGORY_ICONS, CATEGORY_TONES } from "@/lib/category-visuals";
import { cn } from "@/lib/utils";

interface CategoryBreakdownListProps {
  byCategory: Partial<Record<Category, number>>;
  formatAmount: (amount: number) => string;
  className?: string;
}

/** Spending per category as a ranked list with share-of-total bars. */
export function CategoryBreakdownList({ byCategory, formatAmount, className }: CategoryBreakdownListProps) {
  const entries = (Object.entries(byCategory) as [Category, number][])
    .filter(([, amount]) => (amount ?? 0) > 0)
    .sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-card">No spending in this period.</p>;
  }

  const total = entries.reduce((sum, [, amount]) => sum + amount, 0);

  return (
    <ul className={cn("space-y-3.5 rounded-2xl bg-card p-4 shadow-card", className)}>
      {entries.map(([category, amount]) => {
        const Icon = CATEGORY_ICONS[category];
        const share = total > 0 ? Math.round((amount / total) * 100) : 0;
        return (
          <li key={category} className="flex items-center gap-3">
            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", CATEGORY_TONES[category])}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate font-medium">
                  {CATEGORY_LABELS[category]} <span className="font-normal text-muted-foreground">· {share}%</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{formatAmount(amount)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(3, share)}%` }} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
