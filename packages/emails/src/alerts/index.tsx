import { Section, Text } from "@react-email/components";
import { Badge, Button, Hero, InfoBox, WarningBox } from "../components";
import { EmailLayout } from "../layouts/email-layout";
import type { EmailTemplate } from "../types";
import { greeting } from "../shared/render-helpers";
import { plainTextLines } from "../utils/plain-text";
import { formatPKR } from "../utils/format";

type AlertBase = {
  firstName?: string | null;
  dashboardUrl: string;
  appUrl?: string;
};

function alertPlain(title: string, body: string, url: string): string {
  return plainTextLines([title, body, url]);
}

export interface SafeToSpendEmailProps extends AlertBase {
  amount: number;
  explanation: string;
  cycleDaysRemaining: number;
}

export const safeToSpendEmailMeta = {
  subject: (p: SafeToSpendEmailProps) => `Today's Safe To Spend: ${formatPKR(p.amount)}`,
  previewText: (p: SafeToSpendEmailProps) => p.explanation.slice(0, 80),
  purpose: "Daily Safe To Spend insight.",
  uxReasoning: "Lead with the number — users scan for the actionable figure first.",
};

export function SafeToSpendEmail(props: SafeToSpendEmailProps) {
  const { firstName, amount, explanation, cycleDaysRemaining, dashboardUrl, appUrl } = props;
  return (
    <EmailLayout preview={safeToSpendEmailMeta.previewText!(props)} appUrl={appUrl}>
      <Hero title="Today's Safe To Spend™" description={`${greeting(firstName)}, here's your daily guidance.`} />
      <Section style={{ textAlign: "center", marginBottom: "24px" }}>
        <Text style={{ margin: 0, fontSize: "40px", fontWeight: 700, color: "#4F46E5", fontFamily: "monospace" }}>
          {formatPKR(amount)}
        </Text>
        <Text style={{ margin: "8px 0 0", fontSize: "14px", color: "#64748B" }}>
          {cycleDaysRemaining} days left in your cycle
        </Text>
      </Section>
      <InfoBox title="Why this amount">{explanation}</InfoBox>
      <Button href={dashboardUrl}>Open Dashboard</Button>
    </EmailLayout>
  );
}

export const safeToSpendEmail: EmailTemplate<SafeToSpendEmailProps> = {
  meta: safeToSpendEmailMeta,
  Component: SafeToSpendEmail,
  exampleProps: {
    firstName: "Aadil",
    amount: 4250,
    explanation: "Based on your remaining cycle budget, fixed expenses, and goal allocations.",
    cycleDaysRemaining: 12,
    dashboardUrl: "https://nexa.app/dashboard",
  },
  toPlainText: (p) => alertPlain(`Safe To Spend: ${formatPKR(p.amount)}`, p.explanation, p.dashboardUrl),
};

export interface PurchaseSimulationEmailProps extends AlertBase {
  itemName: string;
  amount: number;
  decision: "GO_AHEAD" | "WAIT";
  explanation: string;
  suggestedWaitUntil?: string;
}

export const purchaseSimulationEmailMeta = {
  subject: "Can I Buy This?",
  previewText: (p: PurchaseSimulationEmailProps) =>
    `${p.itemName} — ${p.decision === "GO_AHEAD" ? "Go ahead" : "Wait"}`,
  purpose: "Email summary of purchase simulation.",
  uxReasoning: "Clear GO/WAIT badge mirrors in-app decision — no ambiguity.",
};

export function PurchaseSimulationEmail(props: PurchaseSimulationEmailProps) {
  const { firstName, itemName, amount, decision, explanation, suggestedWaitUntil, dashboardUrl, appUrl } = props;
  return (
    <EmailLayout preview={purchaseSimulationEmailMeta.previewText!(props)} appUrl={appUrl}>
      <Hero title="Can I Buy This?" description={`${greeting(firstName)}, here's our analysis.`} />
      <Section style={{ marginBottom: "16px" }}>
        <Text style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 600 }}>{itemName}</Text>
        <Text style={{ margin: "0 0 16px", fontSize: "16px", color: "#64748B" }}>{formatPKR(amount)}</Text>
        <Badge variant={decision === "GO_AHEAD" ? "success" : "warning"}>
          {decision === "GO_AHEAD" ? "GO AHEAD" : "WAIT"}
        </Badge>
      </Section>
      <InfoBox title="Why">{explanation}</InfoBox>
      {suggestedWaitUntil && (
        <Text style={{ fontSize: "14px", color: "#64748B" }}>
          Suggested wait until: {suggestedWaitUntil}
        </Text>
      )}
      <Button href={dashboardUrl}>Open Dashboard</Button>
    </EmailLayout>
  );
}

export const purchaseSimulationEmail: EmailTemplate<PurchaseSimulationEmailProps> = {
  meta: purchaseSimulationEmailMeta,
  Component: PurchaseSimulationEmail,
  exampleProps: {
    firstName: "Aadil",
    itemName: "iPhone 16",
    amount: 350000,
    decision: "WAIT",
    explanation: "This purchase would delay your emergency fund by 45 days.",
    suggestedWaitUntil: "August 2026",
    dashboardUrl: "https://nexa.app/can-i-buy",
  },
  toPlainText: (p) =>
    alertPlain(`${p.itemName}: ${p.decision}`, p.explanation, p.dashboardUrl),
};

export interface HighSpendingAlertProps extends AlertBase {
  category: string;
  amount: number;
  percentOverAverage: number;
}

export const highSpendingAlertMeta = {
  subject: (p: HighSpendingAlertProps) => `High spending in ${p.category}`,
  previewText: "Your spending in this category is above your usual pattern.",
  purpose: "Alert on unusual category spending.",
  uxReasoning: "Specific category + percentage gives context without panic.",
};

export function HighSpendingAlert(props: HighSpendingAlertProps) {
  return (
    <EmailLayout preview={highSpendingAlertMeta.previewText as string} appUrl={props.appUrl}>
      <Hero title="Spending alert" description={`${greeting(props.firstName)}, ${props.category} is ${props.percentOverAverage}% above your average.`} />
      <WarningBox title={props.category}>
        {formatPKR(props.amount)} spent this cycle — review if this aligns with your plan.
      </WarningBox>
      <Button href={props.dashboardUrl}>Review Spending</Button>
    </EmailLayout>
  );
}

export const highSpendingAlert: EmailTemplate<HighSpendingAlertProps> = {
  meta: highSpendingAlertMeta,
  Component: HighSpendingAlert,
  exampleProps: {
    firstName: "Aadil",
    category: "Food & Dining",
    amount: 28000,
    percentOverAverage: 35,
    dashboardUrl: "https://nexa.app/dashboard",
  },
  toPlainText: (p) => alertPlain("High spending alert", `${p.category}: ${formatPKR(p.amount)}`, p.dashboardUrl),
};

export interface GoalDelayAlertProps extends AlertBase {
  goalName: string;
  delayDays: number;
}

export const goalDelayAlertMeta = {
  subject: (p: GoalDelayAlertProps) => `${p.goalName} may be delayed`,
  previewText: "A goal needs your attention.",
  purpose: "Proactive goal delay warning.",
  uxReasoning: "Early warning allows course correction before failure.",
};

export function GoalDelayAlert(props: GoalDelayAlertProps) {
  return (
    <EmailLayout preview={goalDelayAlertMeta.previewText as string} appUrl={props.appUrl}>
      <Hero title="Goal delay warning" description={`"${props.goalName}" may slip by ${props.delayDays} days.`} />
      <Button href={props.dashboardUrl}>Review Goal</Button>
    </EmailLayout>
  );
}

export const goalDelayAlert: EmailTemplate<GoalDelayAlertProps> = {
  meta: goalDelayAlertMeta,
  Component: GoalDelayAlert,
  exampleProps: { firstName: "Aadil", goalName: "Emergency Fund", delayDays: 21, dashboardUrl: "https://nexa.app/dashboard" },
  toPlainText: (p) => alertPlain("Goal delay", p.goalName, p.dashboardUrl),
};

export interface IncomeDropAlertProps extends AlertBase {
  expectedIncome: number;
  actualIncome: number;
  percentDrop: number;
}

export const incomeDropAlertMeta = {
  subject: "Income below expected",
  previewText: "Your income this cycle is lower than planned.",
  purpose: "Alert when income falls below expectations.",
  uxReasoning: "Compare expected vs actual — helps freelancers and variable earners.",
};

export function IncomeDropAlert(props: IncomeDropAlertProps) {
  return (
    <EmailLayout preview={incomeDropAlertMeta.previewText as string} appUrl={props.appUrl}>
      <Hero title="Income alert" description={`Income is ${props.percentDrop}% below your expectation.`} />
      <WarningBox title="Expected vs actual">
        Expected {formatPKR(props.expectedIncome)} · Received {formatPKR(props.actualIncome)}
      </WarningBox>
      <Button href={props.dashboardUrl}>Review Finances</Button>
    </EmailLayout>
  );
}

export const incomeDropAlert: EmailTemplate<IncomeDropAlertProps> = {
  meta: incomeDropAlertMeta,
  Component: IncomeDropAlert,
  exampleProps: {
    firstName: "Aadil",
    expectedIncome: 120000,
    actualIncome: 85000,
    percentDrop: 29,
    dashboardUrl: "https://nexa.app/dashboard",
  },
  toPlainText: (p) => alertPlain("Income drop", `Expected ${formatPKR(p.expectedIncome)}`, p.dashboardUrl),
};

export interface LowEmergencyFundAlertProps extends AlertBase {
  currentAmount: number;
  targetAmount: number;
  monthsCovered: number;
}

export const lowEmergencyFundAlertMeta = {
  subject: "Emergency fund needs attention",
  previewText: "Your emergency fund is below the recommended level.",
  purpose: "Alert when emergency fund is insufficient.",
  uxReasoning: "Months covered metric is more meaningful than raw percentage.",
};

export function LowEmergencyFundAlert(props: LowEmergencyFundAlertProps) {
  return (
    <EmailLayout preview={lowEmergencyFundAlertMeta.previewText as string} appUrl={props.appUrl}>
      <Hero title="Emergency fund alert" description={`${props.monthsCovered.toFixed(1)} months of expenses covered.`} />
      <WarningBox title="Current status">
        {formatPKR(props.currentAmount)} of {formatPKR(props.targetAmount)} target.
      </WarningBox>
      <Button href={props.dashboardUrl}>View Emergency Fund</Button>
    </EmailLayout>
  );
}

export const lowEmergencyFundAlert: EmailTemplate<LowEmergencyFundAlertProps> = {
  meta: lowEmergencyFundAlertMeta,
  Component: LowEmergencyFundAlert,
  exampleProps: {
    firstName: "Aadil",
    currentAmount: 80000,
    targetAmount: 300000,
    monthsCovered: 1.2,
    dashboardUrl: "https://nexa.app/dashboard",
  },
  toPlainText: (p) => alertPlain("Low emergency fund", `${p.monthsCovered} months covered`, p.dashboardUrl),
};

export interface BudgetTrendAlertProps extends AlertBase {
  trend: "increasing" | "decreasing" | "stable";
  summary: string;
}

export const budgetTrendAlertMeta = {
  subject: "Spending trend update",
  previewText: "How your spending pattern is changing.",
  purpose: "Notify on spending trend shifts.",
  uxReasoning: "Trend direction + summary keeps it informational, not punitive.",
};

export function BudgetTrendAlert(props: BudgetTrendAlertProps) {
  return (
    <EmailLayout preview={budgetTrendAlertMeta.previewText as string} appUrl={props.appUrl}>
      <Hero title="Spending trend" description={props.summary} />
      <Badge variant={props.trend === "increasing" ? "warning" : props.trend === "decreasing" ? "success" : "default"}>
        {props.trend.charAt(0).toUpperCase() + props.trend.slice(1)}
      </Badge>
      <Section style={{ marginTop: "24px" }}>
        <Button href={props.dashboardUrl}>View Dashboard</Button>
      </Section>
    </EmailLayout>
  );
}

export const budgetTrendAlert: EmailTemplate<BudgetTrendAlertProps> = {
  meta: budgetTrendAlertMeta,
  Component: BudgetTrendAlert,
  exampleProps: {
    firstName: "Aadil",
    trend: "increasing",
    summary: "Variable spending is up 12% compared to your 3-month average.",
    dashboardUrl: "https://nexa.app/dashboard",
  },
  toPlainText: (p) => alertPlain("Budget trend", p.summary, p.dashboardUrl),
};

export interface CharitySummaryEmailProps extends AlertBase {
  periodLabel: string;
  amount: number;
  transactionCount: number;
}

export const charitySummaryEmailMeta = {
  subject: (p: CharitySummaryEmailProps) => `Charity summary — ${p.periodLabel}`,
  previewText: "Your giving this period.",
  purpose: "Charity/donation tracking summary.",
  uxReasoning: "Positive framing for charitable giving — no judgment, just clarity.",
};

export function CharitySummaryEmail(props: CharitySummaryEmailProps) {
  return (
    <EmailLayout preview={charitySummaryEmailMeta.previewText as string} appUrl={props.appUrl}>
      <Hero title="Charity summary" description={`${props.periodLabel} giving overview.`} />
      <Section style={{ textAlign: "center", marginBottom: "24px" }}>
        <Text style={{ margin: 0, fontSize: "32px", fontWeight: 700, color: "#16A34A" }}>
          {formatPKR(props.amount)}
        </Text>
        <Text style={{ margin: "8px 0 0", color: "#64748B" }}>
          across {props.transactionCount} donation{props.transactionCount !== 1 ? "s" : ""}
        </Text>
      </Section>
      <Button href={props.dashboardUrl}>View Dashboard</Button>
    </EmailLayout>
  );
}

export const charitySummaryEmail: EmailTemplate<CharitySummaryEmailProps> = {
  meta: charitySummaryEmailMeta,
  Component: CharitySummaryEmail,
  exampleProps: {
    firstName: "Aadil",
    periodLabel: "March 2026",
    amount: 15000,
    transactionCount: 3,
    dashboardUrl: "https://nexa.app/dashboard",
  },
  toPlainText: (p) =>
    alertPlain(`Charity: ${formatPKR(p.amount)}`, p.periodLabel, p.dashboardUrl),
};

export interface MonthlyCharityEmailProps extends AlertBase {
  monthLabel: string;
  amount: number;
  yearToDate: number;
}

export const monthlyCharityEmailMeta = {
  subject: (p: MonthlyCharityEmailProps) => `Your ${p.monthLabel} charity giving`,
  previewText: "Monthly charity summary.",
  purpose: "Monthly charity rollup with YTD context.",
  uxReasoning: "YTD figure helps users see cumulative impact of giving.",
};

export function MonthlyCharityEmail(props: MonthlyCharityEmailProps) {
  return (
    <EmailLayout preview={monthlyCharityEmailMeta.previewText as string} appUrl={props.appUrl}>
      <Hero title="Monthly charity" description={`${props.monthLabel} giving summary.`} />
      <Section style={{ textAlign: "center", marginBottom: "16px" }}>
        <Text style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#16A34A" }}>
          {formatPKR(props.amount)}
        </Text>
        <Text style={{ margin: "8px 0 0", color: "#64748B" }}>
          Year to date: {formatPKR(props.yearToDate)}
        </Text>
      </Section>
      <Button href={props.dashboardUrl}>View Dashboard</Button>
    </EmailLayout>
  );
}

export const monthlyCharityEmail: EmailTemplate<MonthlyCharityEmailProps> = {
  meta: monthlyCharityEmailMeta,
  Component: MonthlyCharityEmail,
  exampleProps: {
    firstName: "Aadil",
    monthLabel: "March 2026",
    amount: 5000,
    yearToDate: 15000,
    dashboardUrl: "https://nexa.app/dashboard",
  },
  toPlainText: (p) =>
    alertPlain(`Charity ${p.monthLabel}`, formatPKR(p.amount), p.dashboardUrl),
};
