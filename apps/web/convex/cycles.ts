import { v } from "convex/values";
import { query, mutation, action, internalQuery, internalMutation } from "./_generated/server";
import type { QueryCtx, ActionCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal, api } from "./_generated/api";
import { computeCycleDates, computeNextCycleDates, getDaysRemaining, computePersistedGoalAmounts } from "@nexa/finance-engine";
import { requireSession } from "./lib/session";
import { encryptNumber, decryptNumber } from "./lib/crypto";
import { getDekForRead, getOrCreateDekForAction } from "./lib/dek";
import { getSettingsRow } from "./settings";

// Ported from apps/api/src/modules/cycles/cycles.service.ts. Single-owner: no userId
// scoping anywhere. Writes go through actions (creating/rolling a cycle always encrypts a
// starting/ending balance, which requires a fresh IV — action-only per lib/crypto.ts).

/** Exported so other query files (engine.ts, dashboard.ts, ...) can reuse it directly —
 *  cross-file calls between queries can't go through ctx.runQuery (action-only). */
export async function getActiveOrPendingRaw(ctx: QueryCtx): Promise<Doc<"financialCycles"> | null> {
  const active = await ctx.db
    .query("financialCycles")
    .withIndex("by_status", (q) => q.eq("status", "ACTIVE"))
    .first();
  if (active) return active;
  return ctx.db
    .query("financialCycles")
    .withIndex("by_status", (q) => q.eq("status", "PENDING_CONFIRMATION"))
    .first();
}

export const _getActiveOrPending = internalQuery({
  args: {},
  handler: async (ctx) => getActiveOrPendingRaw(ctx),
});

export const _getPending = internalQuery({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query("financialCycles")
      .withIndex("by_status", (q) => q.eq("status", "PENDING_CONFIRMATION"))
      .first(),
});

export async function resolveStartingBalanceNumber(
  cycle: Doc<"financialCycles"> | null,
  settings: Awaited<ReturnType<typeof getSettingsRow>>,
  dek: CryptoKey,
): Promise<number> {
  if (cycle?.encryptedStartingBalance) {
    return decryptNumber(cycle.encryptedStartingBalance, dek);
  }
  if (settings.encryptedStartingBalance) {
    return decryptNumber(settings.encryptedStartingBalance, dek);
  }
  return 0;
}

/** Read-only view of whatever the current active/pending cycle is — does NOT create or
 *  roll one over (queries can't write). Call `ensureCurrentCycle` first on app load. */
export const getCurrent = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireSession(ctx, sessionToken);
    const cycle = await getActiveOrPendingRaw(ctx);
    if (!cycle) return null;
    const settings = await getSettingsRow(ctx);
    const dek = await getDekForRead(ctx);
    const startingBalance = await resolveStartingBalanceNumber(cycle, settings, dek);
    return {
      id: cycle._id,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      status: cycle.status,
      startingBalance,
      daysRemaining: getDaysRemaining(new Date(cycle.endDate), new Date()),
    };
  },
});

export const history = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireSession(ctx, sessionToken);
    const dek = await getDekForRead(ctx);
    const cycles = await ctx.db
      .query("financialCycles")
      .withIndex("by_startDate")
      .order("desc")
      .take(12);
    return Promise.all(
      cycles.map(async (c) => ({
        id: c._id,
        startDate: c.startDate,
        endDate: c.endDate,
        status: c.status,
        startingBalance: c.encryptedStartingBalance
          ? await decryptNumber(c.encryptedStartingBalance, dek)
          : 0,
        endingBalance: c.encryptedEndingBalance
          ? await decryptNumber(c.encryptedEndingBalance, dek)
          : null,
      })),
    );
  },
});

export const _insertCycle = internalMutation({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    status: v.union(v.literal("ACTIVE"), v.literal("COMPLETED"), v.literal("PENDING_CONFIRMATION")),
    encryptedStartingBalance: v.optional(v.string()),
  },
  handler: async (ctx, args) =>
    ctx.db.insert("financialCycles", { ...args, createdAt: Date.now() }),
});

export const _completeCycle = internalMutation({
  args: { cycleId: v.id("financialCycles"), encryptedEndingBalance: v.string() },
  handler: async (ctx, { cycleId, encryptedEndingBalance }) => {
    await ctx.db.patch(cycleId, { status: "COMPLETED", encryptedEndingBalance });
  },
});

export const _patchGoalCurrentAmount = internalMutation({
  args: { goalId: v.id("goals"), encryptedCurrentAmount: v.string() },
  handler: async (ctx, { goalId, encryptedCurrentAmount }) => {
    await ctx.db.patch(goalId, { encryptedCurrentAmount });
  },
});

/** Persists each active goal's `encryptedCurrentAmount` from the cycle's transactions,
 *  using the same surplus-allocation waterfall the engine uses for live progress. */
async function persistCycleGoalProgress(ctx: ActionCtx, cycleId: Id<"financialCycles">, dek: CryptoKey): Promise<void> {
  const goals: Doc<"goals">[] = await ctx.runQuery(internal.goals._listActive, {});
  if (goals.length === 0) return;

  const transactions = await ctx.runQuery(api.ledger.getEffectiveTransactions, { cycleId });

  const engineGoals = await Promise.all(
    goals.map(async (g: Doc<"goals">) => ({
      id: g._id,
      name: g.name,
      priority: g.priority,
      targetAmount: await decryptNumber(g.encryptedTargetAmount, dek),
      targetDate: new Date(g.targetDate),
      isEmergencyFund: g.isEmergencyFund,
      storedCurrentAmount: g.encryptedCurrentAmount
        ? await decryptNumber(g.encryptedCurrentAmount, dek)
        : 0,
    })),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const engineTransactions = (transactions as any[]).map((tx) => ({
    amount: tx.amount,
    type: tx.type,
    category: tx.category,
    createdAt: new Date(tx.createdAt),
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const persisted = computePersistedGoalAmounts(engineGoals as any, engineTransactions as any);

  for (const goal of goals) {
    const amount = persisted[goal._id];
    if (amount == null) continue;
    const encryptedCurrentAmount = await encryptNumber(amount, dek);
    await ctx.runMutation(internal.cycles._patchGoalCurrentAmount, {
      goalId: goal._id,
      encryptedCurrentAmount,
    });
  }
}

/** Idempotent — call on every app load. Creates the very first cycle if none exists yet,
 *  or rolls an expired ACTIVE cycle into a new PENDING_CONFIRMATION one. A no-op otherwise. */
export const ensureCurrentCycle = action({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }): Promise<{ cycleId: Id<"financialCycles"> }> => {
    await ctx.runQuery(internal.lib.session._requireSession, { sessionToken });
    return ensureCurrentCycleImpl(ctx);
  },
});

/** Session-free core of ensureCurrentCycle — callers must authenticate first (the automatic
 *  bank-message import authenticates with its own ingest token instead of a session). */
export async function ensureCurrentCycleImpl(ctx: ActionCtx): Promise<{ cycleId: Id<"financialCycles"> }> {
  {
    const dek = await getOrCreateDekForAction(ctx);
    const cycle = await ctx.runQuery(internal.cycles._getActiveOrPending, {});

    if (cycle && cycle.status === "PENDING_CONFIRMATION") return { cycleId: cycle._id };
    if (cycle && cycle.status === "ACTIVE" && cycle.endDate >= Date.now()) {
      return { cycleId: cycle._id };
    }

    const settingsRow = await ctx.runQuery(internal.settings._getRaw, {});
    const payday = settingsRow?.primaryPayday ?? 1;

    if (cycle && cycle.status === "ACTIVE" && cycle.endDate < Date.now()) {
      // Roll over: close the expired cycle, persist goal progress, open the next one
      // PENDING_CONFIRMATION so the user can review/adjust the carried-forward balance.
      const startingBalance = cycle.encryptedStartingBalance
        ? await decryptNumber(cycle.encryptedStartingBalance, dek)
        : 0;
      const transactions = await ctx.runQuery(api.ledger.getEffectiveTransactions, {
        cycleId: cycle._id,
      });
      let income = 0;
      let expenses = 0;
      for (const tx of transactions) {
        if (tx.type === "INCOME") income += tx.amount;
        else expenses += tx.amount;
      }
      const endingCash = startingBalance + income - expenses;

      await persistCycleGoalProgress(ctx, cycle._id, dek);
      await ctx.runMutation(internal.cycles._completeCycle, {
        cycleId: cycle._id,
        encryptedEndingBalance: await encryptNumber(endingCash, dek),
      });

      const { startDate, endDate } = computeNextCycleDates(new Date(cycle.endDate), payday);
      const newId: Id<"financialCycles"> = await ctx.runMutation(internal.cycles._insertCycle, {
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        status: "PENDING_CONFIRMATION",
        encryptedStartingBalance: await encryptNumber(endingCash, dek),
      });
      return { cycleId: newId };
    }

    // No cycle at all yet — brand new install.
    const { startDate, endDate } = computeCycleDates(payday);
    const fallbackBalance = settingsRow?.encryptedStartingBalance
      ? await decryptNumber(settingsRow.encryptedStartingBalance, dek)
      : 0;
    const newId: Id<"financialCycles"> = await ctx.runMutation(internal.cycles._insertCycle, {
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
      status: "ACTIVE",
      encryptedStartingBalance: await encryptNumber(fallbackBalance, dek),
    });
    return { cycleId: newId };
  }
}

export const confirmRollover = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireSession(ctx, sessionToken);
    const cycle = await ctx.db
      .query("financialCycles")
      .withIndex("by_status", (q) => q.eq("status", "PENDING_CONFIRMATION"))
      .first();
    if (!cycle) throw new Error("No pending rollover to confirm.");
    await ctx.db.patch(cycle._id, { status: "ACTIVE" });
    return { id: cycle._id, status: "ACTIVE" };
  },
});

/** ACTION — lets the user override the carried-forward starting balance before confirming. */
export const adjustRollover = action({
  args: { sessionToken: v.string(), startingBalance: v.number() },
  handler: async (ctx, { sessionToken, startingBalance }): Promise<{ id: Id<"financialCycles">; status: "ACTIVE" }> => {
    await ctx.runQuery(internal.lib.session._requireSession, { sessionToken });
    const dek = await getOrCreateDekForAction(ctx);
    const cycle = await ctx.runQuery(internal.cycles._getPending, {});
    if (!cycle) throw new Error("No pending rollover to adjust.");
    const encryptedStartingBalance = await encryptNumber(startingBalance, dek);
    await ctx.runMutation(internal.cycles._activateWithBalance, {
      cycleId: cycle._id,
      encryptedStartingBalance,
    });
    return { id: cycle._id, status: "ACTIVE" };
  },
});

export const _activateWithBalance = internalMutation({
  args: { cycleId: v.id("financialCycles"), encryptedStartingBalance: v.string() },
  handler: async (ctx, { cycleId, encryptedStartingBalance }) => {
    await ctx.db.patch(cycleId, { status: "ACTIVE", encryptedStartingBalance });
  },
});
