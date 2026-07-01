/** Tailwind config for React Email — compiles to inline styles at render time */
export const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4F46E5",
          dark: "#4338CA",
          light: "#EEF2FF",
        },
        success: {
          DEFAULT: "#16A34A",
          light: "#F0FDF4",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FFFBEB",
        },
        danger: {
          DEFAULT: "#DC2626",
          light: "#FEF2F2",
        },
        nexa: {
          bg: "#F8FAFC",
          surface: "#FFFFFF",
          dark: "#0F172A",
          gray: "#64748B",
          border: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SF Mono", "Cascadia Code", "monospace"],
      },
      borderRadius: {
        email: "12px",
        "email-lg": "16px",
      },
    },
  },
};
