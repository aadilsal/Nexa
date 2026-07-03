/** Keys that must never appear in analytics events or admin telemetry */
export const FORBIDDEN_ANALYTICS_KEYS = new Set([
  "amount",
  "salary",
  "income",
  "expense",
  "category",
  "merchant",
  "description",
  "balance",
  "safeToSpend",
  "safe_to_spend",
  "healthScore",
  "health_score",
  "goalName",
  "goal_name",
  "goalAmount",
  "goal_amount",
  "target",
  "targetAmount",
  "target_amount",
  "progress",
  "zakat",
  "charity",
  "startingBalance",
  "endingBalance",
  "encryptedPayload",
  "transaction",
  "transactions",
  "goals",
  "notes",
]);

export function sanitizeAnalyticsProperties(
  properties: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!properties) return {};

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (FORBIDDEN_ANALYTICS_KEYS.has(key)) continue;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = sanitizeAnalyticsProperties(
        value as Record<string, unknown>,
      );
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function assertNoForbiddenKeys(
  properties: Record<string, unknown> | undefined,
): void {
  if (!properties) return;
  for (const key of Object.keys(properties)) {
    if (FORBIDDEN_ANALYTICS_KEYS.has(key)) {
      throw new Error(`Forbidden analytics property: ${key}`);
    }
    const value = properties[key];
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      assertNoForbiddenKeys(value as Record<string, unknown>);
    }
  }
}
