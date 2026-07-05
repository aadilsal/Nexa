import { cn } from "@/lib/utils";

/** Borderless content section — typography + dividers (no Card) */
export function ContentSection({
  title,
  icon,
  description,
  children,
  className,
}: {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-t border-border/50 pt-8", className)}>
      <div className="mb-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          {icon}
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
