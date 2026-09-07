import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

// Replaces the old Redis INCR+EXPIRE fixed-window limiter. Convex has no key TTL, so instead
// of expiring keys we bucket by a fixed window start and check-and-increment transactionally
// inside a single mutation — Convex's OCC makes this safe under concurrent calls without any
// external atomic-counter primitive.

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export const _checkAndIncrement = internalMutation({
  args: { key: v.string(), limit: v.number() },
  handler: async (ctx, { key, limit }) => {
    const windowStart = Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS;
    const existing = await ctx.db
      .query("rateLimitCounters")
      .withIndex("by_key_window", (q) => q.eq("key", key).eq("windowStart", windowStart))
      .first();

    if (!existing) {
      await ctx.db.insert("rateLimitCounters", { key, windowStart, count: 1 });
      return { allowed: true, count: 1 };
    }
    if (existing.count >= limit) {
      return { allowed: false, count: existing.count };
    }
    await ctx.db.patch(existing._id, { count: existing.count + 1 });
    return { allowed: true, count: existing.count + 1 };
  },
});

/** Housekeeping: prune counters from windows more than a day old. Run via a daily cron.
 *  Full-table scan is fine here — this table stays tiny (a handful of keys x windows/day)
 *  at personal-app scale, and the compound index can't express "any key, old window" alone. */
export const _pruneOldCounters = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const all = await ctx.db.query("rateLimitCounters").collect();
    for (const row of all) {
      if (row.windowStart < cutoff) await ctx.db.delete(row._id);
    }
  },
});
