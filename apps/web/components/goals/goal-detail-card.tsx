"use client";

import { Pencil, Trash2 } from "lucide-react";
import { GOAL_PRIORITY_LABELS, type GoalPriority } from "@nexa/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { HighlightSurface } from "@/components/layouts/surface";
import { LabelWithInfo } from "@/components/ui/info-tip";
import { FEATURE_HELP } from "@/lib/feature-help";

export interface TrackedGoal {
  id: string;
  name: string;
  priority: GoalPriority;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  targetDate: string;
  isEmergencyFund: boolean;
  requiredMonthlySavings: number;
  eta: string;
  onTrack: boolean;
  delayDays: number;
}

const RISK_FACTOR_LABELS: Record<string, string> = {
  behind_schedule: "Behind schedule",
  insufficient_savings: "Savings rate below target",
  reduced_income: "Income below plan this cycle",
  increased_spending: "Spending above plan this cycle",
};

interface GoalDetailCardProps {
  goal: TrackedGoal;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  riskFactors?: string[];
  formatAmount: (amount: number) => string;
  onEdit: () => void;
  onDelete: () => void;
}

export function GoalDetailCard({
  goal,
  riskLevel,
  riskFactors = [],
  formatAmount,
  onEdit,
  onDelete,
}: GoalDetailCardProps) {
  const etaDate = new Date(goal.eta);
  const targetDate = new Date(goal.targetDate);
  const uniqueFactors = [...new Set(riskFactors)];

  return (
    <HighlightSurface
      variant={goal.isEmergencyFund ? "primary" : "default"}
      className="space-y-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight">{goal.name}</h3>
            <Badge variant={goal.onTrack ? "success" : "warning"}>
              {goal.onTrack ? "On track" : "Delayed"}
            </Badge>
            {goal.isEmergencyFund ? (
              <Badge variant="outline">Emergency fund</Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {GOAL_PRIORITY_LABELS[goal.priority]} priority · Target{" "}
            {targetDate.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-mono tabular-nums">
            {formatAmount(goal.currentAmount)} of {formatAmount(goal.targetAmount)}
          </span>
          <span className="font-semibold tabular-nums">{goal.progress}%</span>
        </div>
        <Progress value={goal.progress} />
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <LabelWithInfo info={FEATURE_HELP.goalEta}>Projected completion</LabelWithInfo>
          </dt>
          <dd className="mt-1 text-sm font-medium">
            {etaDate.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <LabelWithInfo info={FEATURE_HELP.requiredMonthlySavings}>
              Required monthly savings
            </LabelWithInfo>
          </dt>
          <dd className="mt-1 font-mono text-sm tabular-nums">
            {formatAmount(goal.requiredMonthlySavings)}
          </dd>
        </div>
        {!goal.onTrack && goal.delayDays > 0 ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Schedule impact
            </dt>
            <dd className="mt-1 text-sm text-warning">
              About {goal.delayDays} day{goal.delayDays === 1 ? "" : "s"} behind target date
            </dd>
          </div>
        ) : null}
      </dl>

      {riskLevel && riskLevel !== "LOW" && uniqueFactors.length > 0 ? (
        <div className="rounded-lg border border-border/60 bg-surface-2 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Risk signals · {riskLevel.toLowerCase()}
          </p>
          <ul className="mt-2 space-y-1">
            {uniqueFactors.map((factor) => (
              <li key={factor} className="text-sm text-foreground/90">
                · {RISK_FACTOR_LABELS[factor] ?? factor.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Progress updates automatically when your pay cycle rolls over based on surplus
        savings. Log expenses and income to keep projections accurate.
      </p>
    </HighlightSurface>
  );
}
