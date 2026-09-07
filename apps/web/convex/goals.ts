import { v } from "convex/values";
import { query, mutation, action, internalQuery, internalMutation } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { requireSession } from "./lib/session";
import { encryptNumber, decryptNumber } from "./lib/crypto";
import { getDekForRead, getOrCreateDekForAction } from "./lib/dek";

// Ported from apps/api/src/modules/goals/goals.service.ts. Single-owner: no userId scoping.

const priorityValidator = v.union(
  v.literal("EMERGENCY_FUND"),
  v.literal("HIGH"),
  v.literal("MEDIUM"),
  v.literal("LOW"),
);

/** Plain function so query-context callers (engine.ts) can reuse it directly. */
export async function listActiveRaw(ctx: QueryCtx) {
  return ctx.db
    .query("goals")
    .withIndex("by_isActive", (q) => q.eq("isActive", true))
    .collect();
}

/** Action-context callers (cycles.ts) go through this instead. */
export const _listActive = internalQuery({
  args: {},
  handler: async (ctx) => listActiveRaw(ctx),
});

export const list = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireSession(ctx, sessionToken);
    const dek = await getDekForRead(ctx);
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    const mapped = await Promise.all(
      goals.map(async (goal) => {
        const targetAmount = await decryptNumber(goal.encryptedTargetAmount, dek);
        const currentAmount = goal.encryptedCurrentAmount
          ? await decryptNumber(goal.encryptedCurrentAmount, dek)
          : 0;
        return {
          id: goal._id,
          name: goal.name,
          priority: goal.priority,
          targetAmount,
          currentAmount,
          progress: targetAmount > 0 ? Math.round((currentAmount / targetAmount) * 100) : 0,
          targetDate: goal.targetDate,
          isEmergencyFund: goal.isEmergencyFund,
        };
      }),
    );

    return mapped.sort((a, b) => {
      const order = { EMERGENCY_FUND: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;
      const p = order[a.priority as keyof typeof order] - order[b.priority as keyof typeof order];
      return p !== 0 ? p : a.targetDate - b.targetDate;
    });
  },
});

export const _insert = internalMutation({
  args: {
    name: v.string(),
    priority: priorityValidator,
    targetDate: v.number(),
    currency: v.string(),
    isEmergencyFund: v.boolean(),
    encryptedTargetAmount: v.string(),
    encryptedCurrentAmount: v.string(),
  },
  handler: async (ctx, args) =>
    ctx.db.insert("goals", { ...args, isActive: true, createdAt: Date.now() }),
});

export const create = action({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    priority: priorityValidator,
    targetDate: v.number(),
    currency: v.string(),
    targetAmount: v.number(),
    isEmergencyFund: v.optional(v.boolean()),
  },
  handler: async (ctx, { sessionToken, targetAmount, ...input }): Promise<{ id: Id<"goals">; name: string }> => {
    await ctx.runQuery(internal.lib.session._requireSession, { sessionToken });
    const dek = await getOrCreateDekForAction(ctx);
    const id = await ctx.runMutation(internal.goals._insert, {
      ...input,
      isEmergencyFund: input.isEmergencyFund ?? false,
      encryptedTargetAmount: await encryptNumber(targetAmount, dek),
      encryptedCurrentAmount: await encryptNumber(0, dek),
    });
    return { id, name: input.name };
  },
});

export const _patch = internalMutation({
  args: {
    id: v.id("goals"),
    name: v.optional(v.string()),
    priority: v.optional(priorityValidator),
    targetDate: v.optional(v.number()),
    encryptedTargetAmount: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...patch }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Goal not found");
    const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    await ctx.db.patch(id, clean);
  },
});

export const update = action({
  args: {
    sessionToken: v.string(),
    id: v.id("goals"),
    name: v.optional(v.string()),
    priority: v.optional(priorityValidator),
    targetDate: v.optional(v.number()),
    targetAmount: v.optional(v.number()),
  },
  handler: async (ctx, { sessionToken, id, targetAmount, ...rest }): Promise<{ id: Id<"goals"> }> => {
    await ctx.runQuery(internal.lib.session._requireSession, { sessionToken });
    let encryptedTargetAmount: string | undefined;
    if (targetAmount != null) {
      const dek = await getOrCreateDekForAction(ctx);
      encryptedTargetAmount = await encryptNumber(targetAmount, dek);
    }
    await ctx.runMutation(internal.goals._patch, { id, ...rest, encryptedTargetAmount });
    return { id };
  },
});

/** Soft-delete — no encryption involved, plain mutation. */
export const remove = mutation({
  args: { sessionToken: v.string(), id: v.id("goals") },
  handler: async (ctx, { sessionToken, id }) => {
    await requireSession(ctx, sessionToken);
    const goal = await ctx.db.get(id);
    if (!goal) throw new Error("Goal not found");
    await ctx.db.patch(id, { isActive: false });
    return { success: true };
  },
});
