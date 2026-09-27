import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import * as claude from "./lib/claude";

// Ported from apps/api/src/modules/{ai,insights}/*.ts, condensed (see lib/claude.ts for what
// was dropped). Rate limiting on AI calls is dropped for the single-owner app.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function slimOutput(output: any) {
  return {
    safeToSpend: output.safeToSpend,
    healthScore: output.healthScore,
    cash: output.cash,
    savings: {
      ...output.savings,
      actualRatePercent: Math.round(output.savings.actualRate * 100),
      targetRatePercent: Math.round(output.savings.targetRate * 100),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    goals: output.goals.map((g: any) => ({ name: g.name, progress: g.progress, onTrack: g.onTrack, eta: g.eta })),
    cycle: { daysRemaining: output.cycle.daysRemaining },
    currency: output.currency,
  };
}

export const insight = action({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const output = await ctx.runQuery(api.engine.get, { sessionToken });
    if (!output) return { insight: "Set up your first financial cycle to unlock insights." };
    const text = await claude.cachedExplain(ctx, "daily-insight", slimOutput(output), "Write today's brief financial insight.", claude.todayKey());
    return { insight: text };
  },
});

export const chat = action({
  args: {
    sessionToken: v.string(),
    message: v.string(),
    history: v.optional(v.array(v.object({ role: v.union(v.literal("user"), v.literal("assistant")), content: v.string() }))),
  },
  handler: async (ctx, { sessionToken, message, history }) => {
    const output = await ctx.runQuery(api.engine.get, { sessionToken });
    const reply = await claude.chat(output ? slimOutput(output) : { note: "No active cycle yet." }, message, history ?? []);
    return { reply };
  },
});
