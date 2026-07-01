import type { ReactElement } from "react";
import { renderEmail, resolveMeta } from "./shared/render-helpers";
import {
  emailRegistry,
  getEmailTemplate,
  type EmailTemplateId,
  type EmailPropsFor,
} from "./registry";
import type { RenderedEmail } from "./types";

export { renderEmail, resolveMeta, greeting } from "./shared/render-helpers";

/**
 * Render any registered Nexa email template to HTML + plain text.
 *
 * @example
 * const { html, text, subject } = await sendNexaEmail("auth.verify-email", {
 *   firstName: "Aadil",
 *   verifyUrl: "https://nexa.app/verify?token=abc",
 * });
 */
export async function sendNexaEmail<K extends EmailTemplateId>(
  templateId: K,
  props: EmailPropsFor<K>,
): Promise<RenderedEmail> {
  const template = getEmailTemplate(templateId);
  return renderEmail(
    template.Component as (props: EmailPropsFor<K>) => ReactElement,
    template.meta as import("./types").EmailMeta<EmailPropsFor<K>>,
    props,
    template.toPlainText as (props: EmailPropsFor<K>) => string,
  );
}

export { emailRegistry, getEmailTemplate };
export type { EmailTemplateId, EmailPropsFor, RenderedEmail };
