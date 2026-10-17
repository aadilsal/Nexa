import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { getOrCreateDekForAction } from "./lib/dek";
import { decryptNumber, encryptNumber } from "./lib/crypto";
import { appendEvent } from "./ledger";

// Admin-only data repairs, run with `npx convex run maintenance:<name>`. The ledger is
// append-only, so "removing" a transaction appends a DELETE event in its own cycle; cash
// carried between cycles is then corrected so balances stay consistent.

export const _event = internalQuery({
  args: { id: v.id("transactionEvents") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const _cycles = internalQuery({
  args: {},
  handler: async (ctx) => (await ctx.db.query("financialCycles").collect()).sort((a, b) => a.startDate - b.startDate),
});

export const _patchCycle = internalMutation({
  args: { id: v.id("financialCycles"), encryptedStartingBalance: v.optional(v.string()), encryptedEndingBalance: v.optional(v.string()) },
  handler: async (ctx, { id, ...patch }) => {
    const clean = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
    await ctx.db.patch(id, clean);
  },
});

export const _addOwnerAlias = internalMutation({
  args: { alias: v.string() },
  handler: async (ctx, { alias }) => {
    const config = await ctx.db.query("ingestConfig").first();
    if (!config) return;
    if (!config.ownerAliases.some((a) => a.toLowerCase() === alias.toLowerCase())) {
      await ctx.db.patch(config._id, { ownerAliases: [...config.ownerAliases, alias] });
    }
  },
});

/** Remove wrongly imported transactions (e.g. transfers between your own accounts) and fix the
 *  starting/ending balances of every cycle after the one each lived in. Safe to re-run. */
export const _removeTransactions = internalAction({
  args: { eventIds: v.array(v.id("transactionEvents")), addOwnerAlias: v.optional(v.string()) },
  handler: async (ctx, { eventIds, addOwnerAlias }) => {
    if (addOwnerAlias) await ctx.runMutation(internal.maintenance._addOwnerAlias, { alias: addOwnerAlias });

    // Net cash correction per cycle: removing an expense adds cash back, removing income subtracts it.
    const delta = new Map<Id<"financialCycles">, number>();
    const removed: Array<{ description: string; amount: number }> = [];
    for (const id of eventIds) {
      const event = await ctx.runQuery(internal.maintenance._event, { id });
      if (!event) continue;
      const tx = await ctx.runQuery(internal.transactions._findByEventId, { cycleId: event.cycleId, eventId: id });
      if (!tx) continue; // already removed
      await appendEvent(ctx, {
        cycleId: event.cycleId,
        eventType: "DELETE",
        originalEventId: id,
        payload: { description: "deleted", amount: 0, category: "OTHER", type: "EXPENSE" },
      });
      delta.set(event.cycleId, (delta.get(event.cycleId) ?? 0) + (tx.type === "EXPENSE" ? tx.amount : -tx.amount));
      removed.push({ description: tx.description, amount: tx.amount });
    }

    // A change inside cycle N shifts N's ending balance and the carried balance of every later cycle.
    const cycles = await ctx.runQuery(internal.maintenance._cycles, {});
    const dek = await getOrCreateDekForAction(ctx);
    let carry = 0;
    for (const cycle of cycles) {
      const startShift = carry;
      carry += delta.get(cycle._id) ?? 0;
      const endShift = carry;
      if (startShift === 0 && endShift === 0) continue;
      const patch: { id: Id<"financialCycles">; encryptedStartingBalance?: string; encryptedEndingBalance?: string } = { id: cycle._id };
      if (startShift !== 0 && cycle.encryptedStartingBalance) {
        patch.encryptedStartingBalance = await encryptNumber((await decryptNumber(cycle.encryptedStartingBalance, dek)) + startShift, dek);
      }
      if (endShift !== 0 && cycle.encryptedEndingBalance) {
        patch.encryptedEndingBalance = await encryptNumber((await decryptNumber(cycle.encryptedEndingBalance, dek)) + endShift, dek);
      }
      await ctx.runMutation(internal.maintenance._patchCycle, patch);
    }
    return { removed, cashCorrection: carry };
  },
});
