import { Link, Section } from "@react-email/components";
import { Button, Hero, WarningBox } from "../components";
import { EmailLayout } from "../layouts/email-layout";
import type { EmailTemplate } from "../types";
import { greeting } from "../shared/render-helpers";
import { plainTextLines } from "../utils/plain-text";
import { brand } from "../theme";

export interface PasswordResetEmailProps {
  firstName?: string | null;
  resetUrl: string;
  expiresInMinutes?: number;
  appUrl?: string;
}

export const passwordResetEmailMeta = {
  subject: "Reset your Nexa password",
  previewText: "Reset your password. All other sessions will be signed out.",
  purpose: "Password reset flow initiation.",
  uxReasoning: "Clear security warning about session revocation prevents confusion after reset.",
};

export function PasswordResetEmail({
  firstName,
  resetUrl,
  expiresInMinutes = 60,
  appUrl = "https://nexa.app",
}: PasswordResetEmailProps) {
  return (
    <EmailLayout preview={passwordResetEmailMeta.previewText} appUrl={appUrl}>
      <Hero
        title="Reset your password"
        description={`${greeting(firstName)}, we received a request to reset your password.`}
      />
      <Section style={{ marginBottom: "24px", textAlign: "center" }}>
        <Button href={resetUrl} ariaLabel="Reset password">
          Reset Password
        </Button>
      </Section>
      <WarningBox title="Security notice">
        This link expires in {expiresInMinutes} minutes. After resetting, all other active sessions
        will be signed out. If you didn&apos;t request this,{" "}
        <Link href={`mailto:${brand.supportEmail}`} style={{ color: "#92400E" }}>
          contact support
        </Link>
        .
      </WarningBox>
    </EmailLayout>
  );
}

export function passwordResetEmailPlainText(props: PasswordResetEmailProps): string {
  return plainTextLines([
    `${greeting(props.firstName)}, reset your password:`,
    props.resetUrl,
    "All other sessions will be signed out after reset.",
  ]);
}

export const passwordResetEmail: EmailTemplate<PasswordResetEmailProps> = {
  meta: passwordResetEmailMeta,
  Component: PasswordResetEmail,
  exampleProps: {
    firstName: "Aadil",
    resetUrl: "https://nexa.app/reset-password?token=abc",
  },
  toPlainText: passwordResetEmailPlainText,
};
