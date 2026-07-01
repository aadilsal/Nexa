import { Heading, Link, Section, Text } from "@react-email/components";
import { brand } from "../theme";

export interface EmailHeaderProps {
  appUrl?: string;
}

export function EmailHeader({ appUrl = "https://nexa.app" }: EmailHeaderProps) {
  return (
    <Section className="mb-8">
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
        <tbody>
          <tr>
            <td>
              <Link
                href={appUrl}
                className="no-underline"
                aria-label={`${brand.name} home`}
              >
                <table role="presentation" cellPadding={0} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td
                        className="rounded-email bg-primary pr-3 align-middle"
                        style={{
                          backgroundColor: "#4F46E5",
                          borderRadius: "10px",
                          width: "36px",
                          height: "36px",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                        <Text
                          className="m-0 text-base font-bold text-white"
                          style={{
                            margin: 0,
                            color: "#FFFFFF",
                            fontSize: "18px",
                            fontWeight: 700,
                            lineHeight: "36px",
                          }}
                        >
                          N
                        </Text>
                      </td>
                      <td className="pl-3 align-middle">
                        <Text
                          className="m-0 text-lg font-semibold text-slate-900"
                          style={{
                            margin: 0,
                            fontSize: "18px",
                            fontWeight: 600,
                            color: "#0F172A",
                          }}
                        >
                          {brand.name}
                        </Text>
                        <Text
                          className="m-0 text-xs text-slate-500"
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            color: "#64748B",
                          }}
                        >
                          {brand.tagline}
                        </Text>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Link>
            </td>
          </tr>
          <tr>
            <td className="pt-6">
              <div
                style={{
                  height: "1px",
                  backgroundColor: "#E2E8F0",
                  width: "100%",
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

export interface HeroProps {
  title: string;
  description?: string;
}

export function Hero({ title, description }: HeroProps) {
  return (
    <Section className="mb-8">
      <Heading
        as="h1"
        className="m-0 mb-3 text-2xl font-semibold leading-tight text-slate-900"
        style={{
          margin: "0 0 12px",
          fontSize: "28px",
          fontWeight: 600,
          lineHeight: "1.25",
          color: "#0F172A",
        }}
      >
        {title}
      </Heading>
      {description && (
        <Text
          className="m-0 text-base leading-relaxed text-slate-500"
          style={{
            margin: 0,
            fontSize: "16px",
            lineHeight: "1.6",
            color: "#64748B",
          }}
        >
          {description}
        </Text>
      )}
    </Section>
  );
}
