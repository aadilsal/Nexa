import { v } from "convex/values";
import { query, action, internalQuery } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { parseTransactionInput, getPeriodBounds, type ReportPeriod } from "@nexa/finance-engine";
import { normalizeCurrency, CATEGORIES, type Category } from "@nexa/shared";
import { requireSession } from "./lib/session";
import { appendEvent, getEffectiveTransactionsRaw, getEffectiveTransactionsInRangeRaw, type TransactionPayload } from "./ledger";
import { getActiveOrPendingRaw } from "./cycles";
import { getCurrencyContext } from "./currencies";

// Ported from apps/api/src/modules/transactions/transactions.{service,controller}.ts.
// (Per-user rate limiting on transaction creation is dropped for the single-owner app —
// see the same note in dashboard.ts.)

const categoryValidator = v.union(...CATEGORIES.map((c) => v.literal(c)));
const typeValidator = v.union(v.literal("INCOME"), v.literal("EXPENSE"));

export const parse = query({
  args: { sessionToken: v.string(), rawInput: v.string(), currency: v.optional(v.string()) },
  handler: async (ctx, { sessionToken, rawInput, currency }) => {
    await requireSession(ctx, sessionToken);
    const ctxCurrency = await getCurrencyContext(ctx);
    const defaultCurrency = normalizeCurrency(currency, ctxCurrency.primaryCurrency);
    try {
      return parseTransactionInput(rawInput, defaultCurrency);
    } catch {
      throw new Error("Could not parse transaction. Use format: 'Description 5000' or '$500 Description'");
    }
  },
});

async function findEffectiveByEventId(ctx: QueryCtx, cycleId: Id<"financialCycles">, eventId: Id<"transactionEvents">) {
  const transactions = await getEffectiveTransactionsRaw(ctx, cycleId);
  return transactions.find((tx) => tx.eventId === eventId);
}

export const _findByEventId = internalQuery({
  args: { cycleId: v.id("financialCycles"), eventId: v.id("transactionEvents") },
  handler: async (ctx, { cycleId, eventId }) => findEffectiveByEventId(ctx, cycleId, eventId) ?? null,
});

export const create = action({
  args: {
    sessionToken: v.string(),
    rawInput: v.optional(v.string()),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    category: v.optional(categoryValidator),
    type: v.optional(typeValidator),
    currency: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { sessionToken, rawInput, description, amount, category, type, currency },
  ): Promise<{
    transaction: TransactionPayload & { eventId: Id<"transactionEvents"> };
    cash: { before: number; after: number };
    safeToSpend: unknown;
    healthScore: unknown;
    goalImpact: unknown;
  }> => {
    await ctx.runQuery(internal.lib.session._requireSession, { sessionToken });
    await ctx.runAction(api.cycles.ensureCurrentCycle, { sessionToken });
    const cycle = await ctx.runQuery(internal.cycles._getActiveOrPending, {});
    if (!cycle) throw new Error("No active cycle.");

    const primaryCurrency = await ctx.runQuery(internal.engine._getPrimaryCurrency, {});

    let parsed: { description: string; amount: number; category: Category; type: "INCOME" | "EXPENSE"; currency: string };
    if (rawInput) {
      const defaultCurrency = normalizeCurrency(currency, primaryCurrency);
      try {
        const p = parseTransactionInput(rawInput, defaultCurrency);
        parsed = { ...p, currency: p.currency ?? defaultCurrency };
      } catch {
        throw new Error("Could not parse transaction. Use format: 'Description 5000' or '$500 Description'");
      }
    } else if (description && amount && category && type) {
      parsed = { description, amount, category, type, currency: normalizeCurrency(currency, primaryCurrency) };
    } else {
      throw new Error("Provide rawInput or full transaction fields");
    }

    const txCurrency = normalizeCurrency(currency ?? parsed.currency, primaryCurrency);

    const event = await appendEvent(ctx, {
      cycleId: cycle._id,
      eventType: "CREATE",
      payload: {
        description: parsed.description,
        amount: parsed.amount,
        category: parsed.category,
        type: parsed.type,
        currency: txCurrency,
      },
    });

    const diff = await ctx.runQuery(internal.engine._diffForNewTransaction, {});

    return {
      transaction: { eventId: event.eventId, ...parsed, currency: txCurrency },
      cash: diff.cash,
      safeToSpend: diff.safeToSpend,
      healthScore: diff.healthScore,
      goalImpact: diff.goalImpact,
    };
  },
});

export const list = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireSession(ctx, sessionToken);
    const cycle = await getActiveOrPendingRaw(ctx);
    if (!cycle) return [];
    const transactions = await getEffectiveTransactionsRaw(ctx, cycle._id);
    return transactions.map((tx) => ({
      id: tx.eventId,
      description: tx.description,
      amount: tx.amount,
      currency: normalizeCurrency(tx.currency),
      category: tx.category,
      type: tx.type,
      createdAt: tx.createdAt,
    }));
  },
});

export const history = query({
  args: {
    sessionToken: v.string(),
    period: v.optional(v.union(v.literal("week"), v.literal("month"), v.literal("year"))),
    date: v.optional(v.number()),
    category: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, { sessionToken, period, date, category, page, pageSize }) => {
    await requireSession(ctx, sessionToken);
    const validPeriod: ReportPeriod = period ?? "month";
    const reference = date ? new Date(date) : new Date();
    const { start, end } = getPeriodBounds(validPeriod, reference);
    const cat = category && (CATEGORIES as readonly string[]).includes(category) ? (category as Category) : undefined;

    const size = Math.min(100, Math.max(1, pageSize ?? 25));
    const pg = Math.max(1, page ?? 1);

    const transactions = await getEffectiveTransactionsInRangeRaw(ctx, start.getTime(), end.getTime());
    const filtered = transactions
      .filter((tx) => !cat || tx.category === cat)
      .sort((a, b) => b.createdAt - a.createdAt);

    const total = filtered.length;
    const items = filtered.slice((pg - 1) * size, pg * size).map((tx) => ({
      id: tx.eventId,
      description: tx.description,
      amount: tx.amount,
      currency: normalizeCurrency(tx.currency),
      category: tx.category,
      type: tx.type,
      createdAt: tx.createdAt,
    }));

    return { items, total, page: pg, pageSize: size, periodStart: start.getTime(), periodEnd: end.getTime() };
  },
});

export const correct = action({
  args: {
    sessionToken: v.string(),
    eventId: v.id("transactionEvents"),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    category: v.optional(categoryValidator),
    type: v.optional(typeValidator),
  },
  handler: async (
    ctx,
    { sessionToken, eventId, ...updates },
  ): Promise<{ correctionEventId: Id<"transactionEvents">; transaction: TransactionPayload }> => {
    await ctx.runQuery(internal.lib.session._requireSession, { sessionToken });
    const cycle = await ctx.runQuery(internal.cycles._getActiveOrPending, {});
    if (!cycle) throw new Error("No active cycle.");

    const existing = await ctx.runQuery(internal.transactions._findByEventId, { cycleId: cycle._id, eventId });
    if (!existing) throw new Error("Transaction not found");

    const payload: TransactionPayload = {
      description: updates.description ?? existing.description,
      amount: updates.amount ?? existing.amount,
      category: updates.category ?? existing.category,
      type: updates.type ?? existing.type,
      currency: existing.currency,
    };

    const event = await appendEvent(ctx, {
      cycleId: cycle._id, eventType: "CORRECTION", originalEventId: eventId, payload,
    });

    return { correctionEventId: event.eventId, transaction: payload };
  },
});

export const remove = action({
  args: { sessionToken: v.string(), eventId: v.id("transactionEvents") },
  handler: async (ctx, { sessionToken, eventId }): Promise<{ deleteEventId: Id<"transactionEvents"> }> => {
    await ctx.runQuery(internal.lib.session._requireSession, { sessionToken });
    const cycle = await ctx.runQuery(internal.cycles._getActiveOrPending, {});
    if (!cycle) throw new Error("No active cycle.");

    const existing = await ctx.runQuery(internal.transactions._findByEventId, { cycleId: cycle._id, eventId });
    if (!existing) throw new Error("Transaction not found");

    const event = await appendEvent(ctx, {
      cycleId: cycle._id,
      eventType: "DELETE",
      originalEventId: eventId,
      payload: { description: "deleted", amount: 0, category: "OTHER", type: "EXPENSE" },
    });

    return { deleteEventId: event.eventId };
  },
});

export const updateCategory = action({
  args: { sessionToken: v.string(), eventId: v.id("transactionEvents"), category: categoryValidator },
  handler: async (
    ctx,
    { sessionToken, eventId, category },
  ): Promise<{ correctionEventId: Id<"transactionEvents">; transaction: TransactionPayload }> =>
    ctx.runAction(api.transactions.correct, { sessionToken, eventId, category }),
});
