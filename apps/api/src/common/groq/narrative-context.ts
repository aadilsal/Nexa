import {
  CATEGORY_LABELS,
  DEFAULT_CURRENCY,
  formatMoney,
  type Category,
  type CurrencyCode,
} from "@nexa/shared";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function parseCurrency(data: JsonRecord): CurrencyCode {
  const raw = data.currency;
  return typeof raw === "string" && raw.length === 3
    ? (raw as CurrencyCode)
    : DEFAULT_CURRENCY;
}

export function formatRatePercent(rate: number): string {
  const pct =
    Math.abs(rate) <= 1
      ? Math.round(rate * 1000) / 10
      : Math.round(rate * 10) / 10;
  const display =
    Number.isInteger(pct) ? String(Math.round(pct)) : String(pct);
  return `${display}%`;
}

function formatShortDate(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("en-PK", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

function categoryLabel(category: string | undefined): string | undefined {
  if (!category) return undefined;
  return CATEGORY_LABELS[category as Category] ?? category;
}

export interface NarrativeDisplayValues {
  itemName?: string;
  purchaseAmount?: string;
  recommendation?: string;
  savingsRateBefore?: string;
  savingsRateAfter?: string;
  emergencyFundDelayDays?: string;
  suggestedWaitUntil?: string;
  income?: string;
  spent?: string;
  saved?: string;
  savingsRatePercent?: string;
  savingsRateTargetPercent?: string;
  topCategory?: string;
  topCategoryAmount?: string;
  overallRating?: string;
  safeToSpendToday?: string;
  healthScore?: string;
  currentCash?: string;
  transactionAmount?: string;
  transactionDescription?: string;
}

export type NarrativeKind =
  | "purchase"
  | "weekly_review"
  | "monthly_review"
  | "engine"
  | "post_log"
  | "generic";

export function detectNarrativeKind(data: unknown): NarrativeKind {
  const record = asRecord(data);
  if (!record) return "generic";

  if (typeof record.itemName === "string" && record.impacts != null) {
    return "purchase";
  }
  if (typeof record.weekStart === "string" && typeof record.income === "number") {
    return "weekly_review";
  }
  if (
    typeof record.periodStart === "string" &&
    typeof record.expenses === "number"
  ) {
    return "monthly_review";
  }
  if (asRecord(record.postLog)) return "post_log";
  if (record.safeToSpend != null && record.cash != null) return "engine";
  return "generic";
}

export function buildDisplayValues(
  data: unknown,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): NarrativeDisplayValues {
  const record = asRecord(data);
  if (!record) return {};

  const resolvedCurrency = parseCurrency(record) ?? currency;
  const values: NarrativeDisplayValues = {};
  const impacts = asRecord(record.impacts);

  if (typeof record.itemName === "string") values.itemName = record.itemName;
  if (typeof record.amount === "number") {
    values.purchaseAmount = formatMoney(record.amount, resolvedCurrency);
  }
  if (typeof record.recommendation === "string") {
    values.recommendation = record.recommendation;
  }
  if (typeof record.suggestedWaitUntil === "string") {
    values.suggestedWaitUntil = formatShortDate(record.suggestedWaitUntil);
  }

  if (impacts) {
    if (typeof impacts.savingsRateBefore === "number") {
      values.savingsRateBefore = formatRatePercent(impacts.savingsRateBefore);
    }
    if (typeof impacts.savingsRateAfter === "number") {
      values.savingsRateAfter = formatRatePercent(impacts.savingsRateAfter);
    }
    if (typeof impacts.emergencyFundDelayDays === "number") {
      values.emergencyFundDelayDays = String(impacts.emergencyFundDelayDays);
    }
  }

  if (typeof record.income === "number") {
    values.income = formatMoney(record.income, resolvedCurrency);
  }
  if (typeof record.spent === "number") {
    values.spent = formatMoney(record.spent, resolvedCurrency);
  }
  if (typeof record.saved === "number") {
    values.saved = formatMoney(record.saved, resolvedCurrency);
  }
  if (typeof record.savings === "number") {
    values.saved = formatMoney(record.savings, resolvedCurrency);
  }
  if (typeof record.expenses === "number") {
    values.spent = formatMoney(record.expenses, resolvedCurrency);
  }

  if (typeof record.savingsRatePercent === "number") {
    values.savingsRatePercent = `${record.savingsRatePercent}%`;
  } else if (typeof record.savingsRate === "number") {
    values.savingsRatePercent = formatRatePercent(record.savingsRate);
  }

  if (typeof record.savingsRateTargetPercent === "number") {
    values.savingsRateTargetPercent = `${record.savingsRateTargetPercent}%`;
  } else if (typeof record.savingsRateTarget === "number") {
    values.savingsRateTargetPercent = formatRatePercent(
      record.savingsRateTarget,
    );
  }

  const topCategory = asRecord(record.highestSpendingCategory);
  if (topCategory) {
    values.topCategory = categoryLabel(topCategory.category as string);
    if (typeof topCategory.amount === "number") {
      values.topCategoryAmount = formatMoney(
        topCategory.amount,
        resolvedCurrency,
      );
    }
  }

  if (typeof record.overallRating === "string") {
    values.overallRating = record.overallRating.replace(/_/g, " ");
  }

  const safeToSpend = asRecord(record.safeToSpend);
  if (safeToSpend && typeof safeToSpend.today === "number") {
    values.safeToSpendToday = formatMoney(
      safeToSpend.today,
      resolvedCurrency,
    );
  }

  const healthScore = asRecord(record.healthScore);
  if (healthScore && typeof healthScore.overall === "number") {
    values.healthScore = `${healthScore.overall}/100`;
  } else if (typeof record.financialHealth === "number") {
    values.healthScore = `${record.financialHealth}/100`;
  }

  const cash = asRecord(record.cash);
  if (cash && typeof cash.currentCashAvailable === "number") {
    values.currentCash = formatMoney(
      cash.currentCashAvailable,
      resolvedCurrency,
    );
  }

  const postLog = asRecord(record.postLog);
  if (postLog) {
    const tx = asRecord(postLog.transaction);
    if (tx) {
      if (typeof tx.description === "string") {
        values.transactionDescription = tx.description;
      }
      if (typeof tx.amount === "number") {
        values.transactionAmount = formatMoney(tx.amount, resolvedCurrency);
      }
    }
  }

  return values;
}

export function enrichNarrativeData(
  data: unknown,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): JsonRecord {
  const record = asRecord(data) ?? {};
  const resolvedCurrency = parseCurrency(record) ?? currency;
  const displayValues = buildDisplayValues(record, resolvedCurrency);
  return {
    ...record,
    currency: resolvedCurrency,
    displayValues,
    narrativeKind: detectNarrativeKind(record),
  };
}

export function hasUnresolvedPlaceholders(text: string): boolean {
  return /\[(?:amount|date|percent|number)\]/i.test(text);
}

export function resolvePlaceholders(
  text: string,
  values: NarrativeDisplayValues,
): string {
  let result = text;

  if (values.suggestedWaitUntil) {
    result = result.replace(
      /\[amount\]\s*[-/]\s*\[amount\]\s*[-/]\s*\[amount\]/gi,
      values.suggestedWaitUntil,
    );
    result = result.replace(/\[date\]/gi, values.suggestedWaitUntil);
  }

  if (values.savingsRatePercent) {
    result = result.replace(/\[amount\]\s*%/gi, values.savingsRatePercent);
    result = result.replace(/\[percent\]/gi, values.savingsRatePercent);
  }

  if (values.savingsRateBefore) {
    result = result.replace(
      /\b0?\.\d+\b(?=\s+to)/i,
      values.savingsRateBefore,
    );
  }

  if (values.savingsRateAfter) {
    result = result.replace(
      /-\s*\[amount\]/gi,
      values.savingsRateAfter.startsWith("-")
        ? values.savingsRateAfter
        : `-${values.savingsRateAfter}`,
    );
  }

  if (values.itemName) {
    const modelNumber = values.itemName.match(/\d+/)?.[0];
    if (modelNumber) {
      result = result.replace(
        /((?:IPHONE|iPhone)\s*)\[amount\](\s*PRO)/gi,
        `$1${modelNumber}$2`,
      );
    }
  }

  const replacementQueue: string[] = [];
  if (values.purchaseAmount) replacementQueue.push(values.purchaseAmount);
  if (values.savingsRateAfter) replacementQueue.push(values.savingsRateAfter);
  if (values.savingsRateBefore) replacementQueue.push(values.savingsRateBefore);
  if (values.savingsRatePercent) replacementQueue.push(values.savingsRatePercent);
  if (values.suggestedWaitUntil) replacementQueue.push(values.suggestedWaitUntil);
  if (values.itemName) replacementQueue.push(values.itemName);
  if (values.income) replacementQueue.push(values.income);
  if (values.spent) replacementQueue.push(values.spent);
  if (values.saved) replacementQueue.push(values.saved);
  if (values.topCategoryAmount) replacementQueue.push(values.topCategoryAmount);

  for (const token of replacementQueue) {
    if (!/\[amount\]/i.test(result)) break;
    result = result.replace(/\[amount\]/i, token);
  }

  return result
    .replace(/\[amount\]/gi, "")
    .replace(/\[date\]/gi, values.suggestedWaitUntil ?? "")
    .replace(/\[percent\]/gi, values.savingsRatePercent ?? "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

export function buildDeterministicNarrative(
  data: unknown,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): string | null {
  const enriched = enrichNarrativeData(data, currency);
  const values = buildDisplayValues(enriched, currency);
  const kind = detectNarrativeKind(enriched);

  switch (kind) {
    case "purchase":
      return buildPurchaseNarrative(enriched, values);
    case "weekly_review":
      return buildWeeklyReviewNarrative(enriched, values);
    case "monthly_review":
      return buildMonthlyReviewNarrative(enriched, values);
    case "engine":
      return buildEngineNarrative(values);
    case "post_log":
      return buildPostLogNarrative(enriched, values);
    default:
      return null;
  }
}

function buildPurchaseNarrative(
  data: JsonRecord,
  values: NarrativeDisplayValues,
): string {
  const item = values.itemName ?? "this item";
  const amount = values.purchaseAmount ?? "the listed price";
  const action =
    values.recommendation === "GO_AHEAD" ? "GO AHEAD" : "WAIT";
  const parts = [
    `The recommendation is to ${action} for buying ${item} at ${amount}.`,
  ];

  if (values.savingsRateBefore && values.savingsRateAfter) {
    parts.push(
      `This purchase would change your savings rate from ${values.savingsRateBefore} to ${values.savingsRateAfter}.`,
    );
  }

  const impacts = asRecord(data.impacts);
  const delayDays =
    typeof impacts?.emergencyFundDelayDays === "number"
      ? impacts.emergencyFundDelayDays
      : 0;
  if (delayDays > 0) {
    parts.push(
      `It would delay your Emergency Fund goal by ${delayDays} day${delayDays === 1 ? "" : "s"}.`,
    );
  }

  const goalDelays = Array.isArray(impacts?.goalDelays)
    ? (impacts.goalDelays as Array<{ goalName: string; delayDays: number }>)
    : [];
  for (const goal of goalDelays) {
    if (goal.delayDays > 0 && goal.goalName !== "Emergency Fund") {
      parts.push(
        `Your ${goal.goalName} goal would be delayed by ${goal.delayDays} day${goal.delayDays === 1 ? "" : "s"}.`,
      );
    }
  }

  if (values.suggestedWaitUntil && action === "WAIT") {
    parts.push(
      `Consider waiting until ${values.suggestedWaitUntil} before revisiting this purchase.`,
    );
  }

  return parts.join(" ");
}

function buildWeeklyReviewNarrative(
  data: JsonRecord,
  values: NarrativeDisplayValues,
): string {
  const parts = [
    `You earned ${values.income ?? "income"} this week and spent ${values.spent ?? "expenses"}, saving ${values.saved ?? "the difference"}.`,
  ];

  if (values.topCategory && values.topCategoryAmount) {
    parts.push(
      `Your highest spending category was ${values.topCategory} at ${values.topCategoryAmount}.`,
    );
  }

  if (values.savingsRatePercent) {
    const beatTarget =
      typeof data.savingsRate === "number" &&
      typeof data.savingsRateTarget === "number" &&
      data.savingsRate >= data.savingsRateTarget;
    parts.push(
      beatTarget
        ? `You've achieved a savings rate of ${values.savingsRatePercent}, which meets or beats your target.`
        : `Your savings rate this week was ${values.savingsRatePercent}${values.savingsRateTargetPercent ? ` (target ${values.savingsRateTargetPercent})` : ""}.`,
    );
  }

  if (values.overallRating) {
    parts.push(
      `Your overall financial rating for the week is ${values.overallRating}.`,
    );
  }

  return parts.join(" ");
}

function buildMonthlyReviewNarrative(
  _data: JsonRecord,
  values: NarrativeDisplayValues,
): string {
  const parts = [
    `This month you earned ${values.income ?? "income"} and spent ${values.spent ?? "expenses"}, with net savings of ${values.saved ?? "the difference"}.`,
  ];

  if (values.savingsRatePercent) {
    parts.push(`Your savings rate was ${values.savingsRatePercent}.`);
  }

  if (values.healthScore) {
    parts.push(`Your financial health score is ${values.healthScore}.`);
  }

  return parts.join(" ");
}

function buildEngineNarrative(values: NarrativeDisplayValues): string {
  if (values.safeToSpendToday && values.healthScore) {
    return `You're in good shape today. Safe To Spend is ${values.safeToSpendToday} and your financial health score is ${values.healthScore}.`;
  }
  if (values.currentCash && values.safeToSpendToday) {
    return `You have ${values.currentCash} in cash. Safe To Spend today is ${values.safeToSpendToday}.`;
  }
  return "Keep logging expenses to unlock personalized insights.";
}

function buildPostLogNarrative(
  data: JsonRecord,
  values: NarrativeDisplayValues,
): string {
  const postLog = asRecord(data.postLog);
  const sts = asRecord(postLog?.safeToSpend);
  const health = asRecord(postLog?.healthScore);
  const desc = values.transactionDescription ?? "that transaction";
  const amount = values.transactionAmount ?? "the amount";

  const parts = [`Logged ${desc} for ${amount}.`];

  if (sts && typeof sts.before === "number" && typeof sts.after === "number") {
    const currency = parseCurrency(data);
    parts.push(
      `Safe To Spend moved from ${formatMoney(sts.before, currency)} to ${formatMoney(sts.after, currency)}.`,
    );
  }

  if (
    health &&
    typeof health.before === "number" &&
    typeof health.after === "number"
  ) {
    parts.push(
      `Your health score changed from ${health.before} to ${health.after}.`,
    );
  }

  return parts.join(" ");
}

export function finalizeNarrative(
  text: string,
  data: unknown,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): string {
  const enriched = enrichNarrativeData(data, currency);
  const values = buildDisplayValues(enriched, currency);
  const resolved = resolvePlaceholders(text, values);

  if (hasUnresolvedPlaceholders(resolved) || resolved.length < 12) {
    const deterministic = buildDeterministicNarrative(enriched, currency);
    if (deterministic) return deterministic;
  }

  return resolved;
}
