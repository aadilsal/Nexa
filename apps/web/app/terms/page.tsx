import type { Metadata } from "next";
import {
  MarketingPageShell,
  ProseSection,
} from "@/components/marketing/marketing-page-shell";
import { BRAND } from "@/lib/brand";
import { COMPANY_LOCATION, SUPPORT_EMAIL } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: `Terms of Service · ${BRAND.name}`,
  description: "Terms governing your use of the Nexa financial intelligence platform.",
};

export default function TermsPage() {
  return (
    <MarketingPageShell
      title="Terms of Service"
      description="Last updated: July 2026. By using Nexa, you agree to these terms."
    >
      <ProseSection title="Agreement">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use
          of {BRAND.name}, operated from {COMPANY_LOCATION}. By creating an
          account or using the service, you agree to these Terms and our{" "}
          <a href="/privacy">Privacy Policy</a>.
        </p>
      </ProseSection>

      <ProseSection title="What Nexa is — and is not">
        <p>
          {BRAND.name} is a financial <strong>intelligence and guidance</strong>{" "}
          platform. It is not a bank, lender, investment advisor, tax advisor, or
          regulated financial institution. Nexa does not hold, move, or manage
          your money.
        </p>
        <p>
          Safe To Spend, Can I Buy This?, health scores, and AI coach responses
          are informational tools based on data you provide. They are not
          financial advice. You are responsible for your own financial decisions.
        </p>
      </ProseSection>

      <ProseSection title="Eligibility">
        <p>
          You must be at least 18 years old and capable of entering a binding
          agreement to use Nexa. The service is designed for users in Pakistan.
        </p>
      </ProseSection>

      <ProseSection title="Your account">
        <p>
          You are responsible for maintaining the security of your account
          credentials. Notify us immediately at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> if you suspect
          unauthorized access.
        </p>
        <p>
          You agree to provide accurate information. Nexa&apos;s calculations
          depend on the data you enter — inaccurate inputs may produce inaccurate
          guidance.
        </p>
      </ProseSection>

      <ProseSection title="Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Use Nexa for unlawful purposes or to violate others&apos; rights</li>
          <li>Attempt to access other users&apos; data or our systems without authorization</li>
          <li>Reverse engineer, scrape, or overload the service</li>
          <li>Share your account credentials with others</li>
        </ul>
      </ProseSection>

      <ProseSection title="Intellectual property">
        <p>
          Nexa, Safe To Spend™, and related branding are owned by us. You retain
          ownership of your financial data. We grant you a limited, personal,
          non-transferable license to use the platform.
        </p>
      </ProseSection>

      <ProseSection title="Early access & pricing">
        <p>
          Nexa is currently available free during early access. We may introduce
          paid plans in the future. We will provide advance notice before any
          charges apply, and you may cancel before a paid plan begins.
        </p>
      </ProseSection>

      <ProseSection title="Disclaimer of warranties">
        <p>
          Nexa is provided &quot;as is&quot; without warranties of any kind. We do
          not guarantee uninterrupted or error-free service, or that guidance will
          be accurate for your specific situation.
        </p>
      </ProseSection>

      <ProseSection title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, {BRAND.name} is not liable for
          indirect, incidental, or consequential damages arising from your use of
          the service, including financial decisions made based on Nexa&apos;s
          output.
        </p>
      </ProseSection>

      <ProseSection title="Termination">
        <p>
          You may delete your account at any time. We may suspend or terminate
          accounts that violate these Terms. Upon termination, your right to use
          Nexa ends, and you may request data deletion per our Privacy Policy.
        </p>
      </ProseSection>

      <ProseSection title="Changes">
        <p>
          We may update these Terms. Material changes will be communicated via
          email or in-app notice. Continued use after the effective date
          constitutes acceptance.
        </p>
      </ProseSection>

      <ProseSection title="Governing law">
        <p>
          These Terms are governed by the laws of Pakistan. Disputes shall be
          subject to the exclusive jurisdiction of courts in Karachi, Pakistan.
        </p>
      </ProseSection>

      <ProseSection title="Contact">
        <p>
          Questions about these Terms? Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </ProseSection>
    </MarketingPageShell>
  );
}
