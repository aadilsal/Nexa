import {
  Body,
  Head,
  Html,
  Preview,
  Font,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import type { ReactNode } from "react";
import { EmailFooter } from "../components/footer";
import { EmailHeader } from "../components/header";
import { tailwindConfig } from "../tailwind-config";

export interface EmailLayoutProps {
  preview: string;
  children: ReactNode;
  appUrl?: string;
  showUnsubscribe?: boolean;
  unsubscribeUrl?: string;
}

export function EmailLayout({
  preview,
  children,
  appUrl = "https://nexa.app",
  showUnsubscribe = false,
  unsubscribeUrl,
}: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>
      <Preview>{preview}</Preview>
      <Tailwind config={tailwindConfig}>
        <Body
          className="mx-auto my-0 bg-slate-50 font-sans antialiased"
          style={{ backgroundColor: "#F8FAFC", margin: 0, padding: 0 }}
        >
          <table
            role="presentation"
            cellPadding={0}
            cellSpacing={0}
            border={0}
            width="100%"
            className="w-full"
          >
            <tbody>
              <tr>
                <td align="center" className="px-4 py-8 sm:px-6">
                  <table
                    role="presentation"
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    width="600"
                    className="w-full max-w-[600px]"
                    style={{ maxWidth: "600px", width: "100%" }}
                  >
                    <tbody>
                      <tr>
                        <td>
                          <EmailHeader appUrl={appUrl} />
                          {children}
                          <EmailFooter
                            appUrl={appUrl}
                            showUnsubscribe={showUnsubscribe}
                            unsubscribeUrl={unsubscribeUrl}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </Body>
      </Tailwind>
    </Html>
  );
}
