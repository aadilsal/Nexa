import { cn } from "@/lib/utils";

/**
 * Accent surface for callouts only — destructive, primary info, consent blocks.
 * Design system: hero cards and rare emphasis; not for every section.
 */
export function HighlightSurface({
  variant = "default",
  children,
  className,
}: {
  variant?: "default" | "primary" | "destructive";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl px-5 py-5 sm:px-6",
        variant === "primary" && "bg-primary/5",
        variant === "destructive" && "bg-destructive/5",
        variant === "default" && "bg-muted/30",
        className,
      )}
    >
      {children}
    </div>
  );
}
