"use client";

import { Activity, CheckCircle2, Sparkles, TrendingDown, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { sanitizeInsight } from "@/lib/sanitize-insight";

interface MetricChangeProps {
  label: string;
  before: number;
  after: number;
  format: (value: number) => string;
  /** When true, an increase is shown in green (e.g. health score). */
  higherIsBetter?: boolean;
}

function MetricChange({
  label,
  before,
  after,
  format,
  higherIsBetter = true,
}: MetricChangeProps) {
  const delta = after - before;
  const unchanged = delta === 0;
  const improved = higherIsBetter ? delta > 0 : delta < 0;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
        {format(after)}
      </p>
      {!unchanged ? (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-xs font-medium tabular-nums",
            improved ? "text-financial-positive" : "text-financial-negative",
          )}
        >
          {improved ? (
            <TrendingUp className="h-3 w-3 shrink-0" aria-hidden="true" />
          ) : (
            <TrendingDown className="h-3 w-3 shrink-0" aria-hidden="true" />
          )}
          <span>
            {delta > 0 ? "+" : ""}
            {format(delta)} from {format(before)}
          </span>
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">No change</p>
      )}
    </div>
  );
}

export interface TransactionInsightToastProps {
  id: string | number;
  description: string;
  amountLabel: string;
  safeToSpend: { before: number; after: number };
  healthScore: { before: number; after: number };
  insight?: string | null;
  formatAmount: (value: number) => string;
}

export function TransactionInsightToast({
  id,
  description,
  amountLabel,
  safeToSpend,
  healthScore,
  insight,
  formatAmount,
}: TransactionInsightToastProps) {
  const cleanedInsight = insight ? sanitizeInsight(insight) : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto w-[min(100vw-2rem,24rem)] overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-floating"
    >
      <div className="flex items-start gap-3 border-b border-border/60 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Transaction logged</p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {description}{" "}
            <span className="font-mono tabular-nums text-foreground">{amountLabel}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(id)}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 py-3">
        <MetricChange
          label="Safe to spend"
          before={safeToSpend.before}
          after={safeToSpend.after}
          format={formatAmount}
          higherIsBetter
        />
        <MetricChange
          label="Health score"
          before={healthScore.before}
          after={healthScore.after}
          format={(v) => String(Math.round(v))}
          higherIsBetter
        />
      </div>

      {cleanedInsight ? (
        <div className="border-t border-border/60 bg-muted/20 px-4 py-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Insight
          </div>
          <p className="text-sm leading-relaxed text-foreground">{cleanedInsight}</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Dashboard updated with your latest numbers.
        </div>
      )}
    </div>
  );
}

export function showTransactionInsightToast(props: Omit<TransactionInsightToastProps, "id">) {
  return toast.custom(
    (id) => <TransactionInsightToast id={id} {...props} />,
    {
      duration: 10_000,
      className: "!bg-transparent !border-0 !shadow-none !p-0",
    },
  );
}
