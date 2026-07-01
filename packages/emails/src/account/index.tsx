import { Link, Section, Text } from "@react-email/components";
import { Button, Hero, InfoBox, WarningBox } from "../components";
import { EmailLayout } from "../layouts/email-layout";
import type { EmailTemplate } from "../types";
import { greeting } from "../shared/render-helpers";
import { plainTextLines } from "../utils/plain-text";
import { brand } from "../theme";
import { formatDate } from "../utils/format";

type AccountBase = {
  firstName?: string | null;
  appUrl?: string;
};

export interface EmailChangedProps extends AccountBase {
  oldEmail: string;
  newEmail: string;
  changedAt?: Date | string;
}

export const emailChangedMeta = {
  subject: "Your Nexa email was changed",
  previewText: "Your account email address was updated.",
  purpose: "Security notification for email change.",
  uxReasoning: "Show both old and new email for verification.",
};

export function EmailChangedEmail(props: EmailChangedProps) {
  return (
    <EmailLayout preview={emailChangedMeta.previewText} appUrl={props.appUrl}>
      <Hero title="Email updated" description={`${greeting(props.firstName)}, your account email was changed.`} />
      <InfoBox title="Details">
        From {props.oldEmail} to {props.newEmail}
        {props.changedAt ? ` on ${formatDate(props.changedAt)}` : ""}.
      </InfoBox>
      <WarningBox title="Wasn't you?">
        <Link href={`mailto:${brand.supportEmail}`} style={{ color: "#92400E" }}>
          Contact support
        </Link>{" "}
        immediately.
      </WarningBox>
    </EmailLayout>
  );
}

export const emailChangedEmail: EmailTemplate<EmailChangedProps> = {
  meta: emailChangedMeta,
  Component: EmailChangedEmail,
  exampleProps: {
    firstName: "Aadil",
    oldEmail: "old@example.com",
    newEmail: "new@example.com",
  },
  toPlainText: (p) =>
    plainTextLines([
      "Email changed",
      `${p.oldEmail} → ${p.newEmail}`,
    ]),
};

export interface AccountDeletedEmailProps extends AccountBase {
  scheduledFor: Date | string;
  graceDays: number;
}

export const accountDeletedEmailMeta = {
  subject: "Account deletion scheduled",
  previewText: "Your Nexa account is scheduled for deletion.",
  purpose: "Confirm account deletion request with grace period.",
  uxReasoning: "Grace period + cancel path reduces accidental deletion regret.",
};

export function AccountDeletedEmail(props: AccountDeletedEmailProps) {
  return (
    <EmailLayout preview={accountDeletedEmailMeta.previewText} appUrl={props.appUrl}>
      <Hero
        title="Deletion scheduled"
        description={`${greeting(props.firstName)}, your account will be permanently deleted on ${formatDate(props.scheduledFor)}.`}
      />
      <WarningBox title={`${props.graceDays}-day grace period`}>
        You can cancel this request anytime before the deletion date from Profile → Data & privacy.
      </WarningBox>
      <Button href={`${props.appUrl ?? "https://nexa.app"}/profile/data`}>Cancel Deletion</Button>
    </EmailLayout>
  );
}

export const accountDeletedEmail: EmailTemplate<AccountDeletedEmailProps> = {
  meta: accountDeletedEmailMeta,
  Component: AccountDeletedEmail,
  exampleProps: {
    firstName: "Aadil",
    scheduledFor: new Date(Date.now() + 30 * 86400000),
    graceDays: 30,
  },
  toPlainText: (p) =>
    plainTextLines([
      "Account deletion scheduled",
      `Deletion date: ${formatDate(p.scheduledFor)}`,
    ]),
};

export interface ExportReadyEmailProps extends AccountBase {
  downloadUrl: string;
  format: "json" | "csv";
  expiresAt?: Date | string;
}

export const exportReadyEmailMeta = {
  subject: "Your Nexa data export is ready",
  previewText: "Download your financial data export.",
  purpose: "Notify when data export is ready.",
  uxReasoning: "Time-limited download link protects sensitive data.",
};

export function ExportReadyEmail(props: ExportReadyEmailProps) {
  return (
    <EmailLayout preview={exportReadyEmailMeta.previewText} appUrl={props.appUrl}>
      <Hero title="Export ready" description={`${greeting(props.firstName)}, your ${props.format.toUpperCase()} export is ready.`} />
      {props.expiresAt && (
        <InfoBox title="Download expires">
          Link valid until {formatDate(props.expiresAt)}.
        </InfoBox>
      )}
      <Button href={props.downloadUrl}>Download Export</Button>
    </EmailLayout>
  );
}

export const exportReadyEmail: EmailTemplate<ExportReadyEmailProps> = {
  meta: exportReadyEmailMeta,
  Component: ExportReadyEmail,
  exampleProps: {
    firstName: "Aadil",
    downloadUrl: "https://nexa.app/profile/data",
    format: "json",
  },
  toPlainText: (p) => plainTextLines(["Export ready", p.downloadUrl]),
};

export interface PrivacyUpdatedEmailProps extends AccountBase {
  policyUrl: string;
  summary: string;
}

export const privacyUpdatedEmailMeta = {
  subject: "Nexa privacy policy updated",
  previewText: "We've updated our privacy policy.",
  purpose: "Notify users of privacy policy changes.",
  uxReasoning: "Summary + link respects user time while meeting transparency obligations.",
};

export function PrivacyUpdatedEmail(props: PrivacyUpdatedEmailProps) {
  return (
    <EmailLayout preview={privacyUpdatedEmailMeta.previewText} appUrl={props.appUrl}>
      <Hero title="Privacy policy update" description={props.summary} />
      <Button href={props.policyUrl}>Read Privacy Policy</Button>
    </EmailLayout>
  );
}

export const privacyUpdatedEmail: EmailTemplate<PrivacyUpdatedEmailProps> = {
  meta: privacyUpdatedEmailMeta,
  Component: PrivacyUpdatedEmail,
  exampleProps: {
    firstName: "Aadil",
    policyUrl: "https://nexa.app/privacy",
    summary: "We've clarified how we encrypt and store your financial data.",
  },
  toPlainText: (p) => plainTextLines(["Privacy policy updated", p.policyUrl]),
};

export interface SecurityAlertEmailProps extends AccountBase {
  alertTitle: string;
  alertDescription: string;
  actionUrl?: string;
  actionLabel?: string;
}

export const securityAlertEmailMeta = {
  subject: (p: SecurityAlertEmailProps) => `Security alert: ${p.alertTitle}`,
  previewText: "Important security notice for your Nexa account.",
  purpose: "Generic security alert template.",
  uxReasoning: "Flexible template for various security events with optional CTA.",
};

export function SecurityAlertEmail(props: SecurityAlertEmailProps) {
  return (
    <EmailLayout preview={securityAlertEmailMeta.previewText as string} appUrl={props.appUrl}>
      <Hero title={props.alertTitle} description={props.alertDescription} />
      {props.actionUrl && props.actionLabel && (
        <Section style={{ marginTop: "24px" }}>
          <Button href={props.actionUrl}>{props.actionLabel}</Button>
        </Section>
      )}
      <WarningBox title="Need help?">
        Contact{" "}
        <Link href={`mailto:${brand.supportEmail}`} style={{ color: "#92400E" }}>
          {brand.supportEmail}
        </Link>
      </WarningBox>
    </EmailLayout>
  );
}

export const securityAlertEmail: EmailTemplate<SecurityAlertEmailProps> = {
  meta: securityAlertEmailMeta,
  Component: SecurityAlertEmail,
  exampleProps: {
    firstName: "Aadil",
    alertTitle: "Unusual activity detected",
    alertDescription: "We noticed multiple failed sign-in attempts on your account.",
    actionUrl: "https://nexa.app/profile/security",
    actionLabel: "Review Security",
  },
  toPlainText: (p) => plainTextLines([p.alertTitle, p.alertDescription]),
};
