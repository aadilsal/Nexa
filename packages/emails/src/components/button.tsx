import { Button as EmailButton } from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";

export interface ButtonProps {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  ariaLabel?: string;
}

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    backgroundColor: "#4F46E5",
    color: "#FFFFFF",
  },
  secondary: {
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
    border: "1px solid #E2E8F0",
  },
  danger: {
    backgroundColor: "#DC2626",
    color: "#FFFFFF",
  },
};

export function Button({
  href,
  children,
  variant = "primary",
  fullWidth = false,
  ariaLabel,
}: ButtonProps) {
  const style = variantStyles[variant];

  return (
    <EmailButton
      href={href}
      aria-label={ariaLabel}
      className="rounded-email-lg text-center text-base font-semibold no-underline"
      style={{
        ...style,
        display: "inline-block",
        width: fullWidth ? "100%" : "auto",
        padding: "14px 28px",
        borderRadius: "12px",
        fontSize: "16px",
        fontWeight: 600,
        lineHeight: "1.25",
        textDecoration: "none",
        textAlign: "center",
        boxSizing: "border-box",
      }}
    >
      {children}
    </EmailButton>
  );
}
