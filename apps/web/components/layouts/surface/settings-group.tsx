import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Section label — design system: uppercase label, muted (Profile & Settings) */
export function SettingsSectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-xs font-medium uppercase tracking-wider text-muted-foreground",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function SettingsGroup({
  label,
  description,
  children,
  className,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mt-7 first:mt-0", className)}>
      <div className="mb-2 px-1">
        <SettingsSectionLabel>{label}</SettingsSectionLabel>
        {description ? (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="divide-y divide-border rounded-2xl bg-card px-4 shadow-card">{children}</div>
    </section>
  );
}

export function SettingsRow({
  label,
  hint,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("py-4", className)}>
      {label ? (
        <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
      ) : null}
      {children}
      {hint ? (
        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function SettingsLinkRow({
  href,
  title,
  description,
  meta,
  onClick,
}: {
  href?: string;
  title: string;
  description?: string;
  meta?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
        {meta ? (
          <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
        ) : null}
      </div>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </>
  );

  const className =
    "flex min-h-14 w-full items-center gap-3 py-3.5 text-left transition-colors active:opacity-70";

  if (href) {
    return (
      <Link href={href} className={cn(className, "group")}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

export function SettingsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ul className={cn("divide-y divide-border rounded-2xl bg-card px-4 shadow-card", className)}>{children}</ul>
  );
}

export function SettingsListItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "flex items-center justify-between gap-4 py-3 text-sm first:pt-0 last:pb-0",
        className,
      )}
    >
      {children}
    </li>
  );
}
