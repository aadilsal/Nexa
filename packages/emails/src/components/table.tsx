import { Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

export interface DataTableRow {
  label: string;
  value: ReactNode;
  highlight?: boolean;
}

export interface DataTableProps {
  rows: DataTableRow[];
}

export function DataTable({ rows }: DataTableProps) {
  return (
    <Section style={{ marginBottom: "24px" }}>
      <table
        role="presentation"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        style={{ borderCollapse: "collapse" }}
      >
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td
                style={{
                  padding: "12px 0",
                  borderBottom: i < rows.length - 1 ? "1px solid #E2E8F0" : "none",
                  fontSize: "14px",
                  color: "#64748B",
                  width: "45%",
                }}
              >
                {row.label}
              </td>
              <td
                align="right"
                style={{
                  padding: "12px 0",
                  borderBottom: i < rows.length - 1 ? "1px solid #E2E8F0" : "none",
                  fontSize: "14px",
                  fontWeight: row.highlight ? 600 : 400,
                  color: row.highlight ? "#0F172A" : "#0F172A",
                }}
              >
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

export interface CodeBlockProps {
  code: string;
  label?: string;
}

export function CodeBlock({ code, label }: CodeBlockProps) {
  return (
    <Section style={{ marginBottom: "24px" }}>
      {label && (
        <Text style={{ margin: "0 0 8px", fontSize: "12px", color: "#64748B", fontWeight: 500 }}>
          {label}
        </Text>
      )}
      <Text
        style={{
          margin: 0,
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: "28px",
          fontWeight: 700,
          letterSpacing: "0.25em",
          textAlign: "center",
          color: "#0F172A",
          backgroundColor: "#F1F5F9",
          padding: "20px 24px",
          borderRadius: "12px",
          border: "1px solid #E2E8F0",
        }}
      >
        {code}
      </Text>
    </Section>
  );
}

export interface OtpBoxProps {
  code: string;
  expiresInMinutes?: number;
}

export function OtpBox({ code, expiresInMinutes = 10 }: OtpBoxProps) {
  return (
    <Section style={{ marginBottom: "24px" }}>
      <CodeBlock code={code} label="Verification code" />
      <Text
        style={{
          margin: 0,
          fontSize: "13px",
          color: "#64748B",
          textAlign: "center",
        }}
      >
        Expires in {expiresInMinutes} minutes
      </Text>
    </Section>
  );
}
