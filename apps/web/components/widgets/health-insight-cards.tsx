"use client";

import { motion } from "motion/react";
import { Activity, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LabelWithInfo } from "@/components/ui/info-tip";
import { cn } from "@/lib/utils";
import { sanitizeInsight } from "@/lib/sanitize-insight";
import { FEATURE_HELP } from "@/lib/feature-help";

export interface HealthScoreBreakdown {
  savingsRate: number;
  emergencyFund: number;
  goalProgress: number;
  spendingConsistency: number;
  incomeStability: number;
}

const BREAKDOWN_ITEMS: Array<{
  key: keyof HealthScoreBreakdown;
  label: string;
  info: string;
}> = [
  {
    key: "savingsRate",
    label: "Savings rate",
    info: "How much of your income you're keeping this cycle vs your target savings rate.",
  },
  {
    key: "emergencyFund",
    label: "Emergency fund",
    info: "Progress toward your emergency fund cushion.",
  },
  {
    key: "goalProgress",
    label: "Goal progress",
    info: "Average progress across your active financial goals.",
  },
  {
    key: "spendingConsistency",
    label: "Spending consistency",
    info: "How steady your daily spending is compared to your plan.",
  },
  {
    key: "incomeStability",
    label: "Income stability",
    info: "How closely logged income matches what you expected this cycle.",
  },
];

interface HealthScoreCardProps {
  score: number;
  breakdown?: HealthScoreBreakdown;
  className?: string;
}

function getHealthLabel(score: number): {
  label: string;
  variant: "success" | "warning" | "destructive";
} {
  if (score >= 75) return { label: "Good", variant: "success" };
  if (score >= 50) return { label: "Fair", variant: "warning" };
  return { label: "Needs attention", variant: "destructive" };
}

function getFactorVariant(
  value: number,
): "success" | "warning" | "destructive" {
  if (value >= 75) return "success";
  if (value >= 50) return "warning";
  return "destructive";
}

export function HealthScoreCard({
  score,
  breakdown,
  className,
}: HealthScoreCardProps) {
  const { label, variant } = getHealthLabel(score);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <LabelWithInfo
            info={FEATURE_HELP.healthScore}
            className="text-muted-foreground"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4" aria-hidden="true" />
              Financial health
            </span>
          </LabelWithInfo>
          <Badge variant={variant}>{label}</Badge>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-4xl font-bold tabular-nums tracking-tight"
        >
          {score}
          <span className="text-lg font-normal text-muted-foreground"> / 100</span>
        </motion.p>
        <Progress value={score} className="mt-4 h-2" />

        {breakdown ? (
          <div className="mt-5 space-y-3 border-t border-border/60 pt-5">
            {BREAKDOWN_ITEMS.map((item) => {
              const value = breakdown[item.key];
              const factorVariant = getFactorVariant(value);

              return (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <LabelWithInfo info={item.info} className="text-muted-foreground">
                      {item.label}
                    </LabelWithInfo>
                    <span
                      className={cn(
                        "shrink-0 font-mono font-medium tabular-nums",
                        factorVariant === "success" && "text-success",
                        factorVariant === "warning" && "text-warning",
                        factorVariant === "destructive" && "text-destructive",
                      )}
                    >
                      {value}
                    </span>
                  </div>
                  <Progress value={value} className="h-1" />
                </div>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

interface InsightCardProps {
  insight: string;
  className?: string;
}

export function InsightCard({ insight, className }: InsightCardProps) {
  const cleaned = sanitizeInsight(insight);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card
        className={cn(
          "overflow-hidden border border-border/60 bg-card shadow-sm",
          className,
        )}
      >
        <div className="h-1 bg-linear-to-r from-primary/80 via-primary to-primary/40" />
        <CardContent className="p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div>
              <LabelWithInfo info={FEATURE_HELP.aiInsight}>
                <p className="text-sm font-semibold text-foreground">Today&apos;s insight</p>
              </LabelWithInfo>
              <p className="text-xs text-muted-foreground">Based on your latest activity</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{cleaned}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
