"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Lock,
  MapPin,
  Shield,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BRAND } from "@/lib/brand";
import {
  LANDING_FAQ,
  QUICK_ANSWERS,
  TRUST_SIGNALS,
} from "@/lib/marketing-content";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Wallet,
    title: "Safe To Spend",
    description:
      "Know exactly how much you can spend today without hurting savings, goals, or your emergency fund.",
  },
  {
    icon: Target,
    title: "Goal planning",
    description:
      "Track progress toward what matters — with ETAs, milestones, and clear on-track signals.",
  },
  {
    icon: Brain,
    title: "AI financial coach",
    description:
      "Get calm, actionable guidance grounded in your real numbers — not generic budgeting tips.",
  },
  {
    icon: Shield,
    title: "Privacy by design",
    description:
      "No bank linking required. Your data stays encrypted. Support only sees what you choose to share.",
  },
];

function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("border-t border-border px-4 py-20 sm:py-24", className)}
    >
      {children}
    </section>
  );
}

export function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-background px-4 pb-16 pt-12 sm:pb-20 sm:pt-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-15%,var(--primary-muted)_0%,transparent_72%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_35%_at_85%_15%,color-mix(in_srgb,var(--primary)_18%,transparent)_0%,transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_35%_at_15%_25%,color-mix(in_srgb,var(--primary)_14%,transparent)_0%,transparent_55%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="mb-4 inline-block rounded-full border border-primary/20 bg-primary-muted px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              {BRAND.description}
            </p>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {BRAND.tagline.marketing}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              {BRAND.tagline.primary} Not a spreadsheet. Not a bank app. Just
              clear answers about your money — in PKR.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="rounded-full px-8 shadow-sm">
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/security">
                <Button variant="outline" size="lg" className="rounded-full px-8">
                  How we protect your data
                </Button>
              </Link>
            </div>
            <p className="mt-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
              Built in Pakistan 🇵🇰
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mx-auto mt-14 max-w-md"
          >
            <Card className="overflow-hidden border-primary/25 bg-card text-left shadow-floating">
              <div className="border-b border-primary/15 bg-primary-muted/60 px-6 py-3">
                <CardDescription className="text-primary/80">
                  Live preview · Safe to spend today
                </CardDescription>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="font-mono text-4xl text-primary tabular-nums">
                  PKR 4,250
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 border-t border-border bg-surface-2 p-6 text-sm">
                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="text-muted-foreground">Health</p>
                  <p className="mt-1 font-semibold tabular-nums">82 / 100</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="text-muted-foreground">Goals on track</p>
                  <p className="mt-1 font-semibold tabular-nums">3 of 4</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* 10-second answers */}
      <Section id="quick-answers" className="border-t-0 bg-section">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
              At a glance
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to know in 10 seconds
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_ANSWERS.map((item) => (
              <Card
                key={item.question}
                className={cn(
                  "shadow-card",
                  item.question === "What's the first thing I should do?"
                    ? "border-primary/30 bg-primary-muted/20 sm:col-span-2 lg:col-span-1"
                    : "",
                )}
              >
                <CardHeader className="pb-3">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg border border-primary/15 bg-primary-muted">
                    <item.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-base">{item.question}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-foreground/80">
                    {item.answer}
                  </CardDescription>
                  {"cta" in item && item.cta ? (
                    <Link href={item.cta.href} className="mt-2 inline-block">
                      <Button size="sm" className="rounded-full">
                        {item.cta.label}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  ) : null}
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* Trust signals */}
      <section className="border-t border-border bg-card px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {TRUST_SIGNALS.map((signal) => (
              <li
                key={signal}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-success"
                  aria-hidden="true"
                />
                {signal}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Features */}
      <Section id="features" className="bg-section">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
              Features
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Financial intelligence, not spreadsheets
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Everything you need to make confident money decisions — in one calm interface.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <Card
                key={feature.title}
                className="transition-shadow hover:shadow-elevated"
              >
                <CardHeader>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/15 bg-primary-muted shadow-sm">
                    <feature.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* How it works */}
      <Section id="how-it-works" className="bg-card">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
              How it works
            </p>
            <h2 className="text-3xl font-bold tracking-tight">Up and running in minutes</h2>
            <p className="mt-4 text-muted-foreground">
              Set up in under five minutes. Get guidance every day.
            </p>
          </div>
          <ol className="space-y-4">
            {[
              "Tell Nexa your income, pay cycle, and fixed expenses",
              "Set goals — emergency fund, car, house, or anything that matters",
              "Log spending quickly; Nexa calculates Safe To Spend and coaches you forward",
            ].map((step, i) => (
              <li
                key={step}
                className="flex gap-4 rounded-xl border border-border bg-surface-2 p-5 shadow-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
                  {i + 1}
                </span>
                <p className="pt-1.5 text-base leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Security */}
      <Section id="security" className="bg-section">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 lg:flex-row lg:gap-16">
          <div className="flex-1">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-muted px-3 py-1 text-sm font-medium text-primary">
              <Lock className="h-4 w-4" aria-hidden="true" />
              Privacy first
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              Your finances stay yours
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Encrypted data. No bank linking. No browsing your salary or goals
              unless you explicitly share a support snapshot. Built for Pakistan
              with PKR-native cycles and local financial reality in mind.
            </p>
            <Link href="/security" className="mt-6 inline-block">
              <Button variant="outline" className="rounded-full">
                Read our security practices
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <Card className="w-full max-w-md shadow-elevated">
            <CardHeader className="border-b border-border bg-surface-2 pb-4">
              <CardTitle className="text-base">Security at a glance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {TRUST_SIGNALS.slice(0, 3).map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
                >
                  <Shield className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* AI */}
      <Section className="bg-card">
        <div className="mx-auto max-w-3xl">
          <Card className="border-primary/20 bg-linear-to-b from-primary-muted/40 to-card p-8 text-center shadow-card sm:p-12">
            <Sparkles className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              AI that earns your trust
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Nexa&apos;s coach explains impact in plain language — purchase simulations,
              weekly reviews, and daily insights that respect your goals.
            </p>
          </Card>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" className="bg-section">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
              FAQ
            </p>
            <h2 className="text-3xl font-bold tracking-tight">Common questions</h2>
          </div>
          <Card className="overflow-hidden shadow-card">
            <Accordion type="single" collapsible className="w-full px-2">
              {LANDING_FAQ.map((item, i) => (
                <AccordionItem key={item.q} value={`item-${i}`} className="px-4">
                  <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            More questions?{" "}
            <Link href="/faq" className="text-primary hover:underline">
              View full FAQ
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="text-primary hover:underline">
              contact us
            </Link>
            .
          </p>
        </div>
      </Section>

      {/* CTA */}
      <Section className="border-t-0 bg-primary-muted">
        <div className="mx-auto max-w-2xl rounded-2xl border border-primary/20 bg-card p-10 text-center shadow-floating sm:p-14">
          <h2 className="text-3xl font-bold tracking-tight">
            {BRAND.tagline.short}
          </h2>
          <p className="mt-4 text-muted-foreground">{BRAND.tagline.primary}</p>
          <Link href="/signup">
            <Button size="lg" className="mt-8 rounded-full px-8 shadow-sm">
              Start free today
            </Button>
          </Link>
          <p className="mt-4 text-xs text-muted-foreground">
            Free during early access · No bank linking · Built in Pakistan 🇵🇰
          </p>
        </div>
      </Section>
    </>
  );
}
