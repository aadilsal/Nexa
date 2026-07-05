"use client";

import { motion } from "motion/react";
import { Activity, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HealthScoreCardProps {
  score: number;
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

export function HealthScoreCard({ score, className }: HealthScoreCardProps) {
  const { label, variant } = getHealthLabel(score);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Activity className="h-4 w-4" aria-hidden="true" />
            Financial health
          </div>
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
      </CardContent>
    </Card>
  );
}

interface InsightCardProps {
  insight: string;
  className?: string;
}

export function InsightCard({ insight, className }: InsightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card
        className={cn(
          "border-l-4 border-l-primary bg-card shadow-sm",
          className,
        )}
      >
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Today&apos;s insight
          </div>
          <p className="text-sm leading-relaxed text-foreground">{insight}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
