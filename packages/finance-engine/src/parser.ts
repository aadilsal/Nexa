import type { Category, CurrencyCode, TransactionType } from "@nexa/shared";
import {
  CATEGORY_KEYWORDS,
  INCOME_KEYWORDS,
  normalizeCurrency,
} from "@nexa/shared";

export interface ParsedTransactionResult {
  description: string;
  amount: number;
  category: Category;
  type: TransactionType;
  currency?: CurrencyCode;
  confidence: number;
}

function extractAmount(
  input: string,
): { amount: number; text: string; currency?: CurrencyCode } | null {
  const eurPrefix = input.match(
    /^€\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s+(.+)$/i,
  );
  if (eurPrefix) {
    return {
      amount: parseInt(eurPrefix[1].replace(/,/g, ""), 10),
      text: eurPrefix[2].trim(),
      currency: "EUR",
    };
  }

  const gbpPrefix = input.match(
    /^£\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s+(.+)$/i,
  );
  if (gbpPrefix) {
    return {
      amount: parseInt(gbpPrefix[1].replace(/,/g, ""), 10),
      text: gbpPrefix[2].trim(),
      currency: "GBP",
    };
  }

  const usdPrefix = input.match(
    /^\$\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s+(.+)$/i,
  );
  if (usdPrefix) {
    return {
      amount: parseInt(usdPrefix[1].replace(/,/g, ""), 10),
      text: usdPrefix[2].trim(),
      currency: "USD",
    };
  }

  const usdSuffix = input.match(
    /^(.+?)\s+(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:usd|\$)\s*$/i,
  );
  if (usdSuffix) {
    return {
      text: usdSuffix[1].trim(),
      amount: parseInt(usdSuffix[2].replace(/,/g, ""), 10),
      currency: "USD",
    };
  }

  const usdWordPrefix = input.match(
    /^usd\s+(\d+(?:,\d{3})*(?:\.\d+)?)\s+(.+)$/i,
  );
  if (usdWordPrefix) {
    return {
      amount: parseInt(usdWordPrefix[1].replace(/,/g, ""), 10),
      text: usdWordPrefix[2].trim(),
      currency: "USD",
    };
  }

  const amountAtEnd = input.match(/^(.+?)\s+(\d+(?:,\d{3})*(?:\.\d+)?)\s*$/i);
  if (amountAtEnd) {
    return {
      text: amountAtEnd[1].trim(),
      amount: parseInt(amountAtEnd[2].replace(/,/g, ""), 10),
    };
  }

  const amountAtStart = input.match(/^(\d+(?:,\d{3})*(?:\.\d+)?)\s+(.+)$/i);
  if (amountAtStart) {
    return {
      text: amountAtStart[2].trim(),
      amount: parseInt(amountAtStart[1].replace(/,/g, ""), 10),
    };
  }

  return null;
}

export function matchCategory(description: string): { category: Category; confidence: number } {
  const normalized = description.toLowerCase().trim();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "OTHER" || category === "INCOME") continue;

    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return { category: category as Category, confidence: 0.9 };
      }
    }
  }

  return { category: "OTHER", confidence: 0.5 };
}

function isIncomeDescription(description: string): boolean {
  const normalized = description.toLowerCase();
  return INCOME_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function parseTransactionInput(
  rawInput: string,
  defaultCurrency: CurrencyCode = "PKR",
): ParsedTransactionResult {
  const trimmed = rawInput.trim();
  const extracted = extractAmount(trimmed);

  if (!extracted || extracted.amount <= 0 || !extracted.text) {
    throw new Error("Could not parse transaction. Use format: 'Description 5000'");
  }

  const currency = normalizeCurrency(
    extracted.currency ?? defaultCurrency,
    defaultCurrency,
  );
  const isIncome = isIncomeDescription(extracted.text);

  if (isIncome) {
    return {
      description: extracted.text,
      amount: extracted.amount,
      category: "INCOME",
      type: "INCOME",
      currency,
      confidence: 0.95,
    };
  }

  const { category, confidence } = matchCategory(extracted.text);

  return {
    description: extracted.text,
    amount: extracted.amount,
    category,
    type: "EXPENSE",
    currency,
    confidence,
  };
}
