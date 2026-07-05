import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {Icon ? (
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : null}
        </div>
        <div className="mt-2 font-mono text-3xl font-bold tabular-nums tracking-tight">
          {value}
        </div>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
        {trend ? (
          <p
            className={cn(
              "mt-2 text-xs font-medium",
              trend.positive ? "text-success" : "text-destructive",
            )}
          >
            {trend.value}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
