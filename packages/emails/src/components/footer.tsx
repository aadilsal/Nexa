import { Link, Section, Text } from "@react-email/components";
import { brand } from "../theme";

export interface EmailFooterProps {
  appUrl?: string;
  showUnsubscribe?: boolean;
  unsubscribeUrl?: string;
}

export function EmailFooter({
  appUrl = "https://nexa.app",
  showUnsubscribe = false,
  unsubscribeUrl,
}: EmailFooterProps) {
  return (
    <Section className="mt-10 pt-8">
      <div
        style={{
          height: "1px",
          backgroundColor: "#E2E8F0",
          width: "100%",
          marginBottom: "24px",
        }}
      />
      <Text
        className="m-0 mb-4 text-center text-xs font-medium uppercase tracking-wide text-slate-400"
        style={{
          margin: "0 0 16px",
          textAlign: "center",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.05em",
          color: "#94A3B8",
          textTransform: "uppercase",
        }}
      >
        Privacy First · Your data stays encrypted
      </Text>
      <Text
        className="m-0 mb-4 text-center text-sm text-slate-500"
        style={{
          margin: "0 0 16px",
          textAlign: "center",
          fontSize: "14px",
          color: "#64748B",
        }}
      >
        Need help?{" "}
        <Link
          href={`mailto:${brand.supportEmail}`}
          className="text-primary no-underline"
          style={{ color: "#4F46E5" }}
        >
          Contact Support
        </Link>
      </Text>
      {showUnsubscribe && unsubscribeUrl && (
        <Text
          className="m-0 mb-4 text-center text-sm text-slate-500"
          style={{
            margin: "0 0 16px",
            textAlign: "center",
            fontSize: "14px",
            color: "#64748B",
          }}
        >
          <Link
            href={unsubscribeUrl}
            className="text-slate-500 underline"
            style={{ color: "#64748B" }}
          >
            Unsubscribe
          </Link>{" "}
          from these emails
        </Text>
      )}
      <Text
        className="m-0 text-center text-xs text-slate-400"
        style={{
          margin: 0,
          textAlign: "center",
          fontSize: "12px",
          color: "#94A3B8",
        }}
      >
        © {brand.year} {brand.name} · {brand.address}
      </Text>
      <Text
        className="m-0 mt-2 text-center text-xs text-slate-400"
        style={{
          margin: "8px 0 0",
          textAlign: "center",
          fontSize: "12px",
          color: "#94A3B8",
        }}
      >
        <Link href={appUrl} style={{ color: "#94A3B8" }}>
          nexa.app
        </Link>
      </Text>
    </Section>
  );
}
