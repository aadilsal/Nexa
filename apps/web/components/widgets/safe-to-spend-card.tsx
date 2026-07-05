"use client";

import { motion } from "motion/react";
import { Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPKR } from "@/lib/utils";

interface SafeToSpendCardProps {
  amount: number;
  baseline: number;
  trendMultiplier?: number;
  daysRemaining?: number;
  className?: string;
}

export function SafeToSpendCard({
  amount,
  baseline,
  trendMultiplier = 1,
  daysRemaining,
  className,
}: SafeToSpendCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-primary/25 bg-card shadow-card",
        className,
      )}
    >
      <div className="border-b border-primary/15 bg-primary-muted px-6 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Wallet className="h-4 w-4" aria-hidden="true" />
          Safe to spend today
        </div>
      </div>
      <CardContent className="p-6">
        <motion.p
          key={amount}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="font-mono text-4xl font-bold tabular-nums tracking-tight text-primary"
          aria-label={`${amount} Pakistani Rupees safe to spend today`}
        >
          {formatPKR(amount)}
        </motion.p>
        <p className="mt-2 text-xs text-muted-foreground">
          Baseline {formatPKR(baseline)}
          {trendMultiplier !== 1 &&
            ` · Trend ×${trendMultiplier.toFixed(2)}`}
        </p>
        {daysRemaining !== undefined ? (
          <p className="mt-3 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs text-muted-foreground">
            {daysRemaining} days left in cycle
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
