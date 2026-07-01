import type { ReactElement } from "react";

export interface EmailMeta<P = Record<string, unknown>> {
  /** Default subject line; may use props for personalization */
  subject: string | ((props: P) => string);
  previewText: string | ((props: P) => string);
  purpose: string;
  uxReasoning: string;
  customizationNotes?: string;
}

export interface RenderedEmail {
  html: string;
  text: string;
  subject: string;
  previewText: string;
}

export type EmailTemplate<P> = {
  meta: EmailMeta<P>;
  Component: (props: P) => ReactElement;
  exampleProps: P;
  toPlainText: (props: P) => string;
};
