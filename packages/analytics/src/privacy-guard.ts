const FORBIDDEN_KEYS = new Set([
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
  "notes",
]);

export function sanitizeProperties(
  properties?: Record<string, string | number | boolean | null>,
): Record<string, string | number | boolean | null> {
  if (!properties) return {};

  const sanitized: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    sanitized[key] = value;
  }
  return sanitized;
}

export function assertNoForbiddenKeys(
  properties?: Record<string, unknown>,
): void {
  if (!properties) return;
  for (const key of Object.keys(properties)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new Error(`Forbidden analytics property: ${key}`);
    }
  }
}
