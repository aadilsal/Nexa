"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { ChevronRight, Target } from "lucide-react";
import { CATEGORY_LABELS, type Category } from "@nexa/shared";
import { Button } from "@/components/ui/button";
import { StatStrip } from "@/components/layouts/surface";
import { TransactionFeed } from "@/components/transaction-feed";
import { DashboardSkeleton } from "@/components/widgets/dashboard-skeleton";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/session";
import { useAppRouter } from "@/lib/navigation";
import { useCurrency } from "@/lib/currency";
import { CATEGORY_ICONS, CATEGORY_TONES } from "@/lib/category-visuals";
import { cn } from "@/lib/utils";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function SectionTitle({ title, href, linkLabel = "See all" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-2.5 mt-8 flex items-center justify-between px-1">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {href ? (
        <Link href={href} className="flex min-h-11 items-center gap-0.5 text-sm font-medium text-primary">
          {linkLabel}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  const router = useAppRouter();
  const { formatAmount } = useCurrency();
  const { token, isLoading: sessionLoading, isAuthenticated } = useSession();
  const ensureCycle = useAction(api.cycles.ensureCurrentCycle);
  const confirmRollover = useMutation(api.cycles.confirmRollover);

  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) router.push("/login");
  }, [sessionLoading, isAuthenticated, router]);

  useEffect(() => {
    if (token) void ensureCycle({ sessionToken: token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const args = token ? { sessionToken: token } : "skip";
  const dashboard = useQuery(api.dashboard.get, args);
  const transactions = useQuery(api.transactions.list, args);
  const settings = useQuery(api.settings.get, args);
  const month = useQuery(api.reports.getSummary, token ? { sessionToken: token, period: "month" } : "skip");

  if (sessionLoading || !isAuthenticated || dashboard === undefined) return <DashboardSkeleton />;

  if (dashboard === null) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Setting up your first cycle…</p>;
  }

  const firstName = settings?.name?.split(" ")[0];
  const recent = [...(transactions ?? [])].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);
  const topCategories = month
    ? (Object.entries(month.byCategory) as [Category, number][])
        .filter(([, amount]) => amount > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];
  const topMax = topCategories[0]?.[1] ?? 0;
  const savingsRate = Math.round(dashboard.savings.actualRate * 100);

  return (
    <>
      <header className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()}</p>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">{firstName ? `Hi, ${firstName}` : "Your money"}</h1>
        </div>
        <span className="mb-1 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-card">
          {dashboard.cycle.daysRemaining} days left
        </span>
      </header>

      {dashboard.cycle.status === "PENDING_CONFIRMATION" ? (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-primary-muted p-4">
          <p className="text-sm">
            New cycle started with <b>{formatAmount(dashboard.cash.startingBalance)}</b>. Is that right?
          </p>
          <Button size="sm" onClick={() => token && void confirmRollover({ sessionToken: token })}>
            Confirm
          </Button>
        </div>
      ) : null}

      {/* Hero: the one number to check before spending. */}
      <section className="bg-hero rounded-3xl p-5 text-white shadow-floating" aria-label="Safe to spend today">
        <p className="text-sm font-medium text-white/70">Safe to spend today</p>
        <p className="mt-1 text-[40px] font-bold leading-none tracking-tight tabular-nums">{formatAmount(dashboard.safeToSpend.today)}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/15 pt-4">
          <div>
            <p className="text-xs text-white/60">Cash now</p>
            <p className="mt-0.5 font-semibold tabular-nums">{formatAmount(dashboard.cash.currentCashAvailable)}</p>
          </div>
          <div>
            <p className="text-xs text-white/60">Money health</p>
            <p className="mt-0.5 font-semibold tabular-nums">{dashboard.healthScore.overall}/100</p>
          </div>
        </div>
      </section>

      <StatStrip
        className="mt-3"
        items={[
          { label: "Income", value: formatAmount(dashboard.cash.totalIncome), valueClassName: "text-financial-positive" },
          { label: "Spent", value: formatAmount(dashboard.cash.totalExpenses) },
          {
            label: `Saved · ${savingsRate}%`,
            value: formatAmount(dashboard.savings.projectedSavings),
            valueClassName: dashboard.savings.projectedSavings >= 0 ? "text-primary" : "text-financial-negative",
          },
        ]}
      />

      <SectionTitle title="This month" href="/reports" />
      {topCategories.length ? (
        <ul className="space-y-3.5 rounded-2xl bg-card p-4 shadow-card">
          {topCategories.map(([category, amount]) => {
            const Icon = CATEGORY_ICONS[category];
            return (
              <li key={category} className="flex items-center gap-3">
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", CATEGORY_TONES[category])}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{CATEGORY_LABELS[category]}</span>
                    <span className="shrink-0 font-semibold tabular-nums">{formatAmount(amount)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${topMax ? Math.max(4, (amount / topMax) * 100) : 0}%` }} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-card">No spending logged this month yet.</p>
      )}

      <SectionTitle title="Goals" href="/goals" linkLabel="Manage" />
      {dashboard.goals.length ? (
        <ul className="divide-y divide-border rounded-2xl bg-card px-4 shadow-card">
          {dashboard.goals.map((goal) => (
            <li key={goal.id} className="py-3.5">
              <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate font-medium">{goal.name}</span>
                <span className={cn("shrink-0 text-xs font-medium", goal.onTrack ? "text-financial-positive" : "text-warning")}>
                  {goal.progress}% · {goal.onTrack ? "On track" : "Behind"}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full", goal.onTrack ? "bg-financial-positive" : "bg-warning")} style={{ width: `${Math.min(100, goal.progress)}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">of {formatAmount(goal.targetAmount)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <Link href="/goals" className="flex items-center gap-3 rounded-2xl bg-card p-4 text-sm shadow-card">
          <Target className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="flex-1">Set a savings goal</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </Link>
      )}

      <SectionTitle title="Recent" href="/reports" />
      {recent.length ? (
        <TransactionFeed items={recent} />
      ) : (
        <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-card">
          Nothing logged yet — tap <b>+</b> to add your first transaction.
        </p>
      )}
    </>
  );
}
