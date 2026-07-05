"use client";

import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InfoTipProps {
  text: string;
  className?: string;
  label?: string;
}

export function InfoTip({ text, className, label = "More info" }: InfoTipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex shrink-0 rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
            aria-label={label}
          >
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[280px] leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface LabelWithInfoProps {
  children: React.ReactNode;
  info: string;
  htmlFor?: string;
  className?: string;
}

export function LabelWithInfo({
  children,
  info,
  htmlFor,
  className,
}: LabelWithInfoProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-sm font-medium leading-none">
          {children}
        </label>
      ) : (
        <span className="text-sm font-medium">{children}</span>
      )}
      <InfoTip text={info} label={`About ${typeof children === "string" ? children : "this field"}`} />
    </span>
  );
}
