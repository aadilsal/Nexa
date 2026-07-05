import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { BRAND } from "@/lib/brand";
import { ROADMAP } from "@/lib/marketing-content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: `Roadmap · ${BRAND.name}`,
  description: "What we're building next for Nexa — shipped, in progress, and planned.",
};

const STATUS_CONFIG = {
  shipped: {
    label: "Shipped",
    icon: CheckCircle2,
    className: "text-success",
    badge: "bg-success/10 text-success",
  },
  "in-progress": {
    label: "In progress",
    icon: Clock,
    className: "text-primary",
    badge: "bg-primary-muted text-primary",
  },
  planned: {
    label: "Planned",
    icon: Circle,
    className: "text-muted-foreground",
    badge: "bg-surface-2 text-muted-foreground",
  },
} as const;

export default function RoadmapPage() {
  return (
    <MarketingPageShell
      title="Roadmap"
      description="We build in public. Here's where Nexa is headed — priorities may shift based on user feedback."
      wide
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {ROADMAP.map((item) => {
          const config = STATUS_CONFIG[item.status];
          const StatusIcon = config.icon;

          return (
            <Card key={item.title}>
              <CardHeader>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      config.badge,
                    )}
                  >
                    <StatusIcon className="h-3 w-3" aria-hidden="true" />
                    {config.label}
                  </span>
                </div>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed text-foreground/80">
                  {item.description}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Have a feature request?{" "}
        <Link href="/contact" className="text-primary hover:underline">
          Tell us what you need
        </Link>{" "}
        — user feedback shapes our priorities.
      </p>

      <div className="mt-6">
        <Link href="/signup">
          <Button>Join early access</Button>
        </Link>
      </div>
    </MarketingPageShell>
  );
}
