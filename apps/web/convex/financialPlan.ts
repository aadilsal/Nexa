import { v } from "convex/values";
import { query, mutation, action, internalQuery, internalMutation } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { requireSession } from "./lib/session";
import { encryptNumber, decryptNumber } from "./lib/crypto";
import { getDekForRead, getOrCreateDekForAction } from "./lib/dek";

// Ported from apps/api/src/modules/financial-plan/financial-plan.service.ts.
// (Variable-estimate lives on settings.ts since it's part of the userSettings singleton.)

const categoryValidator = v.union(
  v.literal("FOOD"), v.literal("FUEL"), v.literal("SHOPPING"), v.literal("ENTERTAINMENT"),
  v.literal("UTILITIES"), v.literal("HEALTHCARE"), v.literal("TRANSPORT"), v.literal("HOUSING"),
  v.literal("EDUCATION"), v.literal("CHARITY"), v.literal("INVESTMENT"), v.literal("INCOME"),
  v.literal("OTHER"),
);

export async function listFixedExpensesRaw(ctx: QueryCtx) {
  return ctx.db.query("fixedExpenses").collect();
}

export async function listIncomeExpectationsRaw(ctx: QueryCtx) {
  return ctx.db.query("incomeExpectations").collect();
}

export const list = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireSession(ctx, sessionToken);
    const dek = await getDekForRead(ctx);
    const [fixedExpenses, incomeExpectations] = await Promise.all([
      ctx.db.query("fixedExpenses").collect(),
      ctx.db.query("incomeExpectations").collect(),
    ]);
    return {
      fixedExpenses: await Promise.all(
        fixedExpenses.map(async (e) => ({
          id: e._id,
          name: e.name,
          category: e.category,
          currency: e.currency,
          autoLogOnCycleStart: e.autoLogOnCycleStart ?? false,
          expectedAmount: await decryptNumber(e.encryptedExpectedAmount, dek),
        })),
      ),
      incomeExpectations: await Promise.all(
        incomeExpectations.map(async (i) => ({
          id: i._id,
          name: i.name,
          currency: i.currency,
          expectedAmount: await decryptNumber(i.encryptedExpectedAmount, dek),
        })),
      ),
    };
  },
});

// ─── Fixed expenses ─────────────────────────────────────────────────────

export const _insertFixedExpense = internalMutation({
  args: {
    name: v.string(),
    category: categoryValidator,
    currency: v.string(),
    encryptedExpectedAmount: v.string(),
    autoLogOnCycleStart: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => ctx.db.insert("fixedExpenses", { ...args, createdAt: Date.now() }),
});

export const createFixedExpense = action({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    category: categoryValidator,
    currency: v.string(),
    expectedAmount: v.number(),
    autoLogOnCycleStart: v.optional(v.boolean()),
  },
  handler: async (ctx, { sessionToken, expectedAmount, ...input }): Promise<{ id: Id<"fixedExpenses">; name: string }> => {
    await ctx.runQuery(internal.lib.session._requireSession, { sessionToken });
    const dek = await getOrCreateDekForAction(ctx);
    const id = await ctx.runMutation(internal.financialPlan._insertFixedExpense, {
      ...input,
      encryptedExpectedAmount: await encryptNumber(expectedAmount, dek),
    });
    return { id, name: input.name };
  },
});

export const _patchFixedExpense = internalMutation({
  args: { id: v.id("fixedExpenses"), encryptedExpectedAmount: v.string() },
  handler: async (ctx, { id, encryptedExpectedAmount }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Fixed expense not found");
    await ctx.db.patch(id, { encryptedExpectedAmount });
  },
});

export const updateFixedExpense = action({
  args: { sessionToken: v.string(), id: v.id("fixedExpenses"), expectedAmount: v.number() },
  handler: async (ctx, { sessionToken, id, expectedAmount }): Promise<{ id: Id<"fixedExpenses"> }> => {
    await ctx.runQuery(internal.lib.session._requireSession, { sessionToken });
    const dek = await getOrCreateDekForAction(ctx);
    await ctx.runMutation(internal.financialPlan._patchFixedExpense, {
      id,
      encryptedExpectedAmount: await encryptNumber(expectedAmount, dek),
    });
    return { id };
  },
});

export const deleteFixedExpense = mutation({
  args: { sessionToken: v.string(), id: v.id("fixedExpenses") },
  handler: async (ctx, { sessionToken, id }) => {
    await requireSession(ctx, sessionToken);
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Fixed expense not found");
    await ctx.db.delete(id);
    return { success: true };
  },
});

// ─── Income expectations ────────────────────────────────────────────────

export const _insertIncomeExpectation = internalMutation({
  args: { name: v.string(), currency: v.string(), encryptedExpectedAmount: v.string() },
  handler: async (ctx, args) =>
    ctx.db.insert("incomeExpectations", { ...args, createdAt: Date.now() }),
});

export const createIncomeExpectation = action({
  args: { sessionToken: v.string(), name: v.string(), currency: v.string(), expectedAmount: v.number() },
  handler: async (ctx, { sessionToken, expectedAmount, ...input }): Promise<{ id: Id<"incomeExpectations">; name: string }> => {
    await ctx.runQuery(internal.lib.session._requireSession, { sessionToken });
    const dek = await getOrCreateDekForAction(ctx);
    const id = await ctx.runMutation(internal.financialPlan._insertIncomeExpectation, {
      ...input,
      encryptedExpectedAmount: await encryptNumber(expectedAmount, dek),
    });
    return { id, name: input.name };
  },
});

export const _patchIncomeExpectation = internalMutation({
  args: { id: v.id("incomeExpectations"), encryptedExpectedAmount: v.string() },
  handler: async (ctx, { id, encryptedExpectedAmount }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Income source not found");
    await ctx.db.patch(id, { encryptedExpectedAmount });
  },
});

export const updateIncomeExpectation = action({
  args: { sessionToken: v.string(), id: v.id("incomeExpectations"), expectedAmount: v.number() },
  handler: async (ctx, { sessionToken, id, expectedAmount }): Promise<{ id: Id<"incomeExpectations"> }> => {
    await ctx.runQuery(internal.lib.session._requireSession, { sessionToken });
    const dek = await getOrCreateDekForAction(ctx);
    await ctx.runMutation(internal.financialPlan._patchIncomeExpectation, {
      id,
      encryptedExpectedAmount: await encryptNumber(expectedAmount, dek),
    });
    return { id };
  },
});

export const deleteIncomeExpectation = mutation({
  args: { sessionToken: v.string(), id: v.id("incomeExpectations") },
  handler: async (ctx, { sessionToken, id }) => {
    await requireSession(ctx, sessionToken);
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Income source not found");
    await ctx.db.delete(id);
    return { success: true };
  },
});
