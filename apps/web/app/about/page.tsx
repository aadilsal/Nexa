import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { BRAND } from "@/lib/brand";

export default function AboutPage() {
  return (
    <MarketingPageShell
      title="About Nexa"
      description={BRAND.tagline.primary}
    >
      <div className="space-y-6">
        <Card className="p-6">
          <CardTitle className="mb-2">Our belief</CardTitle>
          <CardDescription className="text-base leading-relaxed text-foreground">
            Users own their financial data. Nexa only provides the platform.
            We help you answer one question every day:{" "}
            <strong>{BRAND.tagline.marketing}</strong>
          </CardDescription>
        </Card>

        <Card className="p-6">
          <CardTitle className="mb-2">Safe To Spend™</CardTitle>
          <CardDescription className="text-base leading-relaxed text-foreground">
            Instead of showing how much you&apos;ve spent, Nexa calculates how
            much you can safely spend today without hurting savings, your
            emergency fund, or goal timelines.
          </CardDescription>
        </Card>

        <Card className="p-6">
          <CardTitle className="mb-2">Privacy by architecture</CardTitle>
          <CardDescription className="text-base leading-relaxed text-foreground">
            Your financial data is encrypted. Our team cannot browse your
            salary, expenses, or goals unless you explicitly choose to share a
            temporary support snapshot when reporting a problem.
          </CardDescription>
        </Card>

        <Card className="p-6">
          <CardTitle className="mb-2">Built for Pakistan 🇵🇰</CardTitle>
          <CardDescription className="text-base leading-relaxed text-foreground">
            PKR-native. Payday-to-payday cycles. No bank linking required. No
            dependency on international fintech assumptions.
          </CardDescription>
        </Card>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/signup">
          <Button>Get Started</Button>
        </Link>
        <Link href="/contact">
          <Button variant="outline">Contact Us</Button>
        </Link>
        <Link href="/security">
          <Button variant="outline">Security</Button>
        </Link>
      </div>
    </MarketingPageShell>
  );
}
