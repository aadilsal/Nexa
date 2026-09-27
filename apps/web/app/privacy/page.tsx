import type { Metadata } from "next";
import {
  MarketingPageShell,
  ProseSection,
} from "@/components/marketing/marketing-page-shell";
import { BRAND } from "@/lib/brand";
import { COMPANY_LOCATION, SUPPORT_EMAIL } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: `Privacy Policy · ${BRAND.name}`,
  description: "How Nexa collects, uses, and protects your financial data.",
};

export default function PrivacyPage() {
  return (
    <MarketingPageShell
      title="Privacy Policy"
      description="Last updated: July 2026. We built Nexa for people who are cautious about finance products — this policy explains exactly what we do with your data."
    >
      <ProseSection title="Our commitment">
        <p>
          {BRAND.name} is a privacy-first financial intelligence platform. We
          believe your financial data belongs to you. We collect only what we
          need to provide the service, protect it with encryption, and never
          sell it to advertisers or data brokers.
        </p>
      </ProseSection>

      <ProseSection title="What we collect">
        <p>
          <strong>Account information:</strong> Name, email address, and
          authentication credentials (encrypted authenticator secret).
        </p>
        <p>
          <strong>Financial data you provide:</strong> Income, fixed expenses,
          spending logs, goals, and preferences you enter into Nexa.
        </p>
        <p>
          <strong>Usage data:</strong> Basic product analytics (e.g. feature
          usage, errors) to improve the platform. We do not use third-party
          advertising trackers.
        </p>
        <p>
          <strong>Support communications:</strong> Messages you send us, and
          optional support snapshots you choose to share when reporting issues.
        </p>
      </ProseSection>

      <ProseSection title="What we do not collect">
        <p>
          We do not ask for bank login credentials, CNIC copies, or access to
          your bank accounts. We do not read your SMS, contacts, or location
          without your explicit permission.
        </p>
      </ProseSection>

      <ProseSection title="How we use your data">
        <p>
          We use your data solely to operate Nexa: calculating Safe To Spend,
          running purchase simulations, tracking goals, powering the AI coach,
          and sending service-related emails (verification, security alerts).
        </p>
        <p>
          Our team cannot browse your salary, expenses, or goals unless you
          explicitly share a temporary support snapshot when contacting support.
        </p>
      </ProseSection>

      <ProseSection title="How we protect your data">
        <p>
          Sensitive financial fields are encrypted at rest using envelope
          encryption. Data is transmitted over HTTPS/TLS. Access to production
          systems is restricted and audited. See our{" "}
          <a href="/security">Security page</a> for more detail.
        </p>
      </ProseSection>

      <ProseSection title="Data sharing">
        <p>
          We do not sell, rent, or trade your personal or financial data. We
          share data only with infrastructure providers necessary to run the
          service (hosting, email delivery), bound by confidentiality
          agreements, or when required by law.
        </p>
      </ProseSection>

      <ProseSection title="Your rights">
        <p>
          You can export a copy of your data or permanently delete your account
          at any time from Profile → Data &amp; privacy. Deletion is
          irreversible and removes your financial data from our systems.
        </p>
        <p>
          To exercise other privacy rights or ask questions, contact us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </ProseSection>

      <ProseSection title="Cookies">
        <p>
          Nexa uses essential cookies for authentication and session management.
          We do not use advertising or cross-site tracking cookies.
        </p>
      </ProseSection>

      <ProseSection title="Changes to this policy">
        <p>
          We will notify you of material changes via email or in-app notice
          before they take effect. Continued use after notice constitutes
          acceptance of the updated policy.
        </p>
      </ProseSection>

      <ProseSection title="Contact">
        <p>
          {BRAND.name}
          <br />
          {COMPANY_LOCATION}
          <br />
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
      </ProseSection>
    </MarketingPageShell>
  );
}
