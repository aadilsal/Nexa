import { Section, Text } from "@react-email/components";
import {
  Badge,
  Button,
  Card,
  FinancialSummaryCard,
  GoalProgressCard,
  Hero,
  InfoBox,
  KpiGrid,
} from "../components";
import { EmailLayout } from "../layouts/email-layout";
import type { EmailTemplate } from "../types";
import { greeting } from "../shared/render-helpers";
import { plainTextLines } from "../utils/plain-text";
import { formatPKR } from "../utils/format";

export interface WeeklyReviewEmailProps {
  firstName?: string | null;
  weekLabel: string;
  income: number;
  spent: number;
  saved: number;
  healthScore: number;
  safeToSpend: number;
  overallRating: string;
  narrative: string;
  aiInsight?: string;
  goals?: Array<{
    goalName: string;
    progress: number;
    targetAmount: number;
    currentAmount: number;
    onTrack: boolean;
  }>;
  reportUrl: string;
  appUrl?: string;
}

export const weeklyReviewEmailMeta = {
  subject: (p: WeeklyReviewEmailProps) => `Your Weekly Review — ${p.weekLabel}`,
  previewText: (p: WeeklyReviewEmailProps) =>
    `Income ${formatPKR(p.income)} · Saved ${formatPKR(p.saved)} · Health ${p.healthScore}`,
  purpose: "Weekly financial summary delivered via email.",
  uxReasoning: "KPI grid + narrative + goals gives scannable overview with depth on click-through.",
  customizationNotes: "overallRating from engine; narrative from Groq.",
};

function ratingBadge(rating: string) {
  const normalized = rating.replace(/_/g, " ");
  const variant =
    rating.includes("GREAT") || rating.includes("GOOD")
      ? "success"
      : rating.includes("NEEDS")
        ? "warning"
        : "default";
  return <Badge variant={variant as "success" | "warning" | "default"}>{normalized}</Badge>;
}

export function WeeklyReviewEmail(props: WeeklyReviewEmailProps) {
  const {
    firstName,
    weekLabel,
    income,
    spent,
    saved,
    healthScore,
    safeToSpend,
    overallRating,
    narrative,
    aiInsight,
    goals = [],
    reportUrl,
    appUrl = "https://nexa.app",
  } = props;

  const preview =
    typeof weeklyReviewEmailMeta.previewText === "function"
      ? weeklyReviewEmailMeta.previewText(props)
      : weeklyReviewEmailMeta.previewText;

  return (
    <EmailLayout
      preview={preview}
      appUrl={appUrl}
      showUnsubscribe
      unsubscribeUrl={`${appUrl}/profile`}
    >
      <Hero
        title="Weekly Review"
        description={`${greeting(firstName)}, here's how ${weekLabel} went.`}
      />
      <Section style={{ marginBottom: "16px" }}>{ratingBadge(overallRating)}</Section>
      <FinancialSummaryCard
        title="This week at a glance"
        income={income}
        expenses={spent}
        savings={saved}
        healthScore={healthScore}
        safeToSpend={safeToSpend}
      />
      <Card>
        <Text style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>
          Summary
        </Text>
        <Text style={{ margin: 0, fontSize: "15px", lineHeight: "1.6", color: "#475569" }}>
          {narrative}
        </Text>
      </Card>
      {aiInsight && (
        <InfoBox title="AI Insight">{aiInsight}</InfoBox>
      )}
      {goals.length > 0 && (
        <Section>
          <Text style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600, color: "#0F172A" }}>
            Goal progress
          </Text>
          {goals.map((g, i) =>
            g.targetAmount > 0 ? (
              <GoalProgressCard key={i} {...g} />
            ) : (
              <Card key={i}>
                <Text style={{ margin: 0, fontSize: "14px", color: "#0F172A" }}>
                  {g.goalName}: {g.progress.toFixed(0)}% complete
                  {!g.onTrack && (
                    <span style={{ color: "#F59E0B", marginLeft: "8px" }}>· Behind</span>
                  )}
                </Text>
              </Card>
            ),
          )}
        </Section>
      )}
      <Section style={{ textAlign: "center", marginTop: "32px" }}>
        <Button href={reportUrl}>View Full Report</Button>
      </Section>
    </EmailLayout>
  );
}

export const weeklyReviewEmail: EmailTemplate<WeeklyReviewEmailProps> = {
  meta: weeklyReviewEmailMeta,
  Component: WeeklyReviewEmail,
  exampleProps: {
    firstName: "Aadil",
    weekLabel: "Mar 24 – Mar 30",
    income: 120000,
    spent: 45000,
    saved: 75000,
    healthScore: 78,
    safeToSpend: 4250,
    overallRating: "GOOD_WEEK",
    narrative:
      "You saved more than last week. Dining was your highest category — still within your variable estimate.",
    aiInsight: "You're spending less on dining this month compared to your 3-month average.",
    goals: [
      {
        goalName: "Emergency Fund",
        progress: 45,
        targetAmount: 300000,
        currentAmount: 135000,
        onTrack: true,
      },
    ],
    reportUrl: "https://nexa.app/weekly-review",
  },
  toPlainText: (p) =>
    plainTextLines([
      `${greeting(p.firstName)}, Weekly Review — ${p.weekLabel}`,
      `Income: ${formatPKR(p.income)} | Spent: ${formatPKR(p.spent)} | Saved: ${formatPKR(p.saved)}`,
      `Health Score: ${p.healthScore} | Safe To Spend: ${formatPKR(p.safeToSpend)}`,
      p.narrative,
      p.aiInsight,
      `Full report: ${p.reportUrl}`,
    ]),
};

export interface MonthlyReviewEmailProps {
  firstName?: string | null;
  monthLabel: string;
  income: number;
  expenses: number;
  savings: number;
  largestCategory: { name: string; amount: number };
  healthScore: number;
  emergencyFundProgress: number;
  topInsight: string;
  goalProgress: Array<{ name: string; progress: number }>;
  reportUrl: string;
  appUrl?: string;
}

export const monthlyReviewEmailMeta = {
  subject: (p: MonthlyReviewEmailProps) => `Your ${p.monthLabel} Financial Report`,
  previewText: "Your monthly financial summary is ready.",
  purpose: "Monthly digest for deeper financial review.",
  uxReasoning: "Report-style layout mirrors premium fintech statements — trust through clarity.",
};

export function MonthlyReviewEmail(props: MonthlyReviewEmailProps) {
  const {
    firstName,
    monthLabel,
    income,
    expenses,
    savings,
    largestCategory,
    healthScore,
    emergencyFundProgress,
    topInsight,
    goalProgress,
    reportUrl,
    appUrl = "https://nexa.app",
  } = props;

  return (
    <EmailLayout preview={monthlyReviewEmailMeta.previewText as string} appUrl={appUrl} showUnsubscribe unsubscribeUrl={`${appUrl}/profile`}>
      <Hero title={`${monthLabel} Report`} description={`${greeting(firstName)}, your monthly financial summary.`} />
      <KpiGrid
        items={[
          { label: "Income", value: formatPKR(income), accent: "success" },
          { label: "Expenses", value: formatPKR(expenses), accent: "default" },
          { label: "Net Savings", value: formatPKR(savings), accent: "primary" },
          { label: "Health Score", value: String(healthScore), sublabel: "/ 100", accent: "primary" },
        ]}
      />
      <Card>
        <Text style={{ margin: "0 0 4px", fontSize: "12px", color: "#64748B" }}>Largest category</Text>
        <Text style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#0F172A" }}>
          {largestCategory.name} — {formatPKR(largestCategory.amount)}
        </Text>
      </Card>
      <InfoBox title="Top insight">{topInsight}</InfoBox>
      <Section>
        <Text style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600 }}>Emergency fund</Text>
        <Text style={{ margin: 0, fontSize: "14px", color: "#64748B" }}>
          {emergencyFundProgress.toFixed(0)}% funded
        </Text>
      </Section>
      {goalProgress.map((g, i) => (
        <Card key={i}>
          <Text style={{ margin: 0, fontSize: "14px", color: "#0F172A" }}>
            {g.name}: {g.progress.toFixed(0)}%
          </Text>
        </Card>
      ))}
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button href={reportUrl}>View Full Report</Button>
      </Section>
    </EmailLayout>
  );
}

export const monthlyReviewEmail: EmailTemplate<MonthlyReviewEmailProps> = {
  meta: monthlyReviewEmailMeta,
  Component: MonthlyReviewEmail,
  exampleProps: {
    firstName: "Aadil",
    monthLabel: "March 2026",
    income: 480000,
    expenses: 195000,
    savings: 285000,
    largestCategory: { name: "Food & Dining", amount: 42000 },
    healthScore: 82,
    emergencyFundProgress: 45,
    topInsight: "Your savings rate improved 8% compared to last month.",
    goalProgress: [{ name: "Emergency Fund", progress: 45 }],
    reportUrl: "https://nexa.app/dashboard",
  },
  toPlainText: (p) =>
    plainTextLines([
      `${p.monthLabel} Report`,
      `Income: ${formatPKR(p.income)} | Expenses: ${formatPKR(p.expenses)}`,
      p.topInsight,
      p.reportUrl,
    ]),
};
