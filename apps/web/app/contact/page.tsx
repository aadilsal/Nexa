import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { SUPPORT_EMAIL } from "@/lib/marketing-content";

// The in-app support-ticket system isn't part of this cutover (single-owner app has no
// need for a ticketing workflow) — this is now a plain "email us" page.

export default function ContactPage() {
  return (
    <MarketingPageShell title="Contact Us" description="Have a question? We typically respond within 1–2 business days.">
      <Card className="p-6">
        <CardTitle className="mb-2">Support email</CardTitle>
        <CardDescription className="text-base text-foreground">
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </CardDescription>
      </Card>
    </MarketingPageShell>
  );
}
