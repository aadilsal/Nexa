import { Resend } from "resend";
import { sendNexaEmail } from "@nexa/emails";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.RESEND_FROM ?? "Nexa <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function appUrl(path: string) {
  return `${APP_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  if (process.env.NODE_ENV === "development") {
    console.log("\n📧 Email (dev)\n", {
      to: options.to,
      subject: options.subject,
    });
  }

  if (!resend) {
    console.warn("Resend not configured — email not sent");
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

/** Auth emails using the Nexa design system */
export async function sendAuthEmail(options: {
  to: string;
  type: "verify-email" | "magic-link" | "password-reset" | "welcome";
  firstName?: string | null;
  url: string;
  email?: string;
}) {
  const app = APP_URL;

  if (options.type === "verify-email") {
    const rendered = await sendNexaEmail("auth.verify-email", {
      firstName: options.firstName,
      verifyUrl: options.url,
      appUrl: app,
    });
    await sendEmail({ to: options.to, ...rendered });
    if (process.env.NODE_ENV === "development") {
      console.log("   url:", options.url);
    }
    return;
  }

  if (options.type === "magic-link") {
    const rendered = await sendNexaEmail("auth.magic-link", {
      email: options.email ?? options.to,
      magicLinkUrl: options.url,
      appUrl: app,
    });
    await sendEmail({ to: options.to, ...rendered });
    if (process.env.NODE_ENV === "development") {
      console.log("   url:", options.url);
    }
    return;
  }

  if (options.type === "password-reset") {
    const rendered = await sendNexaEmail("auth.password-reset", {
      firstName: options.firstName,
      resetUrl: options.url,
      appUrl: app,
    });
    await sendEmail({ to: options.to, ...rendered });
    if (process.env.NODE_ENV === "development") {
      console.log("   url:", options.url);
    }
    return;
  }

  if (options.type === "welcome") {
    const rendered = await sendNexaEmail("auth.welcome", {
      firstName: options.firstName,
      onboardingUrl: options.url,
      appUrl: app,
    });
    await sendEmail({ to: options.to, ...rendered });
    return;
  }
}
