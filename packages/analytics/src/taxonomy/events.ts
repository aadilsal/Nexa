export const ANALYTICS_EVENTS = [
  "page_viewed",
  "session_started",
  "session_ended",
  "signup_completed",
  "onboarding_completed",
  "dashboard_viewed",
  "ai_insight_viewed",
  "transaction_logged",
  "transaction_recategorized",
  "simulation_run",
  "ai_chat_message_sent",
  "weekly_review_opened",
  "data_exported",
  "account_deleted",
  "button_clicked",
  "error_occurred",
  "support_ticket_created",
  "goal_created",
  "safe_to_spend_viewed",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export interface AnalyticsEventPayload {
  event: AnalyticsEventName | string;
  properties?: Record<string, string | number | boolean | null>;
  route?: string;
  referrer?: string;
  appVersion?: string;
  platform?: string;
  browser?: string;
  os?: string;
  deviceType?: string;
  sessionId?: string;
  timestamp?: string;
}
