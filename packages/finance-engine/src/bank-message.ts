import type { Category, CurrencyCode, TransactionType } from "@nexa/shared";
import { matchCategory } from "./parser.js";

// Rule-based parser for bank / wallet alerts (SMS and email) used by the automatic import.
// Deliberately no AI: messages never leave the backend. Formats covered are the ones seen in
// the wild for Meezan, Allied Bank (myABL) and NayaPay, plus generic "sent/spent/received"
// phrasing that most Pakistani banks and wallets share. Anything unrecognised is reported as
// ignored (with a reason) rather than guessed at.

export type BankMessageResult =
  | {
      status: "transaction";
      type: TransactionType;
      amount: number;
      currency: CurrencyCode;
      description: string;
      category: Category;
      counterparty?: string;
    }
  | { status: "ignored"; reason: string };

export interface BankMessageOptions {
  /** Names your own accounts appear under (e.g. "A.SALMAN"). Transfers to/from these are skipped. */
  ownerAliases?: string[];
  defaultCurrency?: CurrencyCode;
}

const OTP_PATTERNS = [
  /\b(?:otp|one[- ]time (?:password|pin|code)|verification code|passcode)\b[\s\S]{0,80}?\b\d{4,8}\b/i,
  /\b\d{4,8}\b[\s\S]{0,30}\b(?:is|as) your (?:otp|code|one[- ]time)/i,
];

const AMOUNT_PATTERN = /\b(PKR|Rs|USD)\.?\s*([\d,]+(?:\.\d{1,2})?)|(\$)\s*([\d,]+(?:\.\d{1,2})?)/i;

const REFUND_PATTERN = /\b(?:revers(?:ed|al)|refund(?:ed)?)\b/i;
const FAILED_PATTERN = /\b(?:declined|failed|unsuccessful|rejected)\b/i;
const CREDIT_PATTERN = /\b(?:received|credited|deposited|you got|cash ?back)\b/i;
const DEBIT_PATTERN =
  /\b(?:sent|spent|debited|paid|purchased?|withdrawn|withdrawal|transferred|charged|deducted|subscribed|payment of|service charges)\b/i;
const MOBILE_PATTERN = /\bmobile (?:top-?up|bundle|load|package)\b/i;
const FEE_PATTERN = /\b(?:service charges?|fee|charges)\b/i;

// Words that end a name when reading it token by token out of free text.
const NAME_STOP_WORDS = new Set([
  "on", "at", "via", "through", "transaction", "branch", "ref", "reference", "account", "acc",
  "date", "time", "dated", "from", "to", "amount", "is", "has", "have", "was", "your", "with",
  "the", "for", "please", "rs", "pkr", "usd", "beneficiary", "sender", "fee", "fee/tax",
  "charged", "online", "and", "of", "in", "successful", "id", "card",
]);

function normalize(text: string): string {
  return text.replace(/\|/g, " ").replace(/\s+/g, " ").trim();
}

/** Reads up to five name-like tokens from the start of `text`. */
function takeName(text: string): string {
  const tokens = text.split(" ");
  const out: string[] = [];
  for (const raw of tokens) {
    const token = raw.replace(/[,;]+$/, "");
    if (out.length >= 5) break;
    if (!/^[A-Za-z][A-Za-z.'&*-]*$/.test(token)) break;
    if (/xxx/i.test(token)) break; // masked wallet suffix, e.g. "JAZZ-xxxCASH"
    if (NAME_STOP_WORDS.has(token.toLowerCase())) break;
    out.push(token);
  }
  return out.join(" ").replace(/[.*-]+$/, "").trim();
}

function after(text: string, pattern: RegExp): string {
  const match = pattern.exec(text);
  return match ? takeName(text.slice(match.index + match[0].length)) : "";
}

function findCounterparty(text: string, type: TransactionType): { name: string; kind: "transfer" | "merchant" | "sender" } | null {
  const labelled: Array<[RegExp, "transfer" | "sender"]> = [
    // Meezan writes "Beneficiary Account: : NAME" — tolerate repeated, spaced colons.
    [/Beneficiary Name(?:\s*:)+\s*/i, "transfer"],
    [/Beneficiary Account Title(?:\s*:)+\s*/i, "transfer"],
    [/Beneficiary Account(?:\s*:)+\s*/i, "transfer"],
    [/Sender Name(?:\s*:)+\s*/i, "sender"],
  ];
  for (const [pattern, kind] of labelled) {
    const name = after(text, pattern);
    if (name) return { name, kind };
  }

  if (type === "INCOME") {
    const name = after(text, /\b(?:received from|from)\s+/i);
    return name ? { name, kind: "sender" } : null;
  }

  const merchant = after(text, /\b(?:spent|purchase|paid)\b[^.]*?\b(?:at|to)\s+/i);
  if (merchant) return { name: merchant, kind: "merchant" };
  const transfer = after(text, /\b(?:sent to|transferred to|transfer to|paid to)\s+/i);
  if (transfer) return { name: transfer, kind: "transfer" };
  const at = after(text, /\bat\s+/i);
  return at ? { name: at, kind: "merchant" } : null;
}

function lettersOnly(value: string): string {
  return value.toUpperCase().replace(/[^A-Z]/g, "");
}

function isOwnAccount(name: string, aliases: string[]): boolean {
  const candidate = lettersOnly(name);
  if (!candidate) return false;
  return aliases.some((alias) => {
    const a = lettersOnly(alias);
    return a.length > 0 && (candidate === a || (a.length >= 6 && candidate.includes(a)));
  });
}

function tidyName(name: string): string {
  // Title-case shouty bank formatting ("IMAD MEHAR" -> "Imad Mehar"); leave mixed case alone.
  return name
    .split(" ")
    .map((w) => (w === w.toUpperCase() ? w.charAt(0) + w.slice(1).toLowerCase() : w))
    .join(" ");
}

export function parseBankMessage(rawText: string, options: BankMessageOptions = {}): BankMessageResult {
  const text = normalize(rawText);
  const aliases = options.ownerAliases ?? [];

  if (OTP_PATTERNS.some((p) => p.test(text))) return { status: "ignored", reason: "one-time code" };

  const amountMatch = AMOUNT_PATTERN.exec(text);
  if (!amountMatch) return { status: "ignored", reason: "no amount found" };
  const amount = Math.round(Number((amountMatch[2] ?? amountMatch[4]).replace(/,/g, "")));
  if (!Number.isFinite(amount) || amount <= 0) return { status: "ignored", reason: "no amount found" };
  const currencyToken = (amountMatch[1] ?? amountMatch[3]).toUpperCase();
  const currency: CurrencyCode =
    currencyToken === "USD" || currencyToken === "$" ? "USD" : currencyToken === "PKR" || currencyToken === "RS" ? "PKR" : (options.defaultCurrency ?? "PKR");

  const isRefund = REFUND_PATTERN.test(text);
  if (FAILED_PATTERN.test(text) && !isRefund) return { status: "ignored", reason: "failed or declined transaction" };

  let type: TransactionType;
  if (isRefund) {
    type = "INCOME";
  } else {
    const credit = CREDIT_PATTERN.exec(text);
    const debit = DEBIT_PATTERN.exec(text);
    if (!credit && !debit) return { status: "ignored", reason: "not a transaction alert" };
    type = credit && (!debit || credit.index < debit.index) ? "INCOME" : "EXPENSE";
  }

  const isMobile = MOBILE_PATTERN.test(text);
  const counterparty = isMobile ? null : findCounterparty(text, type);

  if (counterparty && isOwnAccount(counterparty.name, aliases)) {
    return { status: "ignored", reason: "transfer between your own accounts" };
  }

  const name = counterparty ? tidyName(counterparty.name) : undefined;
  let description: string;
  if (isRefund) description = isMobile ? "Refund: Mobile top-up" : name ? `Refund from ${name}` : "Refund";
  else if (isMobile) description = "Mobile top-up";
  else if (type === "INCOME") description = name ? `From ${name}` : "Money received";
  else if (!name) description = FEE_PATTERN.test(text) ? "Bank fee" : "Bank payment";
  else description = counterparty!.kind === "merchant" ? name : `Transfer to ${name}`;

  let category: Category;
  if (type === "INCOME") category = "INCOME";
  else if (isMobile) category = "UTILITIES";
  else category = matchCategory(description).category;

  return { status: "transaction", type, amount, currency, description, category, counterparty: name };
}
