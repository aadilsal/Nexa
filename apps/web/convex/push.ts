import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { ActionCtx, MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireSession } from "./lib/session";

// Web Push for the home-screen app (iOS 16.4+ / Android). Devices subscribe from Settings;
// server code calls `notify(ctx, …)` and the Node action in pushNode.ts delivers it.

export const publicKey = query({
  args: {},
  handler: async () => process.env.VAPID_PUBLIC_KEY ?? null,
});

export const subscribe = mutation({
  args: { sessionToken: v.string(), endpoint: v.string(), p256dh: v.string(), auth: v.string() },
  handler: async (ctx, { sessionToken, endpoint, p256dh, auth }) => {
    await requireSession(ctx, sessionToken);
    const existing = await ctx.db.query("pushSubscriptions").withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint)).first();
    if (existing) await ctx.db.patch(existing._id, { p256dh, auth });
    else await ctx.db.insert("pushSubscriptions", { endpoint, p256dh, auth, createdAt: Date.now() });
  },
});

export const unsubscribe = mutation({
  args: { sessionToken: v.string(), endpoint: v.string() },
  handler: async (ctx, { sessionToken, endpoint }) => {
    await requireSession(ctx, sessionToken);
    const existing = await ctx.db.query("pushSubscriptions").withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint)).first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const _list = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("pushSubscriptions").collect(),
});

export const _remove = internalMutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const existing = await ctx.db.query("pushSubscriptions").withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint)).first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

/** Queue a push to every subscribed device. Safe from mutations and actions; never throws. */
export async function notify(ctx: MutationCtx | ActionCtx, message: { title: string; body: string; url?: string }) {
  await ctx.scheduler.runAfter(0, internal.pushNode.send, { title: message.title, body: message.body, url: message.url ?? "/dashboard" });
}
