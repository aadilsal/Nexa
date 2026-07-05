import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Lock, Shield, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { BRAND } from "@/lib/brand";
import { TRUST_SIGNALS } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: `Security · ${BRAND.name}`,
  description: "How Nexa protects your financial data with encryption, access controls, and privacy-by-design.",
};

const SECURITY_PILLARS = [
  {
    icon: Lock,
    title: "Encryption everywhere",
    description:
      "Sensitive financial data is encrypted at rest with envelope encryption. All traffic uses HTTPS/TLS in transit.",
  },
  {
    icon: Shield,
    title: "No bank credentials",
    description:
      "Nexa never asks for your bank login, card numbers, or CNIC. We cannot access your bank accounts because we never connect to them.",
  },
  {
    icon: UserCheck,
    title: "Staff cannot browse your data",
    description:
      "Our team cannot view your salary, expenses, or goals unless you explicitly share a temporary support snapshot when reporting an issue.",
  },
  {
    icon: CheckCircle2,
    title: "You control your data",
    description:
      "Export your data or permanently delete your account anytime from Profile → Data & privacy. Deletion is irreversible.",
  },
];

export default function SecurityPage() {
  return (
    <MarketingPageShell
      title="Security"
      description="Finance products earn trust through actions, not slogans. Here's how Nexa protects your data."
    >
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        {SECURITY_PILLARS.map((pillar) => (
          <Card key={pillar.title}>
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg border border-primary/15 bg-primary-muted">
                <pillar.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <CardTitle className="text-base">{pillar.title}</CardTitle>
              <CardDescription className="text-sm leading-relaxed text-foreground/80">
                {pillar.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Authentication</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            Passkeys (WebAuthn) for phishing-resistant sign-in
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            Magic-link email authentication
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            Password hashing with industry-standard algorithms
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            User-visible security activity log in your profile
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Infrastructure</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Nexa runs on secure cloud infrastructure with restricted production
          access, encrypted backups, and regular dependency updates. We follow
          least-privilege principles — engineers access only what they need to
          operate the service.
        </p>
        <ul className="flex flex-wrap gap-3">
          {TRUST_SIGNALS.map((signal) => (
            <li
              key={signal}
              className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-sm text-muted-foreground"
            >
              {signal}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">AI coach safety</h2>
        <p className="leading-relaxed text-muted-foreground">
          The AI coach is read-only — it explains your numbers but cannot move
          money, change your data, or execute transactions. Responses are grounded
          in Nexa&apos;s financial engine, not open-ended speculation.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Reporting security issues</h2>
        <p className="leading-relaxed text-muted-foreground">
          Found a vulnerability? Please report it responsibly to{" "}
          <a href="mailto:security@nexa.app" className="text-primary hover:underline">
            security@nexa.app
          </a>
          . We take security reports seriously and will respond promptly.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/privacy">
          <Button variant="outline">Privacy Policy</Button>
        </Link>
        <Link href="/contact">
          <Button variant="outline">Contact us</Button>
        </Link>
      </div>
    </MarketingPageShell>
  );
}
