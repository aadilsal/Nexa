import { Section, Text } from "@react-email/components";
import { formatPKR } from "../utils/format";

export interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  trend?: { direction: "up" | "down" | "neutral"; text: string };
  accent?: "primary" | "success" | "warning" | "danger" | "default";
}

const accentBorder: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  primary: "#4F46E5",
  success: "#16A34A",
  warning: "#F59E0B",
  danger: "#DC2626",
  default: "#E2E8F0",
};

export function KpiCard({ label, value, sublabel, trend, accent = "default" }: KpiCardProps) {
  return (
    <td
      style={{
        width: "50%",
        padding: "8px",
        verticalAlign: "top",
      }}
    >
      <Section
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderLeft: `3px solid ${accentBorder[accent]}`,
          borderRadius: "12px",
          padding: "16px 20px",
          height: "100%",
        }}
      >
        <Text style={{ margin: "0 0 4px", fontSize: "12px", color: "#64748B", fontWeight: 500 }}>
          {label}
        </Text>
        <Text
          style={{
            margin: "0 0 4px",
            fontSize: "22px",
            fontWeight: 700,
            color: "#0F172A",
            fontFamily: 'ui-monospace, "SF Mono", monospace',
          }}
        >
          {value}
        </Text>
        {sublabel && (
          <Text style={{ margin: 0, fontSize: "12px", color: "#94A3B8" }}>
            {sublabel}
          </Text>
        )}
        {trend && (
          <Text
            style={{
              margin: "8px 0 0",
              fontSize: "12px",
              fontWeight: 500,
              color:
                trend.direction === "up"
                  ? "#16A34A"
                  : trend.direction === "down"
                    ? "#DC2626"
                    : "#64748B",
            }}
          >
            {trend.text}
          </Text>
        )}
      </Section>
    </td>
  );
}

export interface KpiGridProps {
  items: KpiCardProps[];
}

export function KpiGrid({ items }: KpiGridProps) {
  const rows: KpiCardProps[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }

  return (
    <Section style={{ marginBottom: "24px" }}>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((item, ci) => (
                <KpiCard key={ci} {...item} />
              ))}
              {row.length === 1 && <td style={{ width: "50%" }} />}
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

export interface FinancialSummaryCardProps {
  title: string;
  income: number;
  expenses: number;
  savings: number;
  healthScore?: number;
  safeToSpend?: number;
}

export function FinancialSummaryCard({
  title,
  income,
  expenses,
  savings,
  healthScore,
  safeToSpend,
}: FinancialSummaryCardProps) {
  return (
    <Section
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "24px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
      }}
    >
      <Text style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: 600, color: "#0F172A" }}>
        {title}
      </Text>
      <KpiGrid
        items={[
          { label: "Income", value: formatPKR(income), accent: "success" },
          { label: "Expenses", value: formatPKR(expenses), accent: "default" },
          { label: "Saved", value: formatPKR(savings), accent: "primary" },
          ...(healthScore !== undefined
            ? [{ label: "Health Score", value: `${healthScore}`, sublabel: "out of 100", accent: "primary" as const }]
            : []),
          ...(safeToSpend !== undefined
            ? [{ label: "Safe To Spend™", value: formatPKR(safeToSpend), accent: "success" as const }]
            : []),
        ]}
      />
    </Section>
  );
}

export interface ProgressBarProps {
  label: string;
  progress: number;
  targetLabel?: string;
}

export function ProgressBar({ label, progress, targetLabel }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, progress));
  return (
    <Section style={{ marginBottom: "16px" }}>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
        <tbody>
          <tr>
            <td>
              <Text style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 500, color: "#0F172A" }}>
                {label}
              </Text>
            </td>
            <td align="right">
              <Text style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 600, color: "#4F46E5" }}>
                {pct.toFixed(0)}%
              </Text>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <div
                style={{
                  backgroundColor: "#E2E8F0",
                  borderRadius: "9999px",
                  height: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#4F46E5",
                    borderRadius: "9999px",
                    height: "8px",
                    width: `${pct}%`,
                  }}
                />
              </div>
              {targetLabel && (
                <Text style={{ margin: "6px 0 0", fontSize: "12px", color: "#94A3B8" }}>
                  {targetLabel}
                </Text>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

export interface GoalProgressCardProps {
  goalName: string;
  progress: number;
  targetAmount: number;
  currentAmount: number;
  eta?: string;
  onTrack?: boolean;
}

export function GoalProgressCard({
  goalName,
  progress,
  targetAmount,
  currentAmount,
  eta,
  onTrack = true,
}: GoalProgressCardProps) {
  return (
    <Section
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "16px",
      }}
    >
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
        <tbody>
          <tr>
            <td>
              <Text style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#0F172A" }}>
                {goalName}
              </Text>
            </td>
            <td align="right">
              <Text
                style={{
                  margin: 0,
                  fontSize: "12px",
                  fontWeight: 600,
                  color: onTrack ? "#16A34A" : "#F59E0B",
                }}
              >
                {onTrack ? "On track" : "Behind"}
              </Text>
            </td>
          </tr>
        </tbody>
      </table>
      <ProgressBar
        label={`${formatPKR(currentAmount)} of ${formatPKR(targetAmount)}`}
        progress={progress}
        targetLabel={eta ? `ETA: ${eta}` : undefined}
      />
    </Section>
  );
}

export interface StatisticBlockProps {
  stats: Array<{ label: string; value: string }>;
}

export function StatisticBlock({ stats }: StatisticBlockProps) {
  return (
    <Section style={{ marginBottom: "24px" }}>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
        <tbody>
          <tr>
            {stats.map((stat, i) => (
              <td
                key={i}
                align="center"
                style={{
                  padding: "16px 8px",
                  borderRight: i < stats.length - 1 ? "1px solid #E2E8F0" : "none",
                  width: `${100 / stats.length}%`,
                }}
              >
                <Text style={{ margin: "0 0 4px", fontSize: "11px", color: "#64748B", textTransform: "uppercase" }}>
                  {stat.label}
                </Text>
                <Text style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
                  {stat.value}
                </Text>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

/** Email-safe bar chart approximation using table cells */
export interface MiniBarChartProps {
  items: Array<{ label: string; value: number; maxValue: number }>;
}

export function MiniBarChart({ items }: MiniBarChartProps) {
  return (
    <Section style={{ marginBottom: "24px" }}>
      {items.map((item, i) => {
        const pct = item.maxValue > 0 ? (item.value / item.maxValue) * 100 : 0;
        return (
          <div key={i} style={{ marginBottom: "12px" }}>
            <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td style={{ fontSize: "13px", color: "#64748B", paddingBottom: "4px" }}>
                    {item.label}
                  </td>
                  <td align="right" style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>
                    {formatPKR(item.value)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <div style={{ backgroundColor: "#E2E8F0", borderRadius: "4px", height: "6px" }}>
                      <div
                        style={{
                          backgroundColor: "#4F46E5",
                          borderRadius: "4px",
                          height: "6px",
                          width: `${pct}%`,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </Section>
  );
}
