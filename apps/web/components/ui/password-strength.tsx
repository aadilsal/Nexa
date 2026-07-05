"use client";

import { cn } from "@/lib/utils";
import { getPasswordStrength } from "@/lib/password-strength";
import { Progress } from "./progress";

const BAR_COLORS = [
  "bg-destructive",
  "bg-destructive",
  "bg-warning",
  "bg-primary",
  "bg-success",
] as const;

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const { score, label, percent, checks } = getPasswordStrength(password);
  const barColor = BAR_COLORS[Math.max(0, score - 1)] ?? "bg-muted";

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">Password strength</span>
        <span
          className={cn(
            "font-medium",
            score <= 1 && "text-destructive",
            score === 2 && "text-warning",
            score >= 3 && "text-success",
          )}
        >
          {label}
        </span>
      </div>
      <Progress value={percent} indicatorClassName={barColor} />
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <Check ok={checks.length}>8+ characters</Check>
        <Check ok={checks.lowercase}>Lowercase letter</Check>
        <Check ok={checks.uppercase}>Uppercase letter</Check>
        <Check ok={checks.number}>Number</Check>
        <Check ok={checks.special} className="col-span-2">
          Special character (recommended)
        </Check>
      </ul>
    </div>
  );
}

function Check({
  ok,
  children,
  className,
}: {
  ok: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        className,
        ok ? "text-success" : undefined,
      )}
    >
      {ok ? "✓" : "○"} {children}
    </li>
  );
}
