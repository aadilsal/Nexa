"use client";

import { useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { captureEvent } from "@/lib/posthog";
import { formatPKR } from "@/lib/utils";

interface SimulationResult {
  recommendation: "WAIT" | "GO_AHEAD";
  triggeredRule: string | null;
  suggestedWaitUntil: string | null;
  explanation: string;
  impacts: {
    emergencyFundDelayDays: number;
    savingsRateBefore: number;
    savingsRateAfter: number;
    goalDelays: Array<{ goalName: string; delayDays: number }>;
  };
}

export default function CanIBuyPage() {
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api<SimulationResult>("/simulations/purchase", {
        method: "POST",
        body: JSON.stringify({
          itemName,
          amount: Number(amount),
        }),
      }),
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Simulation failed"),
    onSuccess: (data) => {
      captureEvent("can_i_buy_simulated", {
        recommendation: data.recommendation,
      });
    },
  });

  const result = mutation.data;

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <AppNav />
      <h1 className="mb-2 text-2xl font-bold">Can I Buy This?</h1>
      <p className="mb-8 text-muted-foreground">
        Simulate a purchase and see how it affects your goals.
      </p>

      <Card>
        <CardTitle className="mb-4">Purchase details</CardTitle>
        <div className="space-y-4">
          <Input
            placeholder="Item name (e.g. iPhone)"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Amount in PKR"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="font-mono"
          />
          <Button
            className="w-full"
            disabled={!itemName || !amount || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Simulating..." : "Simulate Purchase"}
          </Button>
        </div>
      </Card>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-4"
        >
          <Card
            className={
              result.recommendation === "GO_AHEAD"
                ? "border-primary/30 bg-primary/5"
                : "border-destructive/30 bg-destructive/5"
            }
          >
            <CardTitle>
              {result.recommendation === "GO_AHEAD"
                ? "Go Ahead"
                : "Wait"}
            </CardTitle>
            <CardDescription className="mt-2 text-foreground">
              {result.explanation}
            </CardDescription>
            {result.suggestedWaitUntil && (
              <p className="mt-3 text-sm text-muted-foreground">
                Suggested wait until:{" "}
                {new Date(result.suggestedWaitUntil).toLocaleDateString("en-PK", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </Card>

          <Card>
            <CardTitle className="mb-3 text-base">Impact</CardTitle>
            <ul className="space-y-2 text-sm">
              <li>
                Savings rate:{" "}
                {Math.round(result.impacts.savingsRateBefore * 100)}% →{" "}
                {Math.round(result.impacts.savingsRateAfter * 100)}%
              </li>
              {result.impacts.goalDelays.map((g) => (
                <li key={g.goalName}>
                  {g.goalName}: delayed {g.delayDays} days
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      )}
    </main>
  );
}
