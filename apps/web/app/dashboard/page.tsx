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
import { track } from "@nexa/analytics/react";
import { formatPKR } from "@/lib/utils";
import { CardContent, CardHeader } from "@/components/ui/card";
import { BrainCircuit, ArrowRight } from "lucide-react";
import { CanIBuyThis } from "@/components/can-i-buy-this";

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
      track("dashboard_viewed");
      if (dashboard.insight) track("ai_insight_viewed");
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
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 space-y-8">
      <PasskeyPrompt open={showPasskeyPrompt} onDismiss={dismissPasskeyPrompt} />
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{getGreeting()} 👋</p>
          <h1 className="text-3xl font-display font-bold tracking-tight">Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <CanIBuyThis />
          <Button variant="ghost" onClick={async () => { await signOut(); router.push("/"); }}>
            Sign out
          </Button>
        </div>
      </header>

      <AppNav />

      {dashboard?.cycle.status === "PENDING_CONFIRMATION" && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle>New financial cycle started</CardTitle>
            <CardDescription>
              Starting balance: {formatPKR(dashboard.cash.startingBalance)}. Is this correct?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" onClick={() => api("/cycles/confirm-rollover", { method: "POST", body: "{}" }).then(() => queryClient.invalidateQueries({ queryKey: ["dashboard"] }))}>
              Confirm
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Grid Row 1: Health Check */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 shadow-sm relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
          <CardHeader className="pb-2">
            <CardDescription className="text-primary font-medium tracking-wide uppercase">Safe To Spend Today</CardDescription>
            <CardTitle className="text-5xl font-mono tracking-tight text-primary">
              {formatPKR(dashboard?.safeToSpend.today ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Baseline {formatPKR(dashboard?.safeToSpend.baseline ?? 0)}
              {dashboard?.safeToSpend.trendMultiplier !== 1 && ` · Trend ×${dashboard?.safeToSpend.trendMultiplier.toFixed(2)}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="font-medium tracking-wide uppercase">Financial Health</CardDescription>
            <CardTitle className="text-4xl font-display tracking-tight mt-1">
              {dashboard?.healthScore.overall ?? 0}
              <span className="text-lg text-muted-foreground font-sans"> / 100</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {dashboard?.cycle.daysRemaining ?? 0} days left in cycle
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: AI Coach */}
      {dashboard?.insight && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Card className="border-border bg-card/50 backdrop-blur shadow-sm">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <BrainCircuit className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Nexa Insight</h3>
                <p className="text-muted-foreground text-sm mt-1">{dashboard.insight}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Cash Flow Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Income This Cycle</CardDescription>
            <CardTitle className="font-mono text-xl">{formatPKR(dashboard?.cash.totalIncome ?? 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Spent</CardDescription>
            <CardTitle className="font-mono text-xl">{formatPKR(dashboard?.cash.totalExpenses ?? 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Projected Savings</CardDescription>
            <CardTitle className="font-mono text-xl text-primary">{formatPKR(dashboard?.savings.projectedSavings ?? 0)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {Math.round((dashboard?.savings.actualRate ?? 0) * 100)}% actual · {Math.round((dashboard?.savings.targetRate ?? 0) * 100)}% target
            </p>
          </CardContent>
        </Card>
      </div>

      <TransactionLogger />

      {/* Row 3: Recent Activity & Goals */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!dashboard?.goals.length ? (
              <p className="text-sm text-muted-foreground">No goals yet.</p>
            ) : (
              dashboard.goals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{goal.name}</span>
                    <span className="text-muted-foreground font-mono">{goal.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(goal.progress, 100)}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Target {formatPKR(goal.targetAmount)} · {goal.onTrack ? "On track" : "Delayed"}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!transactions?.length ? (
              <p className="text-sm text-muted-foreground">No transactions yet. Log your first expense above.</p>
            ) : (
              <ul className="space-y-4">
                {transactions.slice(0, 5).map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <RecategorizeSelect transactionId={tx.id} category={tx.category} />
                        <span className="text-xs text-muted-foreground">{tx.type}</span>
                      </div>
                    </div>
                    <span className="font-mono font-medium">
                      {tx.type === "INCOME" ? "+" : "-"}{formatPKR(tx.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {dashboard?.variance.fixedExpenses.some((v) => v.variance !== 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Spending vs Expected</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {dashboard.variance.fixedExpenses.filter((v) => v.expected > 0).map((v) => (
                <li key={v.name} className="flex justify-between p-2 rounded bg-muted/30">
                  <span>{v.name}</span>
                  <span className={v.variance > 0 ? "text-primary font-medium" : "text-destructive font-medium"}>
                    {v.variance > 0 ? "Under" : "Over"} by {formatPKR(Math.abs(v.variance))}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground pt-4">
        Engine v{dashboard?.version}
        {(dashboard?.charity?.thisCycle ?? 0) > 0 && ` · Charity this cycle: ${formatPKR(dashboard!.charity.thisCycle)}`}
      </p>
    </main>
  );
}
