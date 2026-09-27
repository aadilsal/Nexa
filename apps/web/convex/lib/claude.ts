import Anthropic from "@anthropic-ai/sdk";
import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { sha256Hex } from "./crypto";

// Claude-backed explanations and chat (replaces the old Groq helper). Keeps the
// anti-hallucination guard: the model may only print numbers that literally appear in the
// data we gave it. Calls are kept few and small — low effort, short answers, and page-view
// driven summaries go through `cachedExplain` so the same data is never explained twice.

const MODEL = "claude-opus-5";
const MAX_TOKENS = 4000;

const SYSTEM_PROMPT = `You are Nexa's personal finance assistant for one person who wants to track spending and save more.
Explain the provided calculated financial data in plain, encouraging language, in a few short sentences.
Use the currency from the data when citing amounts.
Only reference numbers that literally appear in the JSON provided — never estimate or invent figures.
Give one concrete, practical next step when it helps.`;

const UNAVAILABLE = "AI insights are temporarily unavailable. Your numbers on the dashboard are still accurate.";

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
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

async function callClaude(messages: Anthropic.Beta.BetaMessageParam[]): Promise<string | null> {
  const anthropic = getClient();
  if (!anthropic) return null;
  try {
    const response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      output_config: { effort: "low" }, // short explanatory answers — keep token spend minimal
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages,
    });
    if (response.stop_reason === "refusal") return null;
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return text || null;
  } catch (error) {
    if (error instanceof Anthropic.APIError) console.error(`Claude API error ${error.status}: ${error.message}`);
    else console.error("Claude request failed", error);
    return null;
  }
}

/** Today's date in Pakistan time (YYYY-MM-DD) — the "once per day" component of cache keys. */
export function todayKey(): string {
  return new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** One-shot explanation of a data blob. */
export async function explain(data: unknown, question?: string): Promise<string> {
  const content = await callClaude([
    {
      role: "user",
      content: `Data:\n${JSON.stringify(data, null, 2)}\n\n${question ?? "Provide a brief, helpful insight based on this data."}`,
    },
  ]);
  return content ? sanitizeResponse(content, data) : UNAVAILABLE;
}

/** Like `explain`, but reuses a stored answer for the same scope + question + `keyData`
 *  (defaults to the data itself), so views that re-render don't pay for the same explanation
 *  again. Pass `keyData: null` to cache purely by scope (e.g. one insight per day). */
export async function cachedExplain(
  ctx: ActionCtx,
  scope: string,
  data: unknown,
  question: string,
  keyData: unknown = data,
): Promise<string> {
  const key = await sha256Hex(`${scope}\n${question}\n${JSON.stringify(keyData)}`);
  const hit = await ctx.runQuery(internal.lib.claude._getCached, { key });
  if (hit) return hit;
  const text = await explain(data, question);
  if (text !== UNAVAILABLE) await ctx.runMutation(internal.lib.claude._putCached, { key, text });
  return text;
}

export async function chat(
  data: unknown,
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = [],
): Promise<string> {
  const content = await callClaude([
    { role: "user", content: `Current financial data:\n${JSON.stringify(data, null, 2)}` },
    { role: "assistant", content: "Got it — I have your current numbers. What would you like to know?" },
    ...history.slice(-10), // recent turns only: enough context, bounded cost
    { role: "user", content: message },
  ]);
  return content ? sanitizeResponse(content, data) : UNAVAILABLE;
}

export const _getCached = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const row = await ctx.db.query("aiCache").withIndex("by_key", (q) => q.eq("key", key)).first();
    return row?.text ?? null;
  },
});

export const _putCached = internalMutation({
  args: { key: v.string(), text: v.string() },
  handler: async (ctx, { key, text }) => {
    const existing = await ctx.db.query("aiCache").withIndex("by_key", (q) => q.eq("key", key)).first();
    if (!existing) await ctx.db.insert("aiCache", { key, text, createdAt: Date.now() });
  },
});
