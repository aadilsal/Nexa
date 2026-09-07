import { v } from "convex/values";
import { query, mutation, action, internalQuery, internalMutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireSession } from "./lib/session";
import { encryptNumber, decryptNumber } from "./lib/crypto";
import { getDekForRead, getOrCreateDekForAction } from "./lib/dek";

// The `userSettings` table is a singleton (ported from apps/api/src/modules/users, folded
// into a single owner row since Postgres split this across `User` + `UserSettings`).

const DEFAULTS = {
  weeklyReviewEmail: true,
  timezone: "Asia/Karachi",
  primaryCurrency: "PKR",
  primaryPayday: 1,
};

export const _getRaw = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("userSettings").first(),
});

interface SettingsRow {
  weeklyReviewEmail: boolean;
  timezone: string;
  primaryCurrency: string;
  primaryPayday: number;
  name?: string;
  encryptedStartingBalance?: string;
  encryptedVariableEstimate?: string;
}

/** Read-only, safe in query/mutation contexts. Returns defaults if never set. */
export async function getSettingsRow(ctx: QueryCtx | MutationCtx): Promise<SettingsRow> {
  const row = await ctx.db.query("userSettings").first();
  if (!row) return { ...DEFAULTS };
  return { ...DEFAULTS, ...row, primaryPayday: row.primaryPayday ?? DEFAULTS.primaryPayday };
}

async function requireRow(ctx: MutationCtx) {
  const existing = await ctx.db.query("userSettings").first();
  if (existing) return existing._id;
  return ctx.db.insert("userSettings", DEFAULTS);
}

export const get = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireSession(ctx, sessionToken);
    const row = await ctx.db.query("userSettings").first();
    const dek = await getDekForRead(ctx);

    return {
      name: row?.name ?? null,
      weeklyReviewEmail: row?.weeklyReviewEmail ?? DEFAULTS.weeklyReviewEmail,
      timezone: row?.timezone ?? DEFAULTS.timezone,
      primaryCurrency: row?.primaryCurrency ?? DEFAULTS.primaryCurrency,
      primaryPayday: row?.primaryPayday ?? DEFAULTS.primaryPayday,
      variableEstimate: row?.encryptedVariableEstimate
        ? await decryptNumber(row.encryptedVariableEstimate, dek)
        : 0,
    };
  },
});

export const updateProfile = mutation({
  args: { sessionToken: v.string(), name: v.string() },
  handler: async (ctx, { sessionToken, name }) => {
    await requireSession(ctx, sessionToken);
    const id = await requireRow(ctx);
    await ctx.db.patch(id, { name });
    return { ok: true };
  },
});

export const updateSettings = mutation({
  args: {
    sessionToken: v.string(),
    weeklyReviewEmail: v.optional(v.boolean()),
    timezone: v.optional(v.string()),
    primaryCurrency: v.optional(v.string()),
    primaryPayday: v.optional(v.number()),
  },
  handler: async (ctx, { sessionToken, ...updates }) => {
    await requireSession(ctx, sessionToken);
    const id = await requireRow(ctx);
    const patch = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    );
    if (Object.keys(patch).length > 0) await ctx.db.patch(id, patch);
    return { ok: true };
  },
});

/** ACTION — encrypts the new estimate under the DEK. */
export const updateVariableEstimate = action({
  args: { sessionToken: v.string(), amount: v.number() },
  handler: async (ctx, { sessionToken, amount }) => {
    await ctx.runQuery(internal.lib.session._requireSession, { sessionToken });
    const dek = await getOrCreateDekForAction(ctx);
    const encryptedVariableEstimate = await encryptNumber(amount, dek);
    await ctx.runMutation(internal.settings._patchVariableEstimate, {
      encryptedVariableEstimate,
    });
    return { variableEstimate: amount };
  },
});

export const _patchVariableEstimate = internalMutation({
  args: { encryptedVariableEstimate: v.string() },
  handler: async (ctx, { encryptedVariableEstimate }) => {
    const existing = await ctx.db.query("userSettings").first();
    if (existing) {
      await ctx.db.patch(existing._id, { encryptedVariableEstimate });
    } else {
      await ctx.db.insert("userSettings", { ...DEFAULTS, encryptedVariableEstimate });
    }
  },
});
