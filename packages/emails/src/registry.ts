import type { EmailTemplate } from "./types";
import { welcomeEmail } from "./auth/welcome";
import { verifyEmail } from "./auth/verify-email";
import { magicLinkEmail } from "./auth/magic-link";
import { passwordResetEmail } from "./auth/password-reset";
import { passwordChangedEmail } from "./auth/password-changed";
import { newLoginEmail } from "./auth/new-login";
import { completeProfileEmail, onboardingCompleteEmail } from "./onboarding/index";
import { weeklyReviewEmail, monthlyReviewEmail } from "./reports/index";
import {
  goalCreatedEmail,
  goalUpdatedEmail,
  goalAchievedEmail,
  goalBehindScheduleEmail,
  goalReminderEmail,
} from "./goals/index";
import {
  safeToSpendEmail,
  purchaseSimulationEmail,
  highSpendingAlert,
  goalDelayAlert,
  incomeDropAlert,
  lowEmergencyFundAlert,
  budgetTrendAlert,
  charitySummaryEmail,
  monthlyCharityEmail,
} from "./alerts/index";
import {
  emailChangedEmail,
  accountDeletedEmail,
  exportReadyEmail,
  privacyUpdatedEmail,
  securityAlertEmail,
} from "./account/index";
import {
  logExpensesReminderEmail,
  weeklyReminderEmail,
  inactiveUserReminderEmail,
  aiInsightEmail,
  somethingWrongEmail,
  paymentFailedEmail,
  processingDelayedEmail,
} from "./notifications/index";

/** Registry of all Nexa email templates */
export const emailRegistry = {
  // Auth
  "auth.welcome": welcomeEmail,
  "auth.verify-email": verifyEmail,
  "auth.magic-link": magicLinkEmail,
  "auth.password-reset": passwordResetEmail,
  "auth.password-changed": passwordChangedEmail,
  "auth.new-login": newLoginEmail,
  // Onboarding
  "onboarding.complete-profile": completeProfileEmail,
  "onboarding.complete": onboardingCompleteEmail,
  // Reports
  "reports.weekly": weeklyReviewEmail,
  "reports.monthly": monthlyReviewEmail,
  // Goals
  "goals.created": goalCreatedEmail,
  "goals.updated": goalUpdatedEmail,
  "goals.achieved": goalAchievedEmail,
  "goals.behind-schedule": goalBehindScheduleEmail,
  "goals.reminder": goalReminderEmail,
  // Safe To Spend & Purchase
  "insights.safe-to-spend": safeToSpendEmail,
  "insights.purchase-simulation": purchaseSimulationEmail,
  // Alerts
  "alerts.high-spending": highSpendingAlert,
  "alerts.goal-delay": goalDelayAlert,
  "alerts.income-drop": incomeDropAlert,
  "alerts.low-emergency-fund": lowEmergencyFundAlert,
  "alerts.budget-trend": budgetTrendAlert,
  // Charity
  "charity.summary": charitySummaryEmail,
  "charity.monthly": monthlyCharityEmail,
  // Account
  "account.email-changed": emailChangedEmail,
  "account.deleted": accountDeletedEmail,
  "account.export-ready": exportReadyEmail,
  "account.privacy-updated": privacyUpdatedEmail,
  "account.security-alert": securityAlertEmail,
  // Notifications
  "notifications.log-expenses": logExpensesReminderEmail,
  "notifications.weekly-reminder": weeklyReminderEmail,
  "notifications.inactive-user": inactiveUserReminderEmail,
  // AI Insights
  "insights.ai": aiInsightEmail,
  // Errors
  "errors.something-wrong": somethingWrongEmail,
  "errors.payment-failed": paymentFailedEmail,
  "errors.processing-delayed": processingDelayedEmail,
} as const;

export type EmailTemplateId = keyof typeof emailRegistry;

export function getEmailTemplate<K extends EmailTemplateId>(
  id: K,
): (typeof emailRegistry)[K] {
  return emailRegistry[id];
}

export type EmailPropsFor<K extends EmailTemplateId> =
  (typeof emailRegistry)[K] extends EmailTemplate<infer P> ? P : never;
