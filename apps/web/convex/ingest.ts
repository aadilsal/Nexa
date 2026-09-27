import { v } from "convex/values";
import { action, httpAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { parseBankMessage } from "@nexa/finance-engine";
import { sha256Hex, timingSafeEqualHex } from "./lib/crypto";
import { generateSessionToken, requireSession } from "./lib/session";
import { appendEvent } from "./ledger";
import { ensureCurrentCycleImpl } from "./cycles";

// Automatic import of bank / wallet alerts. Two senders post to POST /ingest on the Convex
// site URL with `Authorization: Bearer <ingest token>`:
//   - an iPhone Shortcuts automation that forwards bank SMS as they arrive
//   - scripts/gmail-apps-script.js, which forwards bank alert emails every few minutes
// Parsed transactions are logged immediately (tagged in `notes`); everything else is recorded
// as ignored with a reason so the settings page can show what happened.

const INGEST_RATE_LIMIT = 100; // messages per 15-minute window
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_TEXT_LENGTH = 20_000;

const sourceValidator = v.union(v.literal("sms"), v.literal("email"));

// ─── Settings (session-authenticated, used by /profile/auto-import) ──────────────

export const getConfig = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireSession(ctx, sessionToken);
    const config = await ctx.db.query("ingestConfig").first();
    const recent = await ctx.db.query("ingestedMessages").withIndex("by_createdAt").order("desc").take(25);
    return {
      configured: Boolean(config),
      ownerAliases: config?.ownerAliases ?? [],
      lastUsedAt: config?.lastUsedAt ?? null,
      recent: recent.map((m) => ({ id: m._id, source: m.source, status: m.status, reason: m.reason ?? null, createdAt: m.createdAt })),
    };
  },
});

/** Creates or replaces the ingest token. Returns the raw token ONCE — only its hash is kept. */
export const rotateToken = action({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }): Promise<{ token: string }> => {
    await ctx.runQuery(internal.lib.session._requireSession, { sessionToken });
    const token = generateSessionToken();
    await ctx.runMutation(internal.ingest._setTokenHash, { tokenHash: await sha256Hex(token) });
    return { token };
  },
});

export const setOwnerAliases = mutation({
  args: { sessionToken: v.string(), ownerAliases: v.array(v.string()) },
  handler: async (ctx, { sessionToken, ownerAliases }) => {
    await requireSession(ctx, sessionToken);
    const config = await ctx.db.query("ingestConfig").first();
    if (!config) throw new Error("Generate an import token first.");
    const cleaned = [...new Set(ownerAliases.map((a) => a.trim()).filter(Boolean))].slice(0, 20);
    await ctx.db.patch(config._id, { ownerAliases: cleaned });
  },
});

export const _setTokenHash = internalMutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const config = await ctx.db.query("ingestConfig").first();
    if (config) await ctx.db.patch(config._id, { tokenHash });
    else await ctx.db.insert("ingestConfig", { tokenHash, ownerAliases: [], createdAt: Date.now() });
  },
});

// ─── Internal plumbing for the HTTP endpoint ─────────────────────────────────────

export const _getConfig = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("ingestConfig").first(),
});

export const _recordIgnored = internalMutation({
  args: { source: sourceValidator, messageHash: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    const seen = await ctx.db
      .query("ingestedMessages")
      .withIndex("by_messageHash", (q) => q.eq("messageHash", args.messageHash))
      .first();
    if (!seen) await ctx.db.insert("ingestedMessages", { ...args, status: "IGNORED", createdAt: Date.now() });
  },
});

/** Atomically claims a message for logging. Returns null (and records a DUPLICATE) if the same
 *  message was already seen, or the same transaction was logged from another alert recently. */
export const _claim = internalMutation({
  args: { source: sourceValidator, messageHash: v.string(), matchKey: v.string() },
  handler: async (ctx, { source, messageHash, matchKey }): Promise<Id<"ingestedMessages"> | null> => {
    const now = Date.now();
    const sameMessage = await ctx.db
      .query("ingestedMessages")
      .withIndex("by_messageHash", (q) => q.eq("messageHash", messageHash))
      .first();
    if (sameMessage) return null;

    const sameTransaction = await ctx.db
      .query("ingestedMessages")
      .withIndex("by_matchKey", (q) => q.eq("matchKey", matchKey).gte("createdAt", now - DUPLICATE_WINDOW_MS))
      .filter((q) => q.eq(q.field("status"), "LOGGED"))
      .first();
    if (sameTransaction) {
      await ctx.db.insert("ingestedMessages", {
        source,
        messageHash,
        matchKey,
        status: "DUPLICATE",
        reason: "same transaction already imported from another alert",
        createdAt: now,
      });
      return null;
    }

    return ctx.db.insert("ingestedMessages", { source, messageHash, matchKey, status: "LOGGED", createdAt: now });
  },
});

export const _attachEvent = internalMutation({
  args: { id: v.id("ingestedMessages"), eventId: v.id("transactionEvents") },
  handler: async (ctx, { id, eventId }) => {
    await ctx.db.patch(id, { eventId });
    const config = await ctx.db.query("ingestConfig").first();
    if (config) await ctx.db.patch(config._id, { lastUsedAt: Date.now() });
  },
});

export const _release = internalMutation({
  args: { id: v.id("ingestedMessages") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});

// ─── POST /ingest ────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export const ingestHttp = httpAction(async (ctx, request) => {
  const config = await ctx.runQuery(internal.ingest._getConfig, {});
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  if (!config || !token || !timingSafeEqualHex(await sha256Hex(token), config.tokenHash)) {
    return json({ error: "unauthorized" }, 401);
  }

  const rl = await ctx.runMutation(internal.lib.ratelimit._checkAndIncrement, { key: "ingest", limit: INGEST_RATE_LIMIT });
  if (!rl.allowed) return json({ error: "rate limited" }, 429);

  let body: { text?: unknown; source?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "body must be JSON: {\"text\": \"...\", \"source\": \"sms\" | \"email\"}" }, 400);
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length > MAX_TEXT_LENGTH) return json({ error: "text is required" }, 400);
  const source = body.source === "email" ? "email" : "sms";

  const messageHash = await sha256Hex(`${source}:${text}`);
  const primaryCurrency = await ctx.runQuery(internal.engine._getPrimaryCurrency, {});
  const parsed = parseBankMessage(text, { ownerAliases: config.ownerAliases, defaultCurrency: primaryCurrency });

  if (parsed.status === "ignored") {
    await ctx.runMutation(internal.ingest._recordIgnored, { source, messageHash, reason: parsed.reason });
    return json({ status: "ignored", reason: parsed.reason });
  }

  const matchKey = await sha256Hex(`${parsed.type}:${parsed.amount}:${parsed.currency}`);
  const claimId = await ctx.runMutation(internal.ingest._claim, { source, messageHash, matchKey });
  if (!claimId) return json({ status: "duplicate" });

  try {
    await ensureCurrentCycleImpl(ctx);
    const cycle = await ctx.runQuery(internal.cycles._getActiveOrPending, {});
    if (!cycle) throw new Error("No active cycle.");
    const event = await appendEvent(ctx, {
      cycleId: cycle._id,
      eventType: "CREATE",
      payload: {
        description: parsed.description,
        amount: parsed.amount,
        category: parsed.category,
        type: parsed.type,
        currency: parsed.currency,
        notes: `Auto-imported from ${source === "sms" ? "SMS" : "email"}`,
      },
    });
    await ctx.runMutation(internal.ingest._attachEvent, { id: claimId, eventId: event.eventId });
  } catch (err) {
    await ctx.runMutation(internal.ingest._release, { id: claimId });
    return json({ error: err instanceof Error ? err.message : "could not log transaction" }, 500);
  }

  return json({ status: "logged", type: parsed.type, amount: parsed.amount, currency: parsed.currency, description: parsed.description });
});
