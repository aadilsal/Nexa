"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { signOut, useSession } from "@/lib/auth-client";
import { formatPKR } from "@/lib/utils";

interface DashboardData {
  version: string;
  calculatedAt: string;
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
  goals: Array<{
    id: string;
    name: string;
    progress: number;
    targetAmount: number;
    isEmergencyFund: boolean;
  }>;
  transactionCount: number;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending: sessionLoading } = useSession();
  const [rawInput, setRawInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

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

  const logMutation = useMutation({
    mutationFn: (input: string) =>
      api<{ transaction: Transaction; cash: { before: number; after: number } }>(
        "/transactions",
        {
          method: "POST",
          body: JSON.stringify({ rawInput: input }),
        },
      ),
    onSuccess: (data) => {
      setRawInput("");
      setFeedback(
        `Logged ${data.transaction.description}. Cash: ${formatPKR(data.cash.before)} → ${formatPKR(data.cash.after)}`,
      );
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.push("/login");
    }
  }, [session, sessionLoading, router]);

  useEffect(() => {
    if (onboarding && !onboarding.complete) {
      router.push("/onboarding");
    }
  }, [onboarding, router]);

  if (sessionLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {session?.user.name ?? session?.user.email}
          </p>
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

      {dashboard?.cycle.status === "PENDING_CONFIRMATION" && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardTitle className="mb-1">New financial cycle started</CardTitle>
          <CardDescription className="mb-4">
            Starting balance: {formatPKR(dashboard.cash.startingBalance)}. Is
            this correct?
          </CardDescription>
          <div className="flex gap-3">
            <Button
              size="sm"
              onClick={() =>
                api("/cycles/confirm-rollover", { method: "POST", body: "{}" })
                  .then(() =>
                    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
                  )
              }
            >
              Confirm
            </Button>
            <Link href="/cycles/adjust">
              <Button variant="outline" size="sm">
                Adjust
              </Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardDescription>Cash Available</CardDescription>
          <p className="mt-1 text-2xl font-bold text-primary">
            {formatPKR(dashboard?.cash.currentCashAvailable ?? 0)}
          </p>
        </Card>
        <Card>
          <CardDescription>Income This Cycle</CardDescription>
          <p className="mt-1 text-2xl font-bold">
            {formatPKR(dashboard?.cash.totalIncome ?? 0)}
          </p>
        </Card>
        <Card>
          <CardDescription>Spent This Cycle</CardDescription>
          <p className="mt-1 text-2xl font-bold">
            {formatPKR(dashboard?.cash.totalExpenses ?? 0)}
          </p>
        </Card>
      </div>

      <Card className="mb-8">
        <CardTitle className="mb-1">Log expense or income</CardTitle>
        <CardDescription className="mb-4">
          Try: Petrol 7550 · Salary 120000 · Charity 1000
        </CardDescription>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (rawInput.trim()) logMutation.mutate(rawInput.trim());
          }}
          className="flex gap-3"
        >
          <Input
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="Description amount"
            className="flex-1"
            autoFocus
          />
          <Button type="submit" disabled={logMutation.isPending}>
            {logMutation.isPending ? "..." : "Log"}
          </Button>
        </form>
        {feedback && (
          <p className="mt-3 text-sm text-primary">{feedback}</p>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle className="mb-4">Goals</CardTitle>
          {dashboard?.goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No goals yet</p>
          ) : (
            <div className="space-y-4">
              {dashboard?.goals.map((goal) => (
                <div key={goal.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{goal.name}</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Target: {formatPKR(goal.targetAmount)}
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
                    <p className="text-xs text-muted-foreground">
                      {tx.category} · {tx.type}
                    </p>
                  </div>
                  <span
                    className={
                      tx.type === "INCOME" ? "text-primary" : "text-foreground"
                    }
                  >
                    {tx.type === "INCOME" ? "+" : "-"}
                    {formatPKR(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        {dashboard?.cycle.daysRemaining ?? 0} days left in cycle · Safe To
        Spend & Health Score coming in Phase 2
      </p>
    </main>
  );
}
