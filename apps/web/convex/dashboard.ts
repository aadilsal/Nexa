import { v } from "convex/values";
import { query } from "./_generated/server";
import { calculateEngineOutput } from "@nexa/finance-engine";
import { requireSession } from "./lib/session";
import { getCurrencyContext } from "./currencies";
import { buildEngineInput } from "./engine";

// Ported from apps/api/src/modules/dashboard/dashboard.service.ts — thin views over the
// engine output. (The old Redis-based per-endpoint rate limiting is dropped: with only one
// authenticated owner, there's no abuse surface left to rate-limit here.)

export const get = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireSession(ctx, sessionToken);
    const input = await buildEngineInput(ctx);
    if (!input) return null;
    const currencyCtx = await getCurrencyContext(ctx);
    return { ...calculateEngineOutput(input), currency: currencyCtx.primaryCurrency };
  },
});

export const safeToSpend = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireSession(ctx, sessionToken);
    const input = await buildEngineInput(ctx);
    if (!input) return null;
    return calculateEngineOutput(input).safeToSpend;
  },
});

export const healthScore = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireSession(ctx, sessionToken);
    const input = await buildEngineInput(ctx);
    if (!input) return null;
    return calculateEngineOutput(input).healthScore;
  },
});
