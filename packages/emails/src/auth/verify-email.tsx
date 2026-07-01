import { Section, Text } from "@react-email/components";
import { Button, Hero, InfoBox, OtpBox } from "../components";
import { EmailLayout } from "../layouts/email-layout";
import type { EmailTemplate } from "../types";
import { greeting } from "../shared/render-helpers";
import { plainTextLines } from "../utils/plain-text";

export interface VerifyEmailProps {
  firstName?: string | null;
  verifyUrl: string;
  otpCode?: string;
  expiresInMinutes?: number;
  appUrl?: string;
}

export const verifyEmailMeta = {
  subject: "Verify your Nexa email",
  previewText: "Confirm your email to secure your account and start onboarding.",
  purpose: "Email verification for new accounts.",
  uxReasoning: "Dual path (button + OTP) supports all clients. Expiry creates urgency without pressure.",
  customizationNotes: "otpCode optional — use when sending code-based verification.",
};

export function VerifyEmail({
  firstName,
  verifyUrl,
  otpCode,
  expiresInMinutes = 60,
  appUrl = "https://nexa.app",
}: VerifyEmailProps) {
  return (
    <EmailLayout preview={verifyEmailMeta.previewText} appUrl={appUrl}>
      <Hero
        title="Verify your email"
        description={`${greeting(firstName)}, confirm your email address to secure your Nexa account.`}
      />
      <Section style={{ marginBottom: "24px", textAlign: "center" }}>
        <Button href={verifyUrl} ariaLabel="Verify email address">
          Verify Email
        </Button>
      </Section>
      {otpCode && <OtpBox code={otpCode} expiresInMinutes={expiresInMinutes} />}
      <InfoBox title="Link expires">
        This verification link expires in {expiresInMinutes} minutes. If you didn&apos;t create a
        Nexa account, you can safely ignore this email.
      </InfoBox>
    </EmailLayout>
  );
}

export function verifyEmailPlainText(props: VerifyEmailProps): string {
  return plainTextLines([
    `${greeting(props.firstName)}, verify your email:`,
    props.verifyUrl,
    props.otpCode ? `Or use code: ${props.otpCode}` : false,
    `Expires in ${props.expiresInMinutes ?? 60} minutes.`,
  ]);
}

export const verifyEmail: EmailTemplate<VerifyEmailProps> = {
  meta: verifyEmailMeta,
  Component: VerifyEmail,
  exampleProps: {
    firstName: "Aadil",
    verifyUrl: "https://nexa.app/verify?token=abc",
    otpCode: "482910",
  },
  toPlainText: verifyEmailPlainText,
};
