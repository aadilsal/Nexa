"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@nexa/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/layouts/surface";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/session";
import { useCurrency } from "@/lib/currency";
import { CATEGORY_ICONS, CATEGORY_TONES } from "@/lib/category-visuals";
import { cn } from "@/lib/utils";

const BUDGETABLE = CATEGORIES.filter((c) => c !== "INCOME" && c !== "LOAN");

export default function BudgetsPage() {
  const { token } = useSession();
  const { formatAmount } = useCurrency();
  const data = useQuery(api.planning.overview, token ? { sessionToken: token } : "skip");
  const setBudget = useAction(api.planning.setBudget);
  const removeBudget = useMutation(api.planning.removeBudget);
  const [category, setCategory] = useState<Category>("FOOD");
  const [limit, setLimit] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await setBudget({ sessionToken: token, category, limit: Number(limit) });
      toast.success(`${CATEGORY_LABELS[category]} budget saved`);
      setLimit("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell title="Budgets" description="Monthly limits per category. You'll get a notification at 80% and 100%." backHref="/plan" backLabel="Plan" narrow>
      {data === undefined ? (
        <div className="h-32 animate-pulse rounded-2xl bg-card" />
      ) : data.budgets.length ? (
        <ul className="divide-y divide-border rounded-2xl bg-card px-4 shadow-card">
          {data.budgets.map((b) => {
            const Icon = CATEGORY_ICONS[b.category];
            const over = b.percent >= 100;
            const near = b.percent >= 80;
            return (
              <li key={b.id} className="flex items-center gap-3 py-3.5">
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", CATEGORY_TONES[b.category])}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{b.label}</span>
                    <span className={cn("shrink-0 tabular-nums", over ? "font-semibold text-financial-negative" : "text-muted-foreground")}>
                      {formatAmount(b.spent)} / {formatAmount(b.limit)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", over ? "bg-financial-negative" : near ? "bg-warning" : "bg-financial-positive")}
                      style={{ width: `${Math.min(100, b.percent)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {over ? `Over by ${formatAmount(b.spent - b.limit)}` : `${formatAmount(b.limit - b.spent)} left this month`}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${b.label} budget`}
                  onClick={() => token && void removeBudget({ sessionToken: token, id: b.id })}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-card">No budgets yet. Start with the category you overspend on most.</p>
      )}

      <form onSubmit={save} className="mt-6 space-y-3 rounded-2xl bg-card p-4 shadow-card">
        <p className="text-sm font-semibold">Add or change a budget</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
            >
              {BUDGETABLE.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Monthly limit</span>
            <Input type="number" inputMode="numeric" min={1} required value={limit} onChange={(e) => setLimit(e.target.value)} className="h-11" placeholder="25000" />
          </label>
        </div>
        <Button type="submit" className="h-11 w-full rounded-xl" loading={saving} disabled={!limit}>
          Save budget
        </Button>
      </form>
    </PageShell>
  );
}
