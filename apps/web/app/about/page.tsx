import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="mx-auto max-w-3xl flex-1 px-4 py-12">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to home
        </Link>

        <h1 className="mb-4 text-3xl font-bold">About Nexa</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Pakistan&apos;s privacy-first financial decision platform.
        </p>

        <div className="space-y-6">
          <Card className="p-6">
            <CardTitle className="mb-2">Our belief</CardTitle>
            <CardDescription className="text-base leading-relaxed text-foreground">
              Users own their financial data. Nexa only provides the platform.
              We help you answer one question every day:{" "}
              <strong>Can I afford this while staying on track toward my goals?</strong>
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
            <CardTitle className="mb-2">Built for Pakistan</CardTitle>
            <CardDescription className="text-base leading-relaxed text-foreground">
              PKR-native. Payday-to-payday cycles. No bank linking required. No
              dependency on international fintech assumptions.
            </CardDescription>
          </Card>
        </div>

        <div className="mt-10 flex gap-3">
          <Link href="/signup">
            <Button>Get Started</Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline">Contact Us</Button>
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
