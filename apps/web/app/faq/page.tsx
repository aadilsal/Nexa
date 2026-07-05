import type { Metadata } from "next";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { BRAND } from "@/lib/brand";
import { FULL_FAQ } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: `FAQ · ${BRAND.name}`,
  description: "Frequently asked questions about Nexa — privacy, pricing, Safe To Spend, and more.",
};

export default function FaqPage() {
  return (
    <MarketingPageShell
      title="Frequently Asked Questions"
      description="Straight answers for people who are cautious about finance products."
    >
      <Card className="overflow-hidden shadow-card">
        <Accordion type="single" collapsible className="w-full px-2">
          {FULL_FAQ.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`} className="px-4">
              <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>

      <p className="mt-8 text-muted-foreground">
        Still have questions?{" "}
        <Link href="/contact" className="text-primary hover:underline">
          Contact us
        </Link>{" "}
        — we typically respond within 1–2 business days.
      </p>

      <div className="mt-6">
        <Link href="/signup">
          <Button>Get started free</Button>
        </Link>
      </div>
    </MarketingPageShell>
  );
}
