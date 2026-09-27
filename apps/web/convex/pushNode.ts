"use node";

import webpush from "web-push";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Delivers a notification to every subscribed device (Node runtime: web-push needs node crypto).
// Subscriptions the push service reports as gone (404/410) are removed.
export const send = internalAction({
  args: { title: v.string(), body: v.string(), url: v.string() },
  handler: async (ctx, { title, body, url }) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) return { sent: 0, reason: "VAPID keys not configured" };
    webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:owner@nexa.app", publicKey, privateKey);

    const subscriptions = await ctx.runQuery(internal.push._list, {});
    const payload = JSON.stringify({ title, body, url });
    let sent = 0;
    await Promise.all(
      subscriptions.map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24 });
          sent++;
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) await ctx.runMutation(internal.push._remove, { endpoint: s.endpoint });
          else console.error("push failed", status);
        }
      }),
    );
    return { sent };
  },
});
