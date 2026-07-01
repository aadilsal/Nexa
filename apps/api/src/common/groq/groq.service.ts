import { Injectable, Logger } from "@nestjs/common";

const EXPLAINER_SYSTEM_PROMPT = `You are Nexa's financial assistant for users in Pakistan (PKR currency).
Explain the provided calculated financial data in clear, encouraging language.
Never invent numbers. Only reference values provided in the JSON data.
Be concise, actionable, and supportive. Use PKR when mentioning amounts.
If data is insufficient, say so without guessing.`;

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
  ): Promise<string> {
    if (!this.apiKey) {
      return this.fallbackInsight(data);
    }

    const messages = [
      { role: "system" as const, content: EXPLAINER_SYSTEM_PROMPT },
      {
        role: "user" as const,
        content: `Data:\n${JSON.stringify(data, null, 2)}\n\n${
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
        return this.fallbackInsight(data);
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content?.trim();
      return this.sanitizeResponse(
        content || this.fallbackInsight(data),
        data,
      );
    } catch (err) {
      this.logger.warn(`Groq request failed: ${err}`);
      return this.fallbackInsight(data);
    }
  }

  async chat(
    data: unknown,
    message: string,
    history: Array<{ role: "user" | "assistant"; content: string }> = [],
  ): Promise<string> {
    if (!this.apiKey) {
      return "AI insights are temporarily unavailable. Your financial numbers on the dashboard are still accurate.";
    }

    const messages = [
      { role: "system" as const, content: EXPLAINER_SYSTEM_PROMPT },
      {
        role: "user" as const,
        content: `Current financial data:\n${JSON.stringify(data, null, 2)}`,
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
      return this.sanitizeResponse(
        json.choices?.[0]?.message?.content?.trim() ??
          "I couldn't generate a response. Please try again.",
        data,
      );
    } catch {
      return "I couldn't process that right now. Please try again shortly.";
    }
  }

  private fallbackInsight(data: unknown): string {
    const record = data as Record<string, unknown>;
    const sts = (record?.safeToSpend as { today?: number })?.today;
    const health = (record?.healthScore as { overall?: number })?.overall;

    if (sts != null && health != null) {
      return `You're in good shape today. Safe To Spend is PKR ${sts.toLocaleString("en-PK")} and your financial health score is ${health}/100.`;
    }

    return "Keep logging expenses to unlock personalized insights.";
  }

  private extractAllowedNumbers(data: unknown): Set<string> {
    const allowed = new Set<string>();
    const walk = (value: unknown) => {
      if (typeof value === "number" && Number.isFinite(value)) {
        allowed.add(String(Math.round(value)));
        allowed.add(value.toLocaleString("en-PK").replace(/,/g, ""));
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
    return text.replace(/\d[\d,]*(?:\.\d+)?/g, (match) => {
      const normalized = match.replace(/,/g, "");
      const asInt = String(Math.round(Number(normalized)));
      if (
        allowed.has(normalized) ||
        allowed.has(asInt) ||
        allowed.has(match)
      ) {
        return match;
      }
      return "[amount]";
    });
  }
}
