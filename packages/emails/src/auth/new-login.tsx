import { Link, Section } from "@react-email/components";
import { DataTable, Hero, WarningBox } from "../components";
import { EmailLayout } from "../layouts/email-layout";
import type { EmailTemplate } from "../types";
import { greeting } from "../shared/render-helpers";
import { plainTextLines } from "../utils/plain-text";
import { brand } from "../theme";
import { formatDate, formatTime } from "../utils/format";

export interface NewLoginEmailProps {
  firstName?: string | null;
  device: string;
  browser: string;
  location?: string;
  ipAddress?: string;
  loginAt?: Date | string;
  appUrl?: string;
}

export const newLoginEmailMeta = {
  subject: "New sign-in to your Nexa account",
  previewText: "We noticed a new sign-in to your account.",
  purpose: "Security alert for new device/session login.",
  uxReasoning: "Device and location context helps users verify legitimate access quickly.",
};

export function NewLoginEmail({
  firstName,
  device,
  browser,
  location = "Unknown location",
  ipAddress = "Unknown",
  loginAt = new Date(),
  appUrl = "https://nexa.app",
}: NewLoginEmailProps) {
  return (
    <EmailLayout preview={newLoginEmailMeta.previewText} appUrl={appUrl}>
      <Hero
        title="New sign-in detected"
        description={`${greeting(firstName)}, your Nexa account was just accessed.`}
      />
      <DataTable
        rows={[
          { label: "Device", value: device, highlight: true },
          { label: "Browser", value: browser },
          { label: "Location", value: location },
          { label: "IP address", value: ipAddress },
          { label: "Time", value: `${formatDate(loginAt)} at ${formatTime(loginAt)}` },
        ]}
      />
      <WarningBox title="Wasn't you?">
        If you don&apos;t recognize this activity,{" "}
        <Link href={`mailto:${brand.supportEmail}`} style={{ color: "#92400E" }}>
          contact support
        </Link>{" "}
        and reset your password immediately.
      </WarningBox>
    </EmailLayout>
  );
}

export function newLoginEmailPlainText(props: NewLoginEmailProps): string {
  return plainTextLines([
    `${greeting(props.firstName)}, new sign-in detected.`,
    `Device: ${props.device}`,
    `Browser: ${props.browser}`,
    `Location: ${props.location ?? "Unknown"}`,
  ]);
}

export const newLoginEmail: EmailTemplate<NewLoginEmailProps> = {
  meta: newLoginEmailMeta,
  Component: NewLoginEmail,
  exampleProps: {
    firstName: "Aadil",
    device: "Windows PC",
    browser: "Chrome 120",
    location: "Karachi, PK",
    ipAddress: "103.x.x.x",
  },
  toPlainText: newLoginEmailPlainText,
};
