import { Section, Text } from "@react-email/components";
import { Button, GoalProgressCard, Hero, SuccessBox } from "../components";
import { EmailLayout } from "../layouts/email-layout";
import type { EmailTemplate } from "../types";
import { greeting } from "../shared/render-helpers";
import { plainTextLines } from "../utils/plain-text";
import { formatPKR, formatDate } from "../utils/format";

type GoalEmailBase = {
  firstName?: string | null;
  goalName: string;
  targetAmount: number;
  targetDate?: string;
  dashboardUrl: string;
  appUrl?: string;
};

function goalPlainText(title: string, p: GoalEmailBase, extra?: string): string {
  return plainTextLines([
    title,
    `Goal: ${p.goalName}`,
    `Target: ${formatPKR(p.targetAmount)}`,
    extra,
    p.dashboardUrl,
  ]);
}

export interface GoalCreatedEmailProps extends GoalEmailBase {}

export const goalCreatedEmailMeta = {
  subject: (p: GoalCreatedEmailProps) => `Goal created: ${p.goalName}`,
  previewText: "Your new financial goal is being tracked.",
  purpose: "Confirm goal creation.",
  uxReasoning: "Immediate confirmation reinforces commitment without overselling.",
};

export function GoalCreatedEmail(props: GoalCreatedEmailProps) {
  const { firstName, goalName, targetAmount, targetDate, dashboardUrl, appUrl } = props;
  return (
    <EmailLayout preview={goalCreatedEmailMeta.previewText as string} appUrl={appUrl}>
      <Hero title="Goal created" description={`${greeting(firstName)}, "${goalName}" is now being tracked.`} />
      <Section style={{ marginBottom: "24px" }}>
        <Text style={{ margin: 0, fontSize: "15px", color: "#475569" }}>
          Target: {formatPKR(targetAmount)}
          {targetDate ? ` by ${formatDate(targetDate)}` : ""}
        </Text>
      </Section>
      <Button href={dashboardUrl}>View Goal</Button>
    </EmailLayout>
  );
}

export const goalCreatedEmail: EmailTemplate<GoalCreatedEmailProps> = {
  meta: goalCreatedEmailMeta,
  Component: GoalCreatedEmail,
  exampleProps: {
    firstName: "Aadil",
    goalName: "Emergency Fund",
    targetAmount: 300000,
    targetDate: "2026-12-31",
    dashboardUrl: "https://nexa.app/dashboard",
  },
  toPlainText: (p) => goalPlainText("Goal created", p),
};

export interface GoalUpdatedEmailProps extends GoalEmailBase {
  changeDescription: string;
}

export const goalUpdatedEmailMeta = {
  subject: (p: GoalUpdatedEmailProps) => `${p.goalName} updated`,
  previewText: "Your goal details were changed.",
  purpose: "Notify on goal edits.",
  uxReasoning: "Audit trail for financial goal changes builds trust.",
};

export function GoalUpdatedEmail(props: GoalUpdatedEmailProps) {
  const { firstName, goalName, changeDescription, dashboardUrl, appUrl } = props;
  return (
    <EmailLayout preview={goalUpdatedEmailMeta.previewText as string} appUrl={appUrl}>
      <Hero title="Goal updated" description={`${greeting(firstName)}, "${goalName}" was updated.`} />
      <Text style={{ fontSize: "15px", color: "#475569", marginBottom: "24px" }}>{changeDescription}</Text>
      <Button href={dashboardUrl}>View Goal</Button>
    </EmailLayout>
  );
}

export const goalUpdatedEmail: EmailTemplate<GoalUpdatedEmailProps> = {
  meta: goalUpdatedEmailMeta,
  Component: GoalUpdatedEmail,
  exampleProps: {
    firstName: "Aadil",
    goalName: "Emergency Fund",
    targetAmount: 350000,
    changeDescription: "Target amount increased from PKR 300,000 to PKR 350,000.",
    dashboardUrl: "https://nexa.app/dashboard",
  },
  toPlainText: (p) => goalPlainText(`Goal updated: ${p.changeDescription}`, p),
};

export interface GoalAchievedEmailProps extends GoalEmailBase {
  currentAmount: number;
}

export const goalAchievedEmailMeta = {
  subject: (p: GoalAchievedEmailProps) => `Goal achieved: ${p.goalName}`,
  previewText: "Congratulations — you reached your goal.",
  purpose: "Celebrate goal completion.",
  uxReasoning: "Positive milestone reinforces healthy financial behavior.",
};

export function GoalAchievedEmail(props: GoalAchievedEmailProps) {
  const { firstName, goalName, currentAmount, dashboardUrl, appUrl } = props;
  return (
    <EmailLayout preview={goalAchievedEmailMeta.previewText as string} appUrl={appUrl}>
      <Hero title="Goal achieved" description={`${greeting(firstName)}, you reached "${goalName}".`} />
      <SuccessBox title="Congratulations">
        You saved {formatPKR(currentAmount)}. Well done — consistency pays off.
      </SuccessBox>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button href={dashboardUrl}>View Dashboard</Button>
      </Section>
    </EmailLayout>
  );
}

export const goalAchievedEmail: EmailTemplate<GoalAchievedEmailProps> = {
  meta: goalAchievedEmailMeta,
  Component: GoalAchievedEmail,
  exampleProps: {
    firstName: "Aadil",
    goalName: "New Laptop",
    targetAmount: 250000,
    currentAmount: 250000,
    dashboardUrl: "https://nexa.app/dashboard",
  },
  toPlainText: (p) => goalPlainText("Goal achieved!", p),
};

export interface GoalBehindScheduleEmailProps extends GoalEmailBase {
  progress: number;
  delayDays: number;
}

export const goalBehindScheduleEmailMeta = {
  subject: (p: GoalBehindScheduleEmailProps) => `${p.goalName} is behind schedule`,
  previewText: "Your goal needs attention — here's what to know.",
  purpose: "Alert when goal ETA slips.",
  uxReasoning: "Calm warning with actionable context, not alarmist tone.",
};

export function GoalBehindScheduleEmail(props: GoalBehindScheduleEmailProps) {
  const { firstName, goalName, progress, delayDays, dashboardUrl, appUrl } = props;
  return (
    <EmailLayout preview={goalBehindScheduleEmailMeta.previewText as string} appUrl={appUrl}>
      <Hero
        title="Goal behind schedule"
        description={`${greeting(firstName)}, "${goalName}" is about ${delayDays} days behind your target.`}
      />
      <GoalProgressCard
        goalName={goalName}
        progress={progress}
        targetAmount={props.targetAmount}
        currentAmount={(progress / 100) * props.targetAmount}
        onTrack={false}
      />
      <Button href={dashboardUrl}>Review Goal</Button>
    </EmailLayout>
  );
}

export const goalBehindScheduleEmail: EmailTemplate<GoalBehindScheduleEmailProps> = {
  meta: goalBehindScheduleEmailMeta,
  Component: GoalBehindScheduleEmail,
  exampleProps: {
    firstName: "Aadil",
    goalName: "Emergency Fund",
    targetAmount: 300000,
    progress: 32,
    delayDays: 14,
    dashboardUrl: "https://nexa.app/dashboard",
  },
  toPlainText: (p) => goalPlainText(`Behind by ${p.delayDays} days`, p),
};

export interface GoalReminderEmailProps extends GoalEmailBase {
  progress: number;
  daysRemaining: number;
}

export const goalReminderEmailMeta = {
  subject: (p: GoalReminderEmailProps) => `Reminder: ${p.goalName}`,
  previewText: "A gentle nudge on your financial goal.",
  purpose: "Periodic goal progress reminder.",
  uxReasoning: "Soft reminder with progress context, not guilt-driven.",
};

export function GoalReminderEmail(props: GoalReminderEmailProps) {
  const { firstName, goalName, progress, daysRemaining, dashboardUrl, appUrl } = props;
  return (
    <EmailLayout preview={goalReminderEmailMeta.previewText as string} appUrl={appUrl}>
      <Hero
        title="Goal reminder"
        description={`${greeting(firstName)}, ${daysRemaining} days left for "${goalName}".`}
      />
      <GoalProgressCard
        goalName={goalName}
        progress={progress}
        targetAmount={props.targetAmount}
        currentAmount={(progress / 100) * props.targetAmount}
      />
      <Button href={dashboardUrl}>View Progress</Button>
    </EmailLayout>
  );
}

export const goalReminderEmail: EmailTemplate<GoalReminderEmailProps> = {
  meta: goalReminderEmailMeta,
  Component: GoalReminderEmail,
  exampleProps: {
    firstName: "Aadil",
    goalName: "Emergency Fund",
    targetAmount: 300000,
    progress: 45,
    daysRemaining: 90,
    dashboardUrl: "https://nexa.app/dashboard",
  },
  toPlainText: (p) => goalPlainText(`Reminder: ${p.daysRemaining} days left`, p),
};
