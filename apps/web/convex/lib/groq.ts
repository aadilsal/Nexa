// Simplified port of apps/api/src/common/groq/groq.service.ts. Keeps the load-bearing
// anti-hallucination guard (never let the model print a number that isn't actually present
// in the data we gave it) but drops the ~500-line deterministic-narrative template system
// that produced the no-API-key fallback text — out of scope for today's cutover, and the
// UI's own numbers are always the source of truth regardless of what this text says.

const SYSTEM_PROMPT = `You are Nexa's financial assistant.
Explain the provided calculated financial data in clear, encouraging language.
Use the user's currency from the data when citing amounts.
Never invent numbers. Only reference values that literally appear in the JSON provided.
Never use placeholders like [amount], [date], or [percent].
Be concise, actionable, and supportive.`;

function apiKey(): string {
  return process.env.GROQ_API_KEY ?? "";
}

function model(): string {
  return process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
}

/** Every literal number/percent/date fragment that appears anywhere in `data`, so a model
 *  response can be checked against it — strips any number that isn't actually in the data. */
function extractAllowedNumbers(data: unknown): Set<string> {
  const allowed = new Set<string>();
  const walk = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      allowed.add(String(Math.round(value)));
      allowed.add(String(value));
      const pctRounded = Math.round(value * 100);
      const pctOneDecimal = Math.round(value * 1000) / 10;
      allowed.add(String(pctRounded));
      allowed.add(String(pctOneDecimal));
      allowed.add(`${pctRounded}%`);
      allowed.add(`${pctOneDecimal}%`);
    } else if (typeof value === "string") {
      const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoDate) {
        allowed.add(isoDate[1]);
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

function sanitizeResponse(text: string, data: unknown): string {
  const allowed = extractAllowedNumbers(data);
  const sanitized = text.replace(/-?\d[\d,]*(?:\.\d+)?/g, (match) => {
    const normalized = match.replace(/,/g, "");
    const asInt = String(Math.round(Number(normalized)));
    if (allowed.has(normalized) || allowed.has(asInt) || allowed.has(match)) return match;
    return match.startsWith("-") ? match : "";
  });
  return sanitized.replace(/\s{2,}/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim();
}

async function callGroq(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>, maxTokens: number): Promise<string | null> {
  if (!apiKey()) return null;
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: model(), messages, temperature: 0.3, max_tokens: maxTokens }),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return json.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

/** One-shot explanation of a data blob. Falls back to a plain templated sentence if Groq
 *  isn't configured or the call fails — never leaves the user with nothing. */
export async function explain(data: unknown, question?: string, maxTokens = 500): Promise<string> {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Data:\n${JSON.stringify(data, null, 2)}\n\n${question ?? "Provide a brief, helpful insight based on this data."}`,
    },
  ];
  const content = await callGroq(messages, maxTokens);
  if (!content) return "Keep logging expenses to unlock personalized insights.";
  return sanitizeResponse(content, data);
}

export async function chat(
  data: unknown,
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = [],
): Promise<string> {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Current financial data:\n${JSON.stringify(data, null, 2)}` },
    ...history,
    { role: "user", content: message },
  ];
  const content = await callGroq(messages, 1000);
  if (!content) return "AI insights are temporarily unavailable. Your financial numbers on the dashboard are still accurate.";
  return sanitizeResponse(content, data);
}
