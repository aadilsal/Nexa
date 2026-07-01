import { Section } from "@react-email/components";
import { Button, Hero, InfoBox, SuccessBox } from "../components";
import { EmailLayout } from "../layouts/email-layout";
import type { EmailTemplate } from "../types";
import { greeting } from "../shared/render-helpers";
import { plainTextLines } from "../utils/plain-text";
import { formatPKR } from "../utils/format";

export interface CompleteProfileEmailProps {
  firstName?: string | null;
  onboardingUrl: string;
  appUrl?: string;
}

export const completeProfileEmailMeta = {
  subject: "Complete your financial profile",
  previewText: "Finish setup in under 5 minutes to unlock your dashboard.",
  purpose: "Nudge users who started but didn't finish onboarding.",
  uxReasoning: "Single CTA, time estimate reduces friction anxiety.",
};

export function CompleteProfileEmail({
  firstName,
  onboardingUrl,
  appUrl = "https://nexa.app",
}: CompleteProfileEmailProps) {
  return (
    <EmailLayout preview={completeProfileEmailMeta.previewText} appUrl={appUrl}>
      <Hero
        title="Finish your setup"
        description={`${greeting(firstName)}, you're almost there. Add your income, expenses, and goals to unlock Safe To Spend™ and personalized insights.`}
      />
      <InfoBox title="Takes under 5 minutes">
        Your financial data is encrypted. We never sell or share it.
      </InfoBox>
      <Section style={{ textAlign: "center" }}>
        <Button href={onboardingUrl}>Continue Onboarding</Button>
      </Section>
    </EmailLayout>
  );
}

export const completeProfileEmail: EmailTemplate<CompleteProfileEmailProps> = {
  meta: completeProfileEmailMeta,
  Component: CompleteProfileEmail,
  exampleProps: { firstName: "Aadil", onboardingUrl: "https://nexa.app/onboarding" },
  toPlainText: (p) =>
    plainTextLines([
      `${greeting(p.firstName)}, complete your profile:`,
      p.onboardingUrl,
    ]),
};

export interface OnboardingCompleteEmailProps {
  firstName?: string | null;
  dashboardUrl: string;
  safeToSpend?: number;
  appUrl?: string;
}

export const onboardingCompleteEmailMeta = {
  subject: "You're all set — welcome to Nexa",
  previewText: "Your financial profile is ready. Open your dashboard.",
  purpose: "Celebrate onboarding completion and drive first dashboard visit.",
  uxReasoning: "Positive reinforcement + optional STS preview creates immediate value.",
};

export function OnboardingCompleteEmail({
  firstName,
  dashboardUrl,
  safeToSpend,
  appUrl = "https://nexa.app",
}: OnboardingCompleteEmailProps) {
  return (
    <EmailLayout preview={onboardingCompleteEmailMeta.previewText} appUrl={appUrl}>
      <Hero
        title="Setup complete"
        description={`${greeting(firstName)}, your financial profile is ready. Nexa will now track your cycle, goals, and Safe To Spend™ daily.`}
      />
      {safeToSpend !== undefined && (
        <SuccessBox title="Today's Safe To Spend™">
          {formatPKR(safeToSpend)} — based on your income, expenses, and goals.
        </SuccessBox>
      )}
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button href={dashboardUrl}>Open Dashboard</Button>
      </Section>
    </EmailLayout>
  );
}

export const onboardingCompleteEmail: EmailTemplate<OnboardingCompleteEmailProps> = {
  meta: onboardingCompleteEmailMeta,
  Component: OnboardingCompleteEmail,
  exampleProps: {
    firstName: "Aadil",
    dashboardUrl: "https://nexa.app/dashboard",
    safeToSpend: 4250,
  },
  toPlainText: (p) =>
    plainTextLines([
      `${greeting(p.firstName)}, setup complete!`,
      p.safeToSpend !== undefined ? `Safe To Spend: ${formatPKR(p.safeToSpend)}` : false,
      p.dashboardUrl,
    ]),
};
