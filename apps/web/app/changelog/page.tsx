import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { BRAND } from "@/lib/brand";
import { CHANGELOG } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: `Changelog · ${BRAND.name}`,
  description: "What's new in Nexa — releases, improvements, and fixes.",
};

export default function ChangelogPage() {
  return (
    <MarketingPageShell
      title="Changelog"
      description="We ship in the open. Here's what we've built and improved."
    >
      <div className="space-y-8">
        {CHANGELOG.map((entry) => (
          <Card key={entry.version}>
            <CardHeader>
              <div className="mb-1 flex flex-wrap items-center gap-3">
                <CardTitle className="text-lg">v{entry.version}</CardTitle>
                <span className="rounded-full bg-primary-muted px-2.5 py-0.5 text-xs font-medium text-primary">
                  {entry.date}
                </span>
              </div>
              <CardDescription className="text-base font-medium text-foreground">
                {entry.title}
              </CardDescription>
            </CardHeader>
            <ul className="space-y-2 px-6 pb-6 text-sm text-muted-foreground">
              {entry.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-primary">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Want to know what&apos;s coming next? See our{" "}
        <Link href="/roadmap" className="text-primary hover:underline">
          Roadmap
        </Link>
        .
      </p>

      <div className="mt-6">
        <Link href="/signup">
          <Button>Try the latest version</Button>
        </Link>
      </div>
    </MarketingPageShell>
  );
}
