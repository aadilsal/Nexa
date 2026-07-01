import { Section, Text } from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  padding?: "sm" | "md" | "lg";
  className?: string;
  style?: CSSProperties;
}

const paddingMap = { sm: "16px", md: "24px", lg: "32px" };

export function Card({ children, padding = "md", style }: CardProps) {
  return (
    <Section
      className="mb-6 rounded-email-lg border border-solid border-slate-200 bg-white"
      style={{
        marginBottom: "24px",
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: "16px",
        padding: paddingMap[padding],
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
        ...style,
      }}
    >
      {children}
    </Section>
  );
}

export function Divider() {
  return (
    <div
      style={{
        height: "1px",
        backgroundColor: "#E2E8F0",
        width: "100%",
        margin: "24px 0",
      }}
    />
  );
}

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "primary";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

const badgeColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: "#F1F5F9", text: "#475569" },
  success: { bg: "#F0FDF4", text: "#16A34A" },
  warning: { bg: "#FFFBEB", text: "#D97706" },
  danger: { bg: "#FEF2F2", text: "#DC2626" },
  primary: { bg: "#EEF2FF", text: "#4F46E5" },
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  const { bg, text } = badgeColors[variant];
  return (
    <Text
      className="m-0 inline-block rounded-full text-xs font-semibold"
      style={{
        margin: 0,
        display: "inline-block",
        backgroundColor: bg,
        color: text,
        fontSize: "12px",
        fontWeight: 600,
        padding: "4px 12px",
        borderRadius: "9999px",
      }}
    >
      {children}
    </Text>
  );
}

export interface InfoBoxProps {
  title?: string;
  children: ReactNode;
}

export function InfoBox({ title, children }: InfoBoxProps) {
  return (
    <Section
      style={{
        backgroundColor: "#EEF2FF",
        border: "1px solid #C7D2FE",
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: "24px",
      }}
    >
      {title && (
        <Text
          style={{
            margin: "0 0 8px",
            fontSize: "14px",
            fontWeight: 600,
            color: "#4338CA",
          }}
        >
          {title}
        </Text>
      )}
      <Text
        style={{
          margin: 0,
          fontSize: "14px",
          lineHeight: "1.6",
          color: "#4338CA",
        }}
      >
        {children}
      </Text>
    </Section>
  );
}

export function WarningBox({ title, children }: InfoBoxProps) {
  return (
    <Section
      style={{
        backgroundColor: "#FFFBEB",
        border: "1px solid #FDE68A",
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: "24px",
      }}
    >
      {title && (
        <Text style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 600, color: "#B45309" }}>
          {title}
        </Text>
      )}
      <Text style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "#92400E" }}>
        {children}
      </Text>
    </Section>
  );
}

export function SuccessBox({ title, children }: InfoBoxProps) {
  return (
    <Section
      style={{
        backgroundColor: "#F0FDF4",
        border: "1px solid #BBF7D0",
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: "24px",
      }}
    >
      {title && (
        <Text style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 600, color: "#15803D" }}>
          {title}
        </Text>
      )}
      <Text style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "#166534" }}>
        {children}
      </Text>
    </Section>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card padding="lg">
      <Text
        style={{
          margin: "0 0 8px",
          fontSize: "16px",
          fontWeight: 600,
          color: "#0F172A",
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          margin: 0,
          fontSize: "14px",
          color: "#64748B",
          textAlign: "center",
          lineHeight: "1.5",
        }}
      >
        {description}
      </Text>
    </Card>
  );
}
