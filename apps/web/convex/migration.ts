import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { wrapDek, base64ToBytes } from "./lib/crypto";

// One-time data-migration entry points, called from scripts/migrate-to-convex.mjs (a local
// Node script talking to both the old Postgres DB and this Convex deployment). Every field
// here is either a plain non-sensitive value or ciphertext copied byte-for-byte from
// Postgres — nothing here ever receives decrypted financial data. Delete this file once the
// migration is verified complete (see the plan's Phase 3).

/** Imports the SAME raw DEK bytes the old system used, re-wrapped under this deployment's
 *  own KEK. Refuses to run if a key is already provisioned, so this can't accidentally
 *  clobber a real DEK. */
export const importEncryptionKey = action({
  args: { dekBase64: v.string() },
  handler: async (ctx, { dekBase64 }) => {
    const existing = await ctx.runQuery(internal.lib.dek._getRow, {});
    if (existing) {
      throw new Error("An encryption key is already provisioned — refusing to overwrite it.");
    }
    const dekBytes = base64ToBytes(dekBase64);
    const wrapped = await wrapDek(dekBytes);
    await ctx.runMutation(internal.lib.dek._insertRow, { encryptedDek: wrapped });
    return { ok: true };
  },
});

export const importCycle = mutation({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("COMPLETED"),
      v.literal("PENDING_CONFIRMATION"),
    ),
    encryptedStartingBalance: v.optional(v.string()),
    encryptedEndingBalance: v.optional(v.string()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => ctx.db.insert("financialCycles", args),
});

/** Reuses the real ledger commit mutation so the migrated hash chain is computed by the
 *  exact same code path a live appendEvent uses — not a separate, divergent implementation. */
export const importTransactionEvent = action({
  args: {
    cycleId: v.id("financialCycles"),
    eventType: v.union(v.literal("CREATE"), v.literal("CORRECTION"), v.literal("DELETE")),
    originalEventId: v.optional(v.id("transactionEvents")),
    encryptedPayload: v.string(),
    createdAtOverride: v.number(),
  },
  handler: async (ctx, args): Promise<{ eventId: Id<"transactionEvents">; createdAt: number }> => {
    return ctx.runMutation(internal.ledger._commitEvent, args);
  },
});

export const importGoal = mutation({
  args: {
    name: v.string(),
    priority: v.union(
      v.literal("EMERGENCY_FUND"),
      v.literal("HIGH"),
      v.literal("MEDIUM"),
      v.literal("LOW"),
    ),
    targetDate: v.number(),
    currency: v.string(),
    encryptedTargetAmount: v.string(),
    encryptedCurrentAmount: v.optional(v.string()),
    isEmergencyFund: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => ctx.db.insert("goals", args),
});

const categoryValidator = v.union(
  v.literal("FOOD"),
  v.literal("FUEL"),
  v.literal("SHOPPING"),
  v.literal("ENTERTAINMENT"),
  v.literal("UTILITIES"),
  v.literal("HEALTHCARE"),
  v.literal("TRANSPORT"),
  v.literal("HOUSING"),
  v.literal("EDUCATION"),
  v.literal("CHARITY"),
  v.literal("INVESTMENT"),
  v.literal("INCOME"),
  v.literal("OTHER"),
);

export const importFixedExpense = mutation({
  args: {
    name: v.string(),
    category: categoryValidator,
    currency: v.string(),
    encryptedExpectedAmount: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => ctx.db.insert("fixedExpenses", args),
});

export const importIncomeExpectation = mutation({
  args: {
    name: v.string(),
    currency: v.string(),
    encryptedExpectedAmount: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => ctx.db.insert("incomeExpectations", args),
});

export const importUserSettings = mutation({
  args: {
    weeklyReviewEmail: v.boolean(),
    timezone: v.string(),
    primaryCurrency: v.string(),
    name: v.optional(v.string()),
    primaryPayday: v.optional(v.number()),
    encryptedStartingBalance: v.optional(v.string()),
    encryptedVariableEstimate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("userSettings").first();
    if (existing) throw new Error("userSettings already exists — refusing to duplicate it.");
    return ctx.db.insert("userSettings", args);
  },
});
