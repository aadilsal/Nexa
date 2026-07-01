import { Link, Section } from "@react-email/components";
import { Hero, SuccessBox } from "../components";
import { EmailLayout } from "../layouts/email-layout";
import type { EmailTemplate } from "../types";
import { greeting } from "../shared/render-helpers";
import { plainTextLines } from "../utils/plain-text";
import { brand } from "../theme";
import { formatDate, formatTime } from "../utils/format";

export interface PasswordChangedEmailProps {
  firstName?: string | null;
  changedAt?: Date | string;
  appUrl?: string;
}

export const passwordChangedEmailMeta = {
  subject: "Your Nexa password was changed",
  previewText: "Your password was updated successfully.",
  purpose: "Confirm password change for security awareness.",
  uxReasoning: "Immediate notification lets users detect unauthorized changes.",
};

export function PasswordChangedEmail({
  firstName,
  changedAt = new Date(),
  appUrl = "https://nexa.app",
}: PasswordChangedEmailProps) {
  return (
    <EmailLayout preview={passwordChangedEmailMeta.previewText} appUrl={appUrl}>
      <Hero
        title="Password updated"
        description={`${greeting(firstName)}, your Nexa password was changed successfully.`}
      />
      <SuccessBox title="Confirmed">
        Changed on {formatDate(changedAt)} at {formatTime(changedAt)}. All other sessions have
        been signed out.
      </SuccessBox>
      <Section>
        <SuccessBox title="Wasn't you?">
          If you didn&apos;t make this change,{" "}
          <Link href={`mailto:${brand.supportEmail}`} style={{ color: "#166534" }}>
            contact support immediately
          </Link>
          .
        </SuccessBox>
      </Section>
    </EmailLayout>
  );
}

export function passwordChangedEmailPlainText(props: PasswordChangedEmailProps): string {
  return plainTextLines([
    `${greeting(props.firstName)}, your password was changed.`,
    "If this wasn't you, contact support immediately.",
  ]);
}

export const passwordChangedEmail: EmailTemplate<PasswordChangedEmailProps> = {
  meta: passwordChangedEmailMeta,
  Component: PasswordChangedEmail,
  exampleProps: { firstName: "Aadil" },
  toPlainText: passwordChangedEmailPlainText,
};
