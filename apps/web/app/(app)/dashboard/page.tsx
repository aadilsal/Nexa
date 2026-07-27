"use client";

import dynamic from "next/dynamic";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useAppRouter } from "@/lib/navigation";
import { useEffect } from "react";
import { MessageSquare, Receipt, Target, TrendingUp } from "lucide-react";
import { usePasskeyPrompt } from "@/components/passkey-prompt";
import { RecategorizeSelect } from "@/components/recategorize-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/widgets/page-header";
import { StatCard } from "@/components/widgets/stat-card";
import { SafeToSpendCard } from "@/components/widgets/safe-to-spend-card";
import { buildSafeToSpendExplanation } from "@/lib/safe-to-spend-explanation";
import {
  HealthScoreCard,
  InsightCard,
} from "@/components/widgets/health-insight-cards";
import { DashboardSkeleton } from "@/components/widgets/dashboard-skeleton";
import { EmptyState } from "@/components/widgets/empty-state";
import { ContentSection } from "@/components/layouts/surface";
import { api } from "@/lib/api";
import { APP_QUERY_STALE } from "@/lib/prefetch-app-data";
import {
  clearPendingOnboardingComplete,
  hasPendingOnboardingComplete,
} from "@/lib/onboarding";
import { hasLocalAuthSession, useSession } from "@/lib/auth-client";
import { track } from "@nexa/analytics/react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";
import { FEATURE_HELP } from "@/lib/feature-help";
import type { CurrencyCode } from "@nexa/shared";

const CanIBuyThis = dynamic(
  () => import("@/components/can-i-buy-this").then((m) => m.CanIBuyThis),
  { ssr: false },
);

const TransactionLogger = dynamic(
  () => import("@/components/transaction-logger").then((m) => m.TransactionLogger),
);

const PasskeyPrompt = dynamic(
  () => import("@/components/passkey-prompt").then((m) => m.PasskeyPrompt),
  { ssr: false },
);

interface DashboardData {
  version: string;
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
    breakdown?: {
      currentCashAvailable: number;
      remainingFixedExpenses: number;
      remainingGoalContributions: number;
      emergencyFundProtection: number;
      shortfall: number;
    };
  };
  healthScore: {
    overall: number;
    breakdown: {
      savingsRate: number;
      emergencyFund: number;
      goalProgress: number;
      spendingConsistency: number;
      incomeStability: number;
    };
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
    requiredMonthlySavings?: number;
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
  currency?: string;
  category: string;
  type: string;
  createdAt: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const router = useAppRouter();
  const queryClient = useQueryClient();
  const { formatAmount } = useCurrency();
  const { data: session, isPending: sessionLoading } = useSession();
  const authReady = !!session || hasLocalAuthSession();

  const { data: onboarding, isLoading: onboardingLoading } = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: () => api<{ complete: boolean }>("/onboarding/status"),
    enabled: authReady,
    staleTime: APP_QUERY_STALE.onboarding,
  });

  const onboardingReady =
    onboarding?.complete === true || hasPendingOnboardingComplete();

  const { show: showPasskeyPrompt, dismiss: dismissPasskeyPrompt } =
    usePasskeyPrompt(onboardingReady);

  const { data: dashboard, isLoading: dashboardLoading, isError: dashboardError, refetch: refetchDashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardData>("/dashboard"),
    enabled: authReady && onboardingReady,
    staleTime: APP_QUERY_STALE.dashboard,
  });

  const { data: transactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => api<Transaction[]>("/transactions"),
    enabled: authReady && onboardingReady,
    staleTime: APP_QUERY_STALE.transactions,
  });

  const { data: insightData } = useQuery({
    queryKey: ["dashboard-insight"],
    queryFn: () => api<{ insight: string }>("/ai/insight"),
    enabled: authReady && onboardingReady && !!dashboard,
    staleTime: APP_QUERY_STALE.dashboard,
    retry: false,
  });

  useEffect(() => {
    if (sessionLoading) return;
    if (!session && !hasLocalAuthSession()) router.push("/login");
  }, [session, sessionLoading, router]);

  useEffect(() => {
    if (onboardingLoading) return;
    if (hasPendingOnboardingComplete()) return;
    if (showPasskeyPrompt) return;
    if (onboarding && !onboarding.complete) router.push("/onboarding");
  }, [onboarding, onboardingLoading, showPasskeyPrompt, router]);

  useEffect(() => {
    if (onboarding?.complete) clearPendingOnboardingComplete();
  }, [onboarding]);

  useEffect(() => {
    if (dashboard) {
      track("safe_to_spend_viewed");
      track("dashboard_viewed");
    }
  }, [dashboard]);

  useEffect(() => {
    if (insightData?.insight) track("ai_insight_viewed");
  }, [insightData]);

  const showInitialSkeleton =
    (sessionLoading && !hasLocalAuthSession()) ||
    (onboardingLoading && !onboardingReady) ||
    (dashboardLoading && !dashboard) ||
    (!session && hasLocalAuthSession());

  if (showInitialSkeleton) {
    return <DashboardSkeleton />;
  }

  if (dashboardError && !dashboard) {
    return (
      <>
        <PageHeader
          eyebrow={getGreeting()}
          title="Your financial snapshot"
          description="Everything you need to know before your next spending decision."
        />
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Couldn&apos;t load your dashboard</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              We couldn&apos;t fetch your numbers. Nothing below is shown until
              your real data loads.
            </span>
            <Button size="sm" onClick={() => void refetchDashboard()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </>
    );
  }

  if (!dashboard) {
    return <DashboardSkeleton />;
  }

  const emergencyGoal = dashboard.goals.find((g) => g.isEmergencyFund);
  const userName = session?.user?.name?.split(" ")[0];

  return (
    <>
      <PasskeyPrompt open={showPasskeyPrompt} onDismiss={dismissPasskeyPrompt} />

      <PageHeader
        eyebrow={getGreeting()}
        title={userName ? `${userName}, here's your snapshot` : "Your financial snapshot"}
        description="Everything you need to know before your next spending decision."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/chat">
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                AI Coach
              </Link>
            </Button>
            <CanIBuyThis />
          </>
        }
      />

      {dashboard.cycle.status === "PENDING_CONFIRMATION" && (
        <Alert variant="info" className="mb-6">
          <AlertTitle>New financial cycle started</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Starting balance: {formatAmount(dashboard.cash.startingBalance)}. Is
              this correct?
            </span>
            <Button
              size="sm"
              onClick={() =>
                api("/cycles/confirm-rollover", {
                  method: "POST",
                  body: "{}",
                }).then(() =>
                  queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
                )
              }
            >
              Confirm balance
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {insightData?.insight ? (
        <div className="mb-6">
          <InsightCard insight={insightData.insight} />
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <SafeToSpendCard
          amount={dashboard.safeToSpend.today}
          baseline={dashboard.safeToSpend.baseline}
          trendMultiplier={dashboard.safeToSpend.trendMultiplier}
          daysRemaining={dashboard.cycle.daysRemaining}
          breakdown={dashboard.safeToSpend.breakdown}
          explanation={buildSafeToSpendExplanation(dashboard)}
        />
        <HealthScoreCard
          score={dashboard.healthScore.overall}
          breakdown={dashboard.healthScore.breakdown}
        />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Current cash"
          value={formatAmount(dashboard.cash.currentCashAvailable)}
          icon={TrendingUp}
          info={FEATURE_HELP.currentCash}
        />
        <StatCard
          label="Income this cycle"
          value={formatAmount(dashboard.cash.totalIncome)}
          info={FEATURE_HELP.incomeCycle}
        />
        <StatCard
          label="Spent"
          value={formatAmount(dashboard.cash.totalExpenses)}
          info={FEATURE_HELP.spentCycle}
        />
        <StatCard
          label="Projected savings"
          value={formatAmount(dashboard.savings.projectedSavings)}
          hint={`${Math.round(dashboard.savings.actualRate * 100)}% actual · ${Math.round(dashboard.savings.targetRate * 100)}% target`}
          info={FEATURE_HELP.projectedSavings}
        />
      </div>

      {emergencyGoal ? (
        <ContentSection
          title="Emergency fund"
          info={FEATURE_HELP.emergencyFund}
          className="mb-8 border-t-0 pt-0"
          description={`Target ${formatAmount(emergencyGoal.targetAmount)} · ETA ${new Date(emergencyGoal.eta).toLocaleDateString(undefined, { month: "long", year: "numeric" })}`}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{emergencyGoal.progress}% complete</span>
            <Badge variant={emergencyGoal.onTrack ? "success" : "warning"}>
              {emergencyGoal.onTrack ? "On track" : "Delayed"}
            </Badge>
          </div>
          <Progress value={emergencyGoal.progress} />
        </ContentSection>
      ) : null}

      <ContentSection
        title="Quick log"
        description="Log an expense in seconds — your data powers Safe To Spend."
        info={FEATURE_HELP.transactionLog}
        className="mb-8 border-t-0 pt-0"
      >
        <TransactionLogger />
      </ContentSection>

      <div className="grid gap-10 lg:grid-cols-2">
        <ContentSection
          title="Goals"
          icon={<Target className="h-4 w-4 text-primary" aria-hidden="true" />}
          info={FEATURE_HELP.goalProgress}
          className="border-t-0 pt-0"
        >
          {!dashboard.goals.length ? (
            <EmptyState
              icon={Target}
              title="No goals yet"
              description="Add goals to track savings progress, ETAs, and on-track signals."
              actionLabel="Manage goals"
              actionHref="/goals"
            />
          ) : (
            <>
              <div className="divide-y divide-border/50">
                {dashboard.goals.map((goal) => (
                  <Link
                    key={goal.id}
                    href="/goals"
                    className="block py-4 first:pt-0 last:pb-0 transition-colors hover:bg-muted/20"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium">{goal.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={goal.onTrack ? "success" : "warning"}
                          className="text-[10px]"
                        >
                          {goal.onTrack ? "On track" : "Delayed"}
                        </Badge>
                        <span className="tabular-nums">{goal.progress}%</span>
                      </div>
                    </div>
                    <Progress value={goal.progress} />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatAmount(goal.targetAmount)}
                    </p>
                  </Link>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/goals">Manage goals</Link>
                </Button>
              </div>
            </>
          )}
        </ContentSection>

        <ContentSection
          title="Recent activity"
          icon={<Receipt className="h-4 w-4 text-primary" aria-hidden="true" />}
          className="border-t-0 pt-0"
        >
          {!transactions?.length ? (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              description="Log your first expense above to start building your financial picture."
            />
          ) : (
            <ul className="divide-y divide-border/50">
              {transactions.slice(0, 10).map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{tx.description}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <RecategorizeSelect
                        transactionId={tx.id}
                        category={tx.category}
                      />
                      <span className="text-xs text-muted-foreground">
                        {tx.type}
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 font-mono text-sm tabular-nums",
                      tx.type === "INCOME"
                        ? "text-financial-positive"
                        : "text-foreground",
                    )}
                  >
                    {tx.type === "INCOME" ? "+" : "−"}
                    {formatAmount(
                      tx.amount,
                      tx.currency as CurrencyCode | undefined,
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ContentSection>
      </div>

      {dashboard.variance.fixedExpenses.some((v) => v.variance !== 0) ? (
        <ContentSection title="Spending vs expected" description="Fixed expenses compared to your plan">
          <ul className="divide-y divide-border/50">
            {dashboard.variance.fixedExpenses
              .filter((v) => v.expected > 0)
              .map((v) => (
                <li
                  key={v.name}
                  className="flex items-center justify-between gap-4 py-3 text-sm first:pt-0"
                >
                  <span>{v.name}</span>
                  <span
                    className={cn(
                      "font-medium",
                      v.variance > 0
                        ? "text-financial-positive"
                        : "text-financial-negative",
                    )}
                  >
                    {v.variance > 0 ? "Under" : "Over"} by{" "}
                    {formatAmount(Math.abs(v.variance))}
                  </span>
                </li>
              ))}
          </ul>
        </ContentSection>
      ) : null}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Engine v{dashboard.version}
        {dashboard.charity.thisCycle > 0 &&
          ` · Charity this cycle: ${formatAmount(dashboard.charity.thisCycle)}`}
      </p>
    </>
  );
}
