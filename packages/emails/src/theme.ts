/** Nexa email design tokens — Stripe / Linear inspired, email-client safe */
export const colors = {
  primary: "#4F46E5",
  primaryDark: "#4338CA",
  primaryLight: "#EEF2FF",
  success: "#16A34A",
  successLight: "#F0FDF4",
  warning: "#F59E0B",
  warningLight: "#FFFBEB",
  danger: "#DC2626",
  dangerLight: "#FEF2F2",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  dark: "#0F172A",
  darkSurface: "#1E293B",
  gray: "#64748B",
  grayLight: "#94A3B8",
  border: "#E2E8F0",
  borderDark: "#334155",
  text: "#0F172A",
  textMuted: "#64748B",
  textInverse: "#F8FAFC",
} as const;

export const fonts = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, "SF Mono", "Cascadia Code", monospace',
} as const;

export const radius = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  full: "9999px",
} as const;

export const spacing = {
  xs: "8px",
  sm: "12px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  xxl: "48px",
} as const;

export const brand = {
  name: "Nexa",
  tagline: "AI Financial Intelligence",
  supportEmail: "support@nexa.app",
  address: "Karachi, Pakistan",
  year: new Date().getFullYear(),
} as const;
