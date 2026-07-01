import { Section, Text } from "@react-email/components";
import { Button, DataTable, Hero, WarningBox } from "../components";
import { EmailLayout } from "../layouts/email-layout";
import type { EmailTemplate } from "../types";
import { greeting } from "../shared/render-helpers";
import { plainTextLines } from "../utils/plain-text";
import { formatDate, formatTime } from "../utils/format";

export interface MagicLinkEmailProps {
  email: string;
  magicLinkUrl: string;
  expiresInMinutes?: number;
  ipAddress?: string;
  device?: string;
  appUrl?: string;
}

export const magicLinkEmailMeta = {
  subject: "Sign in to Nexa",
  previewText: "Your secure sign-in link — expires in 5 minutes.",
  purpose: "Passwordless authentication via magic link.",
  uxReasoning: "Security context (IP/device) builds trust. Short expiry reduces risk.",
};

export function MagicLinkEmail({
  email,
  magicLinkUrl,
  expiresInMinutes = 5,
  ipAddress = "Unknown",
  device = "Unknown device",
  appUrl = "https://nexa.app",
}: MagicLinkEmailProps) {
  return (
    <EmailLayout preview={magicLinkEmailMeta.previewText} appUrl={appUrl}>
      <Hero
        title="Your sign-in link"
        description="Click below to sign in to Nexa. This link works once and expires shortly."
      />
      <Section style={{ marginBottom: "24px", textAlign: "center" }}>
        <Button href={magicLinkUrl} ariaLabel="Sign in to Nexa">
          Sign in to Nexa
        </Button>
      </Section>
      <DataTable
        rows={[
          { label: "Email", value: email },
          { label: "Expires", value: `${expiresInMinutes} minutes` },
          { label: "Device", value: device },
          { label: "IP address", value: ipAddress },
          { label: "Requested", value: `${formatDate(new Date())} at ${formatTime(new Date())}` },
        ]}
      />
      <WarningBox title="Didn't request this?">
        If you didn&apos;t try to sign in, ignore this email. Your account remains secure.
      </WarningBox>
    </EmailLayout>
  );
}

export function magicLinkEmailPlainText(props: MagicLinkEmailProps): string {
  return plainTextLines([
    "Sign in to Nexa:",
    props.magicLinkUrl,
    `Expires in ${props.expiresInMinutes ?? 5} minutes.`,
    `Device: ${props.device ?? "Unknown"}`,
  ]);
}

export const magicLinkEmail: EmailTemplate<MagicLinkEmailProps> = {
  meta: magicLinkEmailMeta,
  Component: MagicLinkEmail,
  exampleProps: {
    email: "you@example.com",
    magicLinkUrl: "https://nexa.app/auth/magic?token=xyz",
    ipAddress: "192.168.1.1",
    device: "Chrome on Windows",
  },
  toPlainText: magicLinkEmailPlainText,
};
