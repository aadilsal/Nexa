import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/widgets/page-header";
import { cn } from "@/lib/utils";

interface PageShellProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Settings-style narrow column (design system: profile, security) */
  narrow?: boolean;
}

export function PageShell({
  title,
  description,
  backHref,
  backLabel = "Back",
  actions,
  children,
  className,
  narrow = false,
}: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        narrow ? "max-w-2xl" : "max-w-3xl",
        className,
      )}
    >
      {backHref ? (
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>
      ) : null}

      <PageHeader title={title} description={description} actions={actions} />

      {children}
    </div>
  );
}
