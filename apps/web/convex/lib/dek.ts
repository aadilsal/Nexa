import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import type { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { generateDek, wrapDek, unwrapDek, importDek } from "./crypto";

// The `encryptionKey` table holds exactly one row for the lifetime of this deployment.
// Reads (query/mutation contexts) never create it — only an action can, since creating
// it requires generating a fresh DEK (real randomness, action-only per crypto.ts's rule).

export const _getRow = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("encryptionKey").first();
  },
});

export const _insertRow = internalMutation({
  args: { encryptedDek: v.string() },
  handler: async (ctx, { encryptedDek }) => {
    // Re-check inside the mutation's own transaction in case two concurrent actions
    // both tried to bootstrap the singleton at once — first writer wins, second is a no-op.
    const existing = await ctx.db.query("encryptionKey").first();
    if (existing) return existing._id;
    return await ctx.db.insert("encryptionKey", {
      encryptedDek,
      dekVersion: 1,
      createdAt: Date.now(),
    });
  },
});

/** For query/mutation contexts. Read-only — throws if the app hasn't been set up yet. */
export async function getDekForRead(ctx: QueryCtx | MutationCtx) {
  const row = await ctx.db.query("encryptionKey").first();
  if (!row) {
    throw new Error(
      "No encryption key has been provisioned yet. Run the one-time setup action first.",
    );
  }
  const dekBytes = await unwrapDek(row.encryptedDek);
  return importDek(dekBytes);
}

/** For action contexts. Get-or-create — safe here since actions have real entropy. */
export async function getOrCreateDekForAction(ctx: ActionCtx) {
  const row = await ctx.runQuery(internal.lib.dek._getRow, {});
  if (!row) {
    const dek = generateDek();
    const wrapped = await wrapDek(dek);
    await ctx.runMutation(internal.lib.dek._insertRow, { encryptedDek: wrapped });
    return importDek(dek);
  }
  const dekBytes = await unwrapDek(row.encryptedDek);
  return importDek(dekBytes);
}
