import { render } from "@react-email/render";
import type { ReactElement } from "react";
import type { EmailMeta, RenderedEmail } from "../types";

export function resolveMeta<P>(
  meta: EmailMeta<P>,
  props: P,
): { subject: string; previewText: string } {
  return {
    subject: typeof meta.subject === "function" ? meta.subject(props) : meta.subject,
    previewText:
      typeof meta.previewText === "function" ? meta.previewText(props) : meta.previewText,
  };
}

export async function renderEmail<P>(
  Component: (props: P) => ReactElement,
  meta: EmailMeta<P>,
  props: P,
  toPlainText: (props: P) => string,
): Promise<RenderedEmail> {
  const { subject, previewText } = resolveMeta(meta, props);
  const html = await render(Component(props), { pretty: true });
  const text = toPlainText(props);

  return { html, text, subject, previewText };
}

export function greeting(name?: string | null): string {
  return name ? `Hi ${name}` : "Hi there";
}
