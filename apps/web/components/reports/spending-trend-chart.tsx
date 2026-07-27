"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface TrendBucket {
  label: string;
  bucketStart: string;
  bucketEnd: string;
  income: number;
  expenses: number;
}

function compactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: unknown }>;
  label?: string | number;
  formatAmount: (amount: number) => string;
}

function ChartTooltip({ active, payload, label, formatAmount }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  if (typeof value !== "number") return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-mono font-semibold tabular-nums text-foreground">
        {formatAmount(value)}
      </p>
      <p className="mt-0.5 text-muted-foreground">{label}</p>
    </div>
  );
}

interface SpendingTrendChartProps {
  data: TrendBucket[];
  formatAmount: (amount: number) => string;
}

export function SpendingTrendChart({ data, formatAmount }: SpendingTrendChartProps) {
  const dense = data.length > 15;

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            interval={dense ? Math.ceil(data.length / 8) : 0}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={compactNumber}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            content={(props) => <ChartTooltip {...props} formatAmount={formatAmount} />}
          />
          <Bar
            dataKey="expenses"
            fill="var(--chart-1)"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
