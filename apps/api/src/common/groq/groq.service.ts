import { Injectable, Logger } from "@nestjs/common";
import { DEFAULT_CURRENCY, formatMoney, type CurrencyCode } from "@nexa/shared";
import {
  buildDeterministicNarrative,
  enrichNarrativeData,
  finalizeNarrative,
  formatRatePercent,
} from "./narrative-context";

const EXPLAINER_SYSTEM_PROMPT = `You are Nexa's financial assistant.
Explain the provided calculated financial data in clear, encouraging language.
Use the user's currency from the data when citing amounts.
Never invent numbers. Only reference values from displayValues in the JSON — copy those strings exactly when citing amounts, rates, or dates.
Never use placeholders like [amount], [date], or [percent].
Be concise, actionable, and supportive.`;

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private readonly apiKey = process.env.GROQ_API_KEY ?? "";
  private readonly model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async explain(
    data: unknown,
    userQuestion?: string,
    maxTokens = 500,
    currency: CurrencyCode = DEFAULT_CURRENCY,
  ): Promise<string> {
    const enriched = enrichNarrativeData(data, currency);
    const resolvedCurrency = (enriched.currency as CurrencyCode) ?? currency;
    const deterministic =
      buildDeterministicNarrative(enriched, resolvedCurrency) ??
      this.fallbackInsight(enriched);

    if (!this.apiKey) {
      return deterministic;
    }

    const messages = [
      { role: "system" as const, content: EXPLAINER_SYSTEM_PROMPT },
      {
        role: "user" as const,
        content: `Data:\n${JSON.stringify(enriched, null, 2)}\n\n${
          userQuestion
            ? `Question: ${userQuestion}`
            : "Provide a brief, helpful insight based on this data."
        }`,
      },
    ];

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            messages,
            temperature: 0.3,
            max_tokens: maxTokens,
          }),
        },
      );

      if (!response.ok) {
        this.logger.warn(`Groq API error: ${response.status}`);
        return deterministic;
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content?.trim();
      if (!content) return deterministic;

      const sanitized = this.sanitizeResponse(content, enriched);
      return finalizeNarrative(sanitized, enriched, resolvedCurrency);
    } catch (err) {
      this.logger.warn(`Groq request failed: ${err}`);
      return deterministic;
    }
  }

  async chat(
    data: unknown,
    message: string,
    history: Array<{ role: "user" | "assistant"; content: string }> = [],
    currency: CurrencyCode = DEFAULT_CURRENCY,
  ): Promise<string> {
    const enriched = enrichNarrativeData(data, currency);
    const resolvedCurrency = (enriched.currency as CurrencyCode) ?? currency;
    const fallback =
      "AI insights are temporarily unavailable. Your financial numbers on the dashboard are still accurate.";

    if (!this.apiKey) {
      return fallback;
    }

    const messages = [
      { role: "system" as const, content: EXPLAINER_SYSTEM_PROMPT },
      {
        role: "user" as const,
        content: `Current financial data:\n${JSON.stringify(enriched, null, 2)}`,
      },
      ...history.map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user" as const, content: message },
    ];

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            messages,
            temperature: 0.3,
            max_tokens: 1000,
          }),
        },
      );

      if (!response.ok) {
        return "I couldn't process that right now. Please try again shortly.";
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content?.trim();
      if (!content) {
        return "I couldn't generate a response. Please try again.";
      }

      const sanitized = this.sanitizeResponse(content, enriched);
      return finalizeNarrative(sanitized, enriched, resolvedCurrency);
    } catch {
      return "I couldn't process that right now. Please try again shortly.";
    }
  }

  private fallbackInsight(data: unknown): string {
    const deterministic = buildDeterministicNarrative(data);
    if (deterministic) return deterministic;

    const record = data as Record<string, unknown>;
    const sts = (record?.safeToSpend as { today?: number })?.today;
    const health = (record?.healthScore as { overall?: number })?.overall;

    if (sts != null && health != null) {
      const currency =
        ((record?.currency as CurrencyCode | undefined) ?? DEFAULT_CURRENCY);
      return `You're in good shape today. Safe To Spend is ${formatMoney(sts, currency)} and your financial health score is ${health}/100.`;
    }

    return "Keep logging expenses to unlock personalized insights.";
  }

  private extractAllowedNumbers(data: unknown): Set<string> {
    const allowed = new Set<string>();
    const walk = (value: unknown) => {
      if (typeof value === "number" && Number.isFinite(value)) {
        const rounded = Math.round(value);
        allowed.add(String(rounded));
        allowed.add(String(value));
        allowed.add(value.toLocaleString("en-PK").replace(/,/g, ""));
        allowed.add(formatRatePercent(value).replace("%", ""));

        const pctRounded = Math.round(value * 100);
        const pctOneDecimal = Math.round(value * 1000) / 10;
        allowed.add(String(pctRounded));
        allowed.add(String(pctOneDecimal));
        allowed.add(`${pctRounded}%`);
        allowed.add(`${pctOneDecimal}%`);
      } else if (typeof value === "string") {
        const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoDate) {
          allowed.add(isoDate[1]!);
          allowed.add(String(Number(isoDate[2])));
          allowed.add(String(Number(isoDate[3])));
        }

        const numbers = value.match(/-?\d[\d,]*(?:\.\d+)?/g);
        numbers?.forEach((match) => {
          const normalized = match.replace(/,/g, "");
          allowed.add(normalized);
          allowed.add(String(Math.round(Number(normalized))));
        });
      } else if (Array.isArray(value)) {
        value.forEach(walk);
      } else if (value && typeof value === "object") {
        Object.values(value).forEach(walk);
      }
    };
    walk(data);
    return allowed;
  }

  private sanitizeResponse(text: string, data: unknown): string {
    const allowed = this.extractAllowedNumbers(data);
    const sanitized = text.replace(/-?\d[\d,]*(?:\.\d+)?/g, (match) => {
      const normalized = match.replace(/,/g, "");
      const asInt = String(Math.round(Number(normalized)));
      if (
        allowed.has(normalized) ||
        allowed.has(asInt) ||
        allowed.has(match)
      ) {
        return match;
      }
      return match.startsWith("-") ? match : "";
    });

    return sanitized
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,.;:!?])/g, "$1")
      .trim();
  }
}
