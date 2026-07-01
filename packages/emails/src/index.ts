// Design system
export * from "./theme";
export * from "./types";
export * from "./components";
export * from "./utils/format";
export * from "./utils/plain-text";

// Layout
export { EmailLayout } from "./layouts/email-layout";

// Render API
export {
  sendNexaEmail,
  renderEmail,
  resolveMeta,
  greeting,
  emailRegistry,
  getEmailTemplate,
} from "./render";
export type { EmailTemplateId, EmailPropsFor, RenderedEmail } from "./render";

// Auth templates
export * from "./auth";

// All template categories
export * from "./onboarding/index";
export * from "./reports/index";
export * from "./goals/index";
export * from "./alerts/index";
export * from "./account/index";
export * from "./notifications/index";

// Registry
export { emailRegistry as templates } from "./registry";
