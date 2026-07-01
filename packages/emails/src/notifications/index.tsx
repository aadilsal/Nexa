import { Section } from "@react-email/components";
import { Button, Hero, InfoBox, WarningBox } from "../components";
import { EmailLayout } from "../layouts/email-layout";
import type { EmailTemplate } from "../types";
import { greeting } from "../shared/render-helpers";
import { plainTextLines } from "../utils/plain-text";
import { formatPKR } from "../utils/format";

type NotifBase = {
  firstName?: string | null;
  appUrl?: string;
  dashboardUrl: string;
};

export interface LogExpensesReminderProps extends NotifBase {}

export const logExpensesReminderMeta = {
  subject: "Log today's expenses",
  previewText: "A quick reminder to keep your ledger up to date.",
  purpose: "Daily expense logging nudge.",
  uxReasoning: "Short and actionable — respects user time.",
};

export function LogExpensesReminderEmail(props: LogExpensesReminderProps) {
  return (
    <EmailLayout preview={logExpensesReminderMeta.previewText} appUrl={props.appUrl}>
      <Hero
        title="Log your expenses"
        description={`${greeting(props.firstName)}, a quick log keeps Safe To Spend™ accurate.`}
      />
      <InfoBox title="Tip">Try natural language: "Petrol 7550" or "Lunch 850"</InfoBox>
      <Button href={props.dashboardUrl}>Log Expense</Button>
    </EmailLayout>
  );
}

export const logExpensesReminderEmail: EmailTemplate<LogExpensesReminderProps> = {
  meta: logExpensesReminderMeta,
  Component: LogExpensesReminderEmail,
  exampleProps: { firstName: "Aadil", dashboardUrl: "https://nexa.app/dashboard" },
  toPlainText: (p) => plainTextLines(["Log your expenses today", p.dashboardUrl]),
};

export interface WeeklyReminderProps extends NotifBase {}

export const weeklyReminderMeta = {
  subject: "Your weekly review is ready",
  previewText: "See how your week went financially.",
  purpose: "Drive weekly review engagement.",
  uxReasoning: "Ties to existing weekly review habit loop.",
};

export function WeeklyReminderEmail(props: WeeklyReminderProps) {
  return (
    <EmailLayout preview={weeklyReminderMeta.previewText} appUrl={props.appUrl}>
      <Hero title="Weekly review" description={`${greeting(props.firstName)}, your weekly summary is ready.`} />
      <Button href={`${props.dashboardUrl.replace("/dashboard", "/weekly-review")}`}>
        View Weekly Review
      </Button>
    </EmailLayout>
  );
}

export const weeklyReminderEmail: EmailTemplate<WeeklyReminderProps> = {
  meta: weeklyReminderMeta,
  Component: WeeklyReminderEmail,
  exampleProps: { firstName: "Aadil", dashboardUrl: "https://nexa.app/dashboard" },
  toPlainText: (p) => plainTextLines(["Weekly review ready", p.dashboardUrl]),
};

export interface InactiveUserReminderProps extends NotifBase {
  daysSinceLastVisit: number;
}

export const inactiveUserReminderMeta = {
  subject: "We miss you at Nexa",
  previewText: "Your financial dashboard is waiting.",
  purpose: "Re-engage inactive users.",
  uxReasoning: "Gentle tone, no guilt — focus on value waiting for them.",
};

export function InactiveUserReminderEmail(props: InactiveUserReminderProps) {
  return (
    <EmailLayout preview={inactiveUserReminderMeta.previewText} appUrl={props.appUrl}>
      <Hero
        title="Your finances are waiting"
        description={`${greeting(props.firstName)}, it's been ${props.daysSinceLastVisit} days since your last visit. Your Safe To Spend™ and goals are still here.`}
      />
      <Button href={props.dashboardUrl}>Open Dashboard</Button>
    </EmailLayout>
  );
}

export const inactiveUserReminderEmail: EmailTemplate<InactiveUserReminderProps> = {
  meta: inactiveUserReminderMeta,
  Component: InactiveUserReminderEmail,
  exampleProps: {
    firstName: "Aadil",
    daysSinceLastVisit: 14,
    dashboardUrl: "https://nexa.app/dashboard",
  },
  toPlainText: (p) => plainTextLines(["We miss you at Nexa", p.dashboardUrl]),
};

export interface AiInsightEmailProps extends NotifBase {
  insight: string;
  explanation: string;
  recommendation?: string;
}

export const aiInsightEmailMeta = {
  subject: (p: AiInsightEmailProps) => p.insight.slice(0, 60),
  previewText: (p: AiInsightEmailProps) => p.explanation.slice(0, 100),
  purpose: "Deliver AI-generated financial insights via email.",
  uxReasoning: "Insight as headline — curiosity drives open; explanation drives action.",
};

export function AiInsightEmail(props: AiInsightEmailProps) {
  return (
    <EmailLayout preview={aiInsightEmailMeta.previewText!(props)} appUrl={props.appUrl}>
      <Hero title="Financial insight" description={`"${props.insight}"`} />
      <InfoBox title="What this means">{props.explanation}</InfoBox>
      {props.recommendation && (
        <Section style={{ marginBottom: "24px" }}>
          <InfoBox title="Recommendation">{props.recommendation}</InfoBox>
        </Section>
      )}
      <Button href={props.dashboardUrl}>Open Dashboard</Button>
    </EmailLayout>
  );
}

export const aiInsightEmail: EmailTemplate<AiInsightEmailProps> = {
  meta: aiInsightEmailMeta,
  Component: AiInsightEmail,
  exampleProps: {
    firstName: "Aadil",
    insight: "You're spending less on dining this month",
    explanation: "Dining is down 18% compared to your 3-month average.",
    recommendation: "Consider redirecting the difference toward your emergency fund.",
    dashboardUrl: "https://nexa.app/dashboard",
  },
  toPlainText: (p) =>
    plainTextLines([p.insight, p.explanation, p.recommendation, p.dashboardUrl]),
};

export interface SomethingWrongEmailProps extends NotifBase {
  errorMessage: string;
  supportUrl?: string;
}

export const somethingWrongEmailMeta = {
  subject: "Something went wrong",
  previewText: "We encountered an issue processing your request.",
  purpose: "Generic error notification.",
  uxReasoning: "Acknowledge failure calmly with support path — no technical jargon.",
};

export function SomethingWrongEmail(props: SomethingWrongEmailProps) {
  return (
    <EmailLayout preview={somethingWrongEmailMeta.previewText} appUrl={props.appUrl}>
      <Hero title="Something went wrong" description={props.errorMessage} />
      <Button href={props.supportUrl ?? `mailto:support@nexa.app`}>Contact Support</Button>
    </EmailLayout>
  );
}

export const somethingWrongEmail: EmailTemplate<SomethingWrongEmailProps> = {
  meta: somethingWrongEmailMeta,
  Component: SomethingWrongEmail,
  exampleProps: {
    firstName: "Aadil",
    errorMessage: "We couldn't complete your last request. Please try again.",
    dashboardUrl: "https://nexa.app/dashboard",
  },
  toPlainText: (p) => plainTextLines(["Something went wrong", p.errorMessage]),
};

export interface PaymentFailedEmailProps extends NotifBase {
  amount?: number;
  retryUrl?: string;
}

export const paymentFailedEmailMeta = {
  subject: "Payment failed",
  previewText: "We couldn't process your payment.",
  purpose: "Future billing failure notification.",
  uxReasoning: "Reserved for future payments — clear retry path.",
};

export function PaymentFailedEmail(props: PaymentFailedEmailProps) {
  return (
    <EmailLayout preview={paymentFailedEmailMeta.previewText} appUrl={props.appUrl}>
      <Hero title="Payment failed" description={`${greeting(props.firstName)}, we couldn't process your payment.`} />
      {props.amount !== undefined && (
        <WarningBox title="Amount">{formatPKR(props.amount)}</WarningBox>
      )}
      {props.retryUrl && <Button href={props.retryUrl}>Update Payment</Button>}
    </EmailLayout>
  );
}

export const paymentFailedEmail: EmailTemplate<PaymentFailedEmailProps> = {
  meta: paymentFailedEmailMeta,
  Component: PaymentFailedEmail,
  exampleProps: {
    firstName: "Aadil",
    amount: 999,
    retryUrl: "https://nexa.app/billing",
    dashboardUrl: "https://nexa.app/dashboard",
  },
  toPlainText: (p) => plainTextLines(["Payment failed", p.retryUrl ?? ""]),
};

export interface ProcessingDelayedEmailProps extends NotifBase {
  operation: string;
}

export const processingDelayedEmailMeta = {
  subject: "Processing delayed",
  previewText: "Your request is taking longer than expected.",
  purpose: "Notify when async operation is delayed.",
  uxReasoning: "Set expectations — reduces support tickets from impatient users.",
};

export function ProcessingDelayedEmail(props: ProcessingDelayedEmailProps) {
  return (
    <EmailLayout preview={processingDelayedEmailMeta.previewText} appUrl={props.appUrl}>
      <Hero
        title="Processing delayed"
        description={`${greeting(props.firstName)}, your ${props.operation} is taking longer than usual. We'll notify you when it's complete.`}
      />
      <Button href={props.dashboardUrl}>Check Status</Button>
    </EmailLayout>
  );
}

export const processingDelayedEmail: EmailTemplate<ProcessingDelayedEmailProps> = {
  meta: processingDelayedEmailMeta,
  Component: ProcessingDelayedEmail,
  exampleProps: {
    firstName: "Aadil",
    operation: "data export",
    dashboardUrl: "https://nexa.app/profile/data",
  },
  toPlainText: (p) => plainTextLines(["Processing delayed", p.operation]),
};
