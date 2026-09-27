"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { ChevronRight, HandCoins, Landmark, MoonStar, PieChart, Repeat, Target, type LucideIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/session";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

function PlanRow({ href, icon: Icon, tone, title, summary }: { href: string; icon: LucideIcon; tone: string; title: string; summary: string }) {
  return (
    <li>
      <Link href={href} className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors active:bg-muted">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", tone)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium">{title}</span>
          <span className="block truncate text-sm text-muted-foreground">{summary}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    </li>
  );
}

export default function PlanPage() {
  const { token } = useSession();
  const { formatAmount } = useCurrency();
  const data = useQuery(api.planning.overview, token ? { sessionToken: token } : "skip");
  const zakat = useQuery(api.planning.getZakat, token ? { sessionToken: token } : "skip");
  const tax = useQuery(api.planning.getTax, token ? { sessionToken: token } : "skip");

  const topBudget = data?.budgets[0];
  const budgetSummary = !data
    ? "…"
    : data.budgets.length === 0
      ? "Set monthly limits and get alerts"
      : `${data.budgets.length} budget${data.budgets.length === 1 ? "" : "s"} · ${topBudget!.label} at ${topBudget!.percent}%`;

  return (
    <>
      <h1 className="mb-5 text-[28px] font-bold leading-tight tracking-tight">Plan</h1>

      <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Spending</h2>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-card">
        <PlanRow href="/plan/budgets" icon={PieChart} tone="bg-indigo-50 text-indigo-700" title="Budgets" summary={budgetSummary} />
        <PlanRow
          href="/plan/subscriptions"
          icon={Repeat}
          tone="bg-sky-50 text-sky-700"
          title="Subscriptions"
          summary={!data ? "…" : data.recurring.length ? `${formatAmount(data.recurringMonthlyTotal)}/month · ${data.recurring.length} recurring` : "None detected yet"}
        />
        <PlanRow
          href="/plan/loans"
          icon={HandCoins}
          tone="bg-yellow-50 text-yellow-800"
          title="Lent & borrowed"
          summary={
            !data
              ? "…"
              : data.loans.people.length
                ? `Owed to you ${formatAmount(data.loans.owedToYou)} · You owe ${formatAmount(data.loans.youOwe)}`
                : "Track money you lend or borrow"
          }
        />
      </ul>

      <h2 className="mb-2 mt-7 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Saving & obligations</h2>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-card">
        <PlanRow href="/goals" icon={Target} tone="bg-emerald-50 text-emerald-700" title="Goals" summary="Savings targets and emergency fund" />
        <PlanRow
          href="/plan/zakat"
          icon={MoonStar}
          tone="bg-teal-50 text-teal-700"
          title="Zakat"
          summary={
            zakat?.zakatDate
              ? `Next due ${new Date(zakat.zakatDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`
              : "Calculate what you owe (Hanafi)"
          }
        />
        <PlanRow href="/plan/tax" icon={Landmark} tone="bg-slate-100 text-slate-700" title="Income tax" summary={tax ? `Tax Year ${tax.taxYear} estimate` : "Pakistan income tax"} />
      </ul>
    </>
  );
}
