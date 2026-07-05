"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Minus, Pencil, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LabelWithInfo } from "@/components/ui/info-tip";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";
import { FEATURE_HELP } from "@/lib/feature-help";

export interface SafeToSpendBreakdown {
  currentCashAvailable: number;
  remainingFixedExpenses: number;
  remainingGoalContributions: number;
  emergencyFundProtection: number;
  shortfall: number;
}

export interface SafeToSpendSourceLine {
  name: string;
  monthlyAmount: number;
  reservedAmount: number;
}

export interface SafeToSpendCashDetail {
  startingBalance: number;
  incomeLogged: number;
  expensesLogged: number;
}

export interface SafeToSpendExplanation {
  totalCycleDays: number;
  daysRemaining: number;
  cashDetail?: SafeToSpendCashDetail;
  fixedBills: SafeToSpendSourceLine[];
  goalContributions: SafeToSpendSourceLine[];
  emergencyFund?: SafeToSpendSourceLine;
}

interface SafeToSpendCardProps {
  amount: number;
  baseline: number;
  trendMultiplier?: number;
  daysRemaining?: number;
  breakdown?: SafeToSpendBreakdown;
  explanation?: SafeToSpendExplanation;
  className?: string;
}

function BreakdownRow({
  label,
  value,
  formatAmount,
  emphasis,
  prefix,
  sublabel,
}: {
  label: string;
  value: number;
  formatAmount: (n: number) => string;
  emphasis?: "positive" | "negative" | "muted";
  prefix?: string;
  sublabel?: string;
}) {
  const display =
    prefix && value !== 0
      ? `${prefix}${formatAmount(Math.abs(value))}`
      : formatAmount(value);

  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <div className="min-w-0">
        <span className="text-muted-foreground">{label}</span>
        {sublabel ? (
          <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground/80">
            {sublabel}
          </p>
        ) : null}
      </div>
      <span
        className={cn(
          "shrink-0 font-mono tabular-nums",
          emphasis === "negative" && "text-destructive",
          emphasis === "positive" && "text-foreground",
          emphasis === "muted" && "text-muted-foreground",
        )}
      >
        {display}
      </span>
    </div>
  );
}

function SourceGroup({
  title,
  total,
  lines,
  daysRemaining,
  totalCycleDays,
  formatAmount,
  editHref,
  editLabel,
}: {
  title: string;
  total: number;
  lines: SafeToSpendSourceLine[];
  daysRemaining: number;
  totalCycleDays: number;
  formatAmount: (n: number) => string;
  editHref?: string;
  editLabel?: string;
}) {
  if (total <= 0 && lines.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <BreakdownRow
        label={title}
        value={total}
        formatAmount={formatAmount}
        prefix="−"
        emphasis="muted"
        sublabel={`From your plan · ${daysRemaining} of ${totalCycleDays} days left in cycle`}
      />
      {lines.length > 0 ? (
        <ul className="ml-2 space-y-1 border-l border-border pl-3">
          {lines.map((line) => (
            <li
              key={line.name}
              className="flex items-start justify-between gap-2 text-[11px]"
            >
              <span className="min-w-0 text-muted-foreground">
                {line.name}
                <span className="block text-[10px] text-muted-foreground/70">
                  {formatAmount(line.monthlyAmount)}/mo →{" "}
                  {formatAmount(line.reservedAmount)} reserved
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {editHref ? (
        <Link
          href={editHref}
          className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
          {editLabel ?? "Edit"}
        </Link>
      ) : null}
    </div>
  );
}

export function SafeToSpendCard({
  amount,
  baseline,
  trendMultiplier = 1,
  daysRemaining,
  breakdown,
  explanation,
  className,
}: SafeToSpendCardProps) {
  const { formatAmount } = useCurrency();

  const discretionaryPool = breakdown
    ? Math.max(
        0,
        breakdown.currentCashAvailable -
          breakdown.remainingFixedExpenses -
          breakdown.remainingGoalContributions -
          breakdown.emergencyFundProtection,
      )
    : null;

  const hasBreakdown = breakdown != null;
  const hasShortfall = (breakdown?.shortfall ?? 0) > 0;
  const cycleDays = explanation?.totalCycleDays;
  const cycleDaysLeft = explanation?.daysRemaining ?? daysRemaining;

  const cashSublabel =
    explanation?.cashDetail &&
    (explanation.cashDetail.startingBalance !== 0 ||
      explanation.cashDetail.incomeLogged !== 0 ||
      explanation.cashDetail.expensesLogged !== 0)
      ? `Starting ${formatAmount(explanation.cashDetail.startingBalance)} + income logged ${formatAmount(explanation.cashDetail.incomeLogged)} − expenses logged ${formatAmount(explanation.cashDetail.expensesLogged)}`
      : "From your cycle starting balance and logged transactions";

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
          <LabelWithInfo info={FEATURE_HELP.safeToSpend}>
            Safe to spend today
          </LabelWithInfo>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-primary/80">
          What you can spend guilt-free today — after bills, goals, and your
          emergency fund are covered.
        </p>
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

        {daysRemaining !== undefined ? (
          <p className="mt-3 inline-flex items-center rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs text-muted-foreground">
            {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left in this
            cycle
          </p>
        ) : null}

        {hasBreakdown ? (
          <Accordion
            type="single"
            collapsible
            defaultValue="breakdown"
            className="mt-4"
          >
            <AccordionItem
              value="breakdown"
              className="rounded-md border border-border bg-surface-2 px-3"
            >
              <AccordionTrigger className="py-3 text-xs font-medium hover:no-underline">
                How this is calculated
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-3">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Every number below comes from{" "}
                  <strong className="font-medium text-foreground">
                    your bills, income, and goals
                  </strong>
                  . Nexa prorates monthly amounts across the days left in your
                  pay cycle, then subtracts those reservations from your
                  available cash.
                </p>

                <div className="space-y-3 rounded-md border border-border bg-card p-3">
                  <BreakdownRow
                    label="Current cash available"
                    value={breakdown.currentCashAvailable}
                    formatAmount={formatAmount}
                    emphasis="positive"
                    sublabel={cashSublabel}
                  />

                  {explanation &&
                  cycleDays != null &&
                  cycleDaysLeft != null ? (
                    <>
                      <SourceGroup
                        title="Fixed bills still due"
                        total={breakdown.remainingFixedExpenses}
                        lines={explanation.fixedBills}
                        daysRemaining={cycleDaysLeft}
                        totalCycleDays={cycleDays}
                        formatAmount={formatAmount}
                        editHref="/profile/plan"
                        editLabel="Edit your bills"
                      />
                      <SourceGroup
                        title="Goal contributions this cycle"
                        total={breakdown.remainingGoalContributions}
                        lines={explanation.goalContributions}
                        daysRemaining={cycleDaysLeft}
                        totalCycleDays={cycleDays}
                        formatAmount={formatAmount}
                        editHref="/goals"
                        editLabel="Edit your goals"
                      />
                      {breakdown.emergencyFundProtection > 0 &&
                      explanation.emergencyFund ? (
                        <SourceGroup
                          title="Emergency fund protection"
                          total={breakdown.emergencyFundProtection}
                          lines={[explanation.emergencyFund]}
                          daysRemaining={cycleDaysLeft}
                          totalCycleDays={cycleDays}
                          formatAmount={formatAmount}
                          editHref="/goals"
                          editLabel="Edit emergency fund goal"
                        />
                      ) : null}
                    </>
                  ) : (
                    <>
                      {breakdown.remainingFixedExpenses > 0 ? (
                        <BreakdownRow
                          label={
                            daysRemaining != null
                              ? `Fixed bills still due (${daysRemaining}d left)`
                              : "Fixed bills still due"
                          }
                          value={breakdown.remainingFixedExpenses}
                          formatAmount={formatAmount}
                          prefix="−"
                          emphasis="muted"
                        />
                      ) : null}
                      {breakdown.remainingGoalContributions > 0 ? (
                        <BreakdownRow
                          label="Goal contributions this cycle"
                          value={breakdown.remainingGoalContributions}
                          formatAmount={formatAmount}
                          prefix="−"
                          emphasis="muted"
                        />
                      ) : null}
                      {breakdown.emergencyFundProtection > 0 ? (
                        <BreakdownRow
                          label="Emergency fund protection"
                          value={breakdown.emergencyFundProtection}
                          formatAmount={formatAmount}
                          prefix="−"
                          emphasis="muted"
                        />
                      ) : null}
                    </>
                  )}

                  <div className="my-1.5 flex items-center gap-2 border-t border-border pt-1.5">
                    <Minus
                      className="h-3 w-3 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      After reservations
                    </span>
                  </div>

                  {hasShortfall ? (
                    <BreakdownRow
                      label="Shortfall — obligations exceed cash"
                      value={breakdown.shortfall}
                      formatAmount={formatAmount}
                      emphasis="negative"
                    />
                  ) : (
                    <>
                      <BreakdownRow
                        label="Available for daily spending"
                        value={discretionaryPool ?? 0}
                        formatAmount={formatAmount}
                        emphasis="positive"
                      />
                      {daysRemaining != null && daysRemaining > 0 ? (
                        <BreakdownRow
                          label={`÷ ${daysRemaining} days remaining`}
                          value={baseline}
                          formatAmount={formatAmount}
                        />
                      ) : null}
                      {trendMultiplier !== 1 ? (
                        <BreakdownRow
                          label={`× ${trendMultiplier.toFixed(2)} day-of-week trend`}
                          value={amount}
                          formatAmount={formatAmount}
                        />
                      ) : null}
                      <div className="my-1 border-t border-border" />
                      <BreakdownRow
                        label="Safe to spend today"
                        value={amount}
                        formatAmount={formatAmount}
                        emphasis="positive"
                      />
                    </>
                  )}
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  {hasShortfall
                    ? "Your remaining bills and goals exceed available cash, so there is nothing left for discretionary spending today. Update your bills, income, or goals if these numbers look wrong."
                    : amount === 0
                      ? "After reservations, nothing remains to spread across the days left in your cycle."
                      : `You can spend up to ${formatAmount(amount)} today without falling behind on bills or goals.`}
                </p>

                <Link
                  href="/profile/plan"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Update bills, income & spending estimate
                </Link>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Log income and expenses to see a full breakdown of how this number is
            calculated.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
