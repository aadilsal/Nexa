import { Section, Text } from "@react-email/components";
import { Button, Hero } from "../components";
import { EmailLayout } from "../layouts/email-layout";
import type { EmailTemplate } from "../types";
import { greeting } from "../shared/render-helpers";
import { plainTextLines } from "../utils/plain-text";
import { brand } from "../theme";

export interface WelcomeEmailProps {
  firstName?: string | null;
  onboardingUrl: string;
  appUrl?: string;
}

export const welcomeEmailMeta = {
  subject: (p: WelcomeEmailProps) =>
    p.firstName ? `Welcome to Nexa, ${p.firstName}` : "Welcome to Nexa",
  previewText: "Your financial intelligence starts here. Complete setup in under 5 minutes.",
  purpose: "Onboard new users after signup with a calm introduction to Nexa.",
  uxReasoning:
    "First impression sets trust. No hype — explain value clearly and one primary CTA.",
  customizationNotes: "Personalize firstName; link onboardingUrl to /onboarding.",
};

export function WelcomeEmail({
  firstName,
  onboardingUrl,
  appUrl = "https://nexa.app",
}: WelcomeEmailProps) {
  return (
    <EmailLayout preview={welcomeEmailMeta.previewText as string} appUrl={appUrl}>
      <Hero
        title={`Welcome to ${brand.name}`}
        description={`${greeting(firstName)} — ${brand.name} helps you make smarter financial decisions with Safe To Spend™, goal tracking, and AI insights. Your data stays private and encrypted.`}
      />
      <Section style={{ marginBottom: "32px" }}>
        <Text style={{ margin: "0 0 16px", fontSize: "15px", lineHeight: "1.6", color: "#475569" }}>
          Here&apos;s what you can do:
        </Text>
        <Text style={{ margin: "0 0 8px", fontSize: "14px", color: "#64748B" }}>
          · See how much you can safely spend today
        </Text>
        <Text style={{ margin: "0 0 8px", fontSize: "14px", color: "#64748B" }}>
          · Track goals with real progress and ETAs
        </Text>
        <Text style={{ margin: "0 0 24px", fontSize: "14px", color: "#64748B" }}>
          · Get weekly reviews and AI-powered insights
        </Text>
        <Button href={onboardingUrl} ariaLabel="Complete financial setup">
          Complete Setup
        </Button>
      </Section>
    </EmailLayout>
  );
}

export function welcomeEmailPlainText(props: WelcomeEmailProps): string {
  return plainTextLines([
    `${greeting(props.firstName)}, welcome to ${brand.name}.`,
    `${brand.tagline}. Your data stays private and encrypted.`,
    "Complete your setup: " + props.onboardingUrl,
  ]);
}

export const welcomeEmail: EmailTemplate<WelcomeEmailProps> = {
  meta: welcomeEmailMeta,
  Component: WelcomeEmail,
  exampleProps: {
    firstName: "Aadil",
    onboardingUrl: "https://nexa.app/onboarding",
  },
  toPlainText: welcomeEmailPlainText,
};
