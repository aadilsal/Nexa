"use client";

import { motion } from "motion/react";
import { HelpCircle, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";

export interface SafeToSpendBreakdown {
  currentCashAvailable: number;
  remainingFixedExpenses: number;
  remainingGoalContributions: number;
  emergencyFundProtection: number;
  shortfall: number;
}

interface SafeToSpendCardProps {
  amount: number;
  baseline: number;
  trendMultiplier?: number;
  daysRemaining?: number;
  breakdown?: SafeToSpendBreakdown;
  className?: string;
}

function BreakdownRow({
  label,
  value,
  formatAmount,
  emphasis,
}: {
  label: string;
  value: number;
  formatAmount: (n: number) => string;
  emphasis?: "positive" | "negative";
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "shrink-0 font-mono tabular-nums",
          emphasis === "negative" && "text-destructive",
          emphasis === "positive" && "text-foreground",
        )}
      >
        {formatAmount(value)}
      </span>
    </div>
  );
}

export function SafeToSpendCard({
  amount,
  baseline,
  trendMultiplier = 1,
  daysRemaining,
  breakdown,
  className,
}: SafeToSpendCardProps) {
  const { formatAmount } = useCurrency();
  const showWhyZero =
    amount === 0 &&
    breakdown != null &&
    (breakdown.shortfall > 0 ||
      breakdown.remainingFixedExpenses > 0 ||
      breakdown.remainingGoalContributions > 0 ||
      breakdown.emergencyFundProtection > 0);

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
          aria-label={`${amount} safe to spend today`}
        >
          {formatAmount(amount)}
        </motion.p>
        <p className="mt-2 text-xs text-muted-foreground">
          Baseline {formatAmount(baseline)}
          {trendMultiplier !== 1 &&
            ` · Trend ×${trendMultiplier.toFixed(2)}`}
        </p>
        {daysRemaining !== undefined ? (
          <p className="mt-3 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs text-muted-foreground">
            {daysRemaining} days left in cycle
          </p>
        ) : null}

        {showWhyZero ? (
          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem
              value="why-zero"
              className="rounded-md border border-border bg-surface-2 px-3"
            >
              <AccordionTrigger className="py-3 text-xs font-medium hover:no-underline">
                <span className="flex items-center gap-2 text-left">
                  <HelpCircle
                    className="h-3.5 w-3.5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  Why is this 0?
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pb-3">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Safe To Spend is not your bank balance. Nexa sets aside money
                  for bills and goals first, then divides what&apos;s left across
                  the days remaining in your cycle.
                </p>
                <div className="space-y-1.5 rounded-md border border-border bg-card p-3">
                  <BreakdownRow
                    label="Current cash"
                    value={breakdown.currentCashAvailable}
                    formatAmount={formatAmount}
                    emphasis="positive"
                  />
                  {breakdown.remainingFixedExpenses > 0 ? (
                    <BreakdownRow
                      label={
                        daysRemaining != null
                          ? `Reserved for bills (${daysRemaining} days left)`
                          : "Reserved for bills"
                      }
                      value={-breakdown.remainingFixedExpenses}
                      formatAmount={formatAmount}
                    />
                  ) : null}
                  {breakdown.remainingGoalContributions > 0 ? (
                    <BreakdownRow
                      label="Reserved for goals this cycle"
                      value={-breakdown.remainingGoalContributions}
                      formatAmount={formatAmount}
                    />
                  ) : null}
                  {breakdown.emergencyFundProtection > 0 ? (
                    <BreakdownRow
                      label="Emergency fund cushion"
                      value={-breakdown.emergencyFundProtection}
                      formatAmount={formatAmount}
                    />
                  ) : null}
                  {breakdown.shortfall > 0 ? (
                    <>
                      <div className="my-1 border-t border-border" />
                      <BreakdownRow
                        label="Shortfall after reservations"
                        value={breakdown.shortfall}
                        formatAmount={formatAmount}
                        emphasis="negative"
                      />
                    </>
                  ) : null}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {breakdown.shortfall > 0
                    ? "Your obligations for the rest of this cycle exceed available cash, so there is nothing left for guilt-free daily spending."
                    : "After reservations, nothing remains to spread across the days left in your cycle."}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : null}
      </CardContent>
    </Card>
  );
}
