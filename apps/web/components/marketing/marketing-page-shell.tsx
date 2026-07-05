import Link from "next/link";
import { Header } from "@/components/header";
import { SiteFooter } from "@/components/site-footer";
import { cn } from "@/lib/utils";

type MarketingPageShellProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
};

export function MarketingPageShell({
  title,
  description,
  children,
  className,
  wide = false,
}: MarketingPageShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div
          className={cn(
            "mx-auto px-4 py-12",
            wide ? "max-w-4xl" : "max-w-3xl",
            className,
          )}
        >
          <Link
            href="/"
            className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to home
          </Link>

          <h1 className="mb-4 text-3xl font-bold tracking-tight">{title}</h1>
          {description ? (
            <p className="mb-10 text-lg text-muted-foreground">{description}</p>
          ) : null}

          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function ProseSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-xl font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3 text-base leading-relaxed text-muted-foreground [&_strong]:text-foreground [&_a]:text-primary [&_a]:hover:underline">
        {children}
      </div>
    </section>
  );
}
