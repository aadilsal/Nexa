import { Loader2 } from "lucide-react";
import { TopProgressBar } from "@/components/ui/top-progress-bar";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  label?: string;
  className?: string;
  /** Show the thin top progress bar (default: true). */
  showProgressBar?: boolean;
  /** Show the centered spinner overlay (default: true). */
  showSpinner?: boolean;
}

export function PageLoader({
  label = "Loading page…",
  className,
  showProgressBar = true,
  showSpinner = true,
}: PageLoaderProps) {
  if (!showProgressBar && !showSpinner) return null;

  return (
    <>
      {showProgressBar ? <TopProgressBar active /> : null}
      {showSpinner ? (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className={cn(
            "fixed inset-0 z-[9998] flex flex-col items-center justify-center gap-4 bg-background/92 backdrop-blur-md",
            className,
          )}
        >
          <div className="relative flex h-14 w-14 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <Loader2
              className="h-8 w-8 animate-spin text-primary"
              aria-hidden="true"
            />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
        </div>
      ) : null}
    </>
  );
}
