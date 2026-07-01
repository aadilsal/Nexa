"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppNav } from "@/components/app-nav";
import { PasskeyPrompt, usePasskeyPrompt } from "@/components/passkey-prompt";
import { RecategorizeSelect } from "@/components/recategorize-select";
import { TransactionLogger } from "@/components/transaction-logger";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { signOut, useSession } from "@/lib/auth-client";
import { captureEvent } from "@/lib/posthog";
import { formatPKR } from "@/lib/utils";

interface DashboardData {
  version: string;
  insight: string | null;
  cycle: {
    id: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    status: string;
  };
  cash: {
    startingBalance: number;
    totalIncome: number;
    totalExpenses: number;
    currentCashAvailable: number;
  };
  safeToSpend: {
    today: number;
    baseline: number;
    trendMultiplier: number;
  };
  healthScore: {
    overall: number;
  };
  savings: {
    actualRate: number;
    targetRate: number;
    projectedSavings: number;
  };
  goals: Array<{
    id: string;
    name: string;
    progress: number;
    targetAmount: number;
    isEmergencyFund: boolean;
    eta: string;
    onTrack: boolean;
  }>;
  variance: {
    fixedExpenses: Array<{
      name: string;
      expected: number;
      variance: number;
    }>;
  };
  charity: { thisCycle: number; thisYear: number };
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: string;
  createdAt: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending: sessionLoading } = useSession();
  const { show: showPasskeyPrompt, dismiss: dismissPasskeyPrompt } =
    usePasskeyPrompt();

  const { data: onboarding } = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: () => api<{ complete: boolean }>("/onboarding/status"),
    enabled: !!session,
  });

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardData>("/dashboard"),
    enabled: !!session && onboarding?.complete === true,
  });

  const { data: transactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => api<Transaction[]>("/transactions"),
    enabled: !!session && onboarding?.complete === true,
  });

  useEffect(() => {
    if (!sessionLoading && !session) router.push("/login");
  }, [session, sessionLoading, router]);

  useEffect(() => {
    if (onboarding && !onboarding.complete) router.push("/onboarding");
  }, [onboarding, router]);

  useEffect(() => {
    if (dashboard) {
      captureEvent("safe_to_spend_viewed");
      if (dashboard.insight) captureEvent("ai_insight_viewed");
    }
  }, [dashboard]);

  if (sessionLoading || isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        </div>
      </main>
    );
  }

  const emergencyGoal = dashboard?.goals.find((g) => g.isEmergencyFund);

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <PasskeyPrompt open={showPasskeyPrompt} onDismiss={dismissPasskeyPrompt} />
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{getGreeting()} 👋</p>
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <Button
          variant="ghost"
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
        >
          Sign out
        </Button>
      </header>

      <AppNav />

      {dashboard?.cycle.status === "PENDING_CONFIRMATION" && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardTitle className="mb-1">New financial cycle started</CardTitle>
          <CardDescription className="mb-4">
            Starting balance: {formatPKR(dashboard.cash.startingBalance)}. Is
            this correct?
          </CardDescription>
          <Button
            size="sm"
            onClick={() =>
              api("/cycles/confirm-rollover", { method: "POST", body: "{}" }).then(
                () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
              )
            }
          >
            Confirm
          </Button>
        </Card>
      )}

      {dashboard?.insight && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="mb-6 border-primary/20">
            <CardDescription>Today&apos;s Insight</CardDescription>
            <p className="mt-2 text-sm leading-relaxed">{dashboard.insight}</p>
          </Card>
        </motion.div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5">
          <CardDescription>Safe To Spend Today</CardDescription>
          <p className="mt-1 font-mono text-3xl font-bold text-primary">
            {formatPKR(dashboard?.safeToSpend.today ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Baseline {formatPKR(dashboard?.safeToSpend.baseline ?? 0)}
            {dashboard?.safeToSpend.trendMultiplier !== 1 &&
              ` · Trend ×${dashboard?.safeToSpend.trendMultiplier.toFixed(2)}`}
          </p>
        </Card>
        <Card>
          <CardDescription>Financial Health</CardDescription>
          <p className="mt-1 text-3xl font-bold">
            {dashboard?.healthScore.overall ?? 0}
            <span className="text-lg text-muted-foreground"> / 100</span>
          </p>
        </Card>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardDescription>Income This Cycle</CardDescription>
          <p className="mt-1 font-mono text-xl font-bold">
            {formatPKR(dashboard?.cash.totalIncome ?? 0)}
          </p>
        </Card>
        <Card>
          <CardDescription>Spent</CardDescription>
          <p className="mt-1 font-mono text-xl font-bold">
            {formatPKR(dashboard?.cash.totalExpenses ?? 0)}
          </p>
        </Card>
        <Card>
          <CardDescription>Projected Savings</CardDescription>
          <p className="mt-1 font-mono text-xl font-bold text-primary">
            {formatPKR(dashboard?.savings.projectedSavings ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground">
            {Math.round((dashboard?.savings.actualRate ?? 0) * 100)}% actual ·{" "}
            {Math.round((dashboard?.savings.targetRate ?? 0) * 100)}% target
          </p>
        </Card>
      </div>

      {emergencyGoal && (
        <Card className="mb-8">
          <div className="flex items-center justify-between">
            <CardTitle>Emergency Fund</CardTitle>
            <span className="text-sm font-medium">{emergencyGoal.progress}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(emergencyGoal.progress, 100)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <CardDescription className="mt-2">
            Target {formatPKR(emergencyGoal.targetAmount)} · ETA{" "}
            {new Date(emergencyGoal.eta).toLocaleDateString("en-PK", {
              month: "long",
              year: "numeric",
            })}
          </CardDescription>
        </Card>
      )}

      <TransactionLogger />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle className="mb-4">Goals</CardTitle>
          {!dashboard?.goals.length ? (
            <p className="text-sm text-muted-foreground">No goals yet</p>
          ) : (
            <div className="space-y-4">
              {dashboard.goals.map((goal) => (
                <div key={goal.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{goal.name}</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatPKR(goal.targetAmount)} ·{" "}
                    {goal.onTrack ? "On track" : "Delayed"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardTitle className="mb-4">Recent Transactions</CardTitle>
          {!transactions?.length ? (
            <p className="text-sm text-muted-foreground">
              No transactions yet. Log your first expense above.
            </p>
          ) : (
            <ul className="space-y-3">
              {transactions.slice(0, 10).map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <RecategorizeSelect
                        transactionId={tx.id}
                        category={tx.category}
                      />
                      <span className="text-xs text-muted-foreground">
                        {tx.type}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono">
                    {tx.type === "INCOME" ? "+" : "-"}
                    {formatPKR(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {dashboard?.variance.fixedExpenses.some((v) => v.variance !== 0) && (
        <Card className="mt-6">
          <CardTitle className="mb-4">Spending vs Expected</CardTitle>
          <ul className="space-y-2 text-sm">
            {dashboard.variance.fixedExpenses
              .filter((v) => v.expected > 0)
              .map((v) => (
                <li key={v.name} className="flex justify-between">
                  <span>{v.name}</span>
                  <span
                    className={
                      v.variance > 0 ? "text-primary" : "text-destructive"
                    }
                  >
                    {v.variance > 0 ? "Under" : "Over"} by{" "}
                    {formatPKR(Math.abs(v.variance))}
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        {dashboard?.cycle.daysRemaining ?? 0} days left in cycle · Engine v
        {dashboard?.version}
        {(dashboard?.charity?.thisCycle ?? 0) > 0 &&
          ` · Charity this cycle: ${formatPKR(dashboard!.charity.thisCycle)}`}
      </p>
    </main>
  );
}
