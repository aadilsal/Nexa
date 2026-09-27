"use client";

import { useQuery } from "convex/react";
import { PageShell } from "@/components/layouts/surface";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/session";
import { useCurrency } from "@/lib/currency";

const shortDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short" });

export default function SubscriptionsPage() {
  const { token } = useSession();
  const { formatAmount } = useCurrency();
  const data = useQuery(api.planning.overview, token ? { sessionToken: token } : "skip");

  return (
    <PageShell
      title="Subscriptions"
      description="Charges that repeat every week or month, found automatically in your transactions."
      backHref="/plan"
      backLabel="Plan"
      narrow
    >
      {data === undefined ? (
        <div className="h-32 animate-pulse rounded-2xl bg-card" />
      ) : data.recurring.length ? (
        <>
          <div className="bg-hero mb-4 rounded-3xl p-5 text-white shadow-floating">
            <p className="text-sm text-white/70">Recurring costs</p>
            <p className="mt-1 text-[32px] font-bold leading-none tabular-nums">
              {formatAmount(data.recurringMonthlyTotal)}
              <span className="ml-1 text-base font-medium text-white/70">/month</span>
            </p>
            <p className="mt-2 text-sm text-white/70">{formatAmount(data.recurringMonthlyTotal * 12)} a year</p>
          </div>
          <ul className="divide-y divide-border rounded-2xl bg-card px-4 shadow-card">
            {data.recurring.map((r) => (
              <li key={r.name} className="flex items-center gap-3 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.cadence === "monthly" ? "Monthly" : "Weekly"} · last {shortDate(r.lastDate)} · next ~{shortDate(r.nextDate)}
                  </p>
                </div>
                <span className="shrink-0 text-right">
                  <span className="block text-[15px] font-semibold tabular-nums">{formatAmount(r.averageAmount)}</span>
                  {r.cadence === "weekly" ? <span className="block text-xs text-muted-foreground">{formatAmount(r.monthlyCost)}/mo</span> : null}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 px-1 text-xs text-muted-foreground">Cancel anything you no longer use — it&apos;s the easiest money to save.</p>
        </>
      ) : (
        <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-card">
          Nothing recurring yet. Once the same payee charges you a similar amount two or more times on a regular schedule, it shows up here.
        </p>
      )}
    </PageShell>
  );
}
