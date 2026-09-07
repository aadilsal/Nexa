import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import type { ActionCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import type { Category, TransactionType } from "@nexa/shared";
import { encryptJson, decryptJson, sha256Hex } from "./lib/crypto";
import { getDekForRead, getOrCreateDekForAction } from "./lib/dek";

// Immutable hash-chain transaction ledger, ported from
// apps/api/src/modules/transactions/ledger.service.ts. The chain is scoped per cycle.
// `eventHash = sha256(previousHash + encryptedPayloadBase64)` — the concatenation of the
// previous hash string and the ciphertext string, exactly as the old system computed it.

const GENESIS_HASH = "genesis";

export type TransactionPayload = {
  description: string;
  amount: number;
  category: Category;
  type: TransactionType;
  currency?: string;
  notes?: string;
};

const eventTypeValidator = v.union(
  v.literal("CREATE"),
  v.literal("CORRECTION"),
  v.literal("DELETE"),
);

/**
 * Commits one ledger event. Re-fetches the last hash for this cycle INSIDE this mutation's
 * own transaction — never trust a previousHash computed outside it. This is what makes
 * concurrent appends for the same cycle safe: if two appends race, Convex's OCC will replay
 * the loser against the now-current data, so it recomputes the chain from the real latest
 * event rather than corrupting it with a stale previousHash.
 */
export const _commitEvent = internalMutation({
  args: {
    cycleId: v.id("financialCycles"),
    eventType: eventTypeValidator,
    originalEventId: v.optional(v.id("transactionEvents")),
    encryptedPayload: v.string(),
    // Migration-only override: preserves the original historical timestamp instead of
    // stamping "now". Omitted by every normal appendEvent call.
    createdAtOverride: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const last = await ctx.db
      .query("transactionEvents")
      .withIndex("by_cycle", (q) => q.eq("cycleId", args.cycleId))
      .order("desc")
      .first();
    const previousHash = last ? last.eventHash : GENESIS_HASH;
    const eventHash = await sha256Hex(previousHash + args.encryptedPayload);
    const createdAt = args.createdAtOverride ?? Date.now();
    const eventId = await ctx.db.insert("transactionEvents", {
      cycleId: args.cycleId,
      eventType: args.eventType,
      originalEventId: args.originalEventId,
      encryptedPayload: args.encryptedPayload,
      previousHash,
      eventHash,
      createdAt,
    });
    return { eventId, createdAt };
  },
});

/**
 * ACTIONS ONLY (encrypts the payload with a fresh IV). Call this from transactions.ts's
 * create/correct/delete actions rather than duplicating the encrypt-then-commit sequence.
 */
export async function appendEvent(
  ctx: ActionCtx,
  args: {
    cycleId: Id<"financialCycles">;
    eventType: "CREATE" | "CORRECTION" | "DELETE";
    originalEventId?: Id<"transactionEvents">;
    payload: TransactionPayload;
  },
): Promise<{ eventId: Id<"transactionEvents">; createdAt: number }> {
  const dek = await getOrCreateDekForAction(ctx);
  const encryptedPayload = await encryptJson(args.payload, dek);
  return ctx.runMutation(internal.ledger._commitEvent, {
    cycleId: args.cycleId,
    eventType: args.eventType,
    originalEventId: args.originalEventId,
    encryptedPayload,
  });
}

type LedgerEvent = Doc<"transactionEvents">;
type EffectiveTransaction = TransactionPayload & { eventId: Id<"transactionEvents">; createdAt: number };

/**
 * Replay algorithm: skip anything superseded by a DELETE; for anything with a CORRECTION,
 * use the correction's payload instead of the original (last correction wins, by ascending
 * createdAt iteration order — matching the old system's Map-overwrite semantics exactly).
 * Only decrypts payloads that actually survive the replay (an optimization the old eager
 * NestJS implementation didn't bother with).
 */
async function replayEvents(
  events: LedgerEvent[],
  dek: CryptoKey,
  restrictToCreateIds?: Set<Id<"transactionEvents">>,
): Promise<EffectiveTransaction[]> {
  const sorted = [...events].sort((a, b) => a.createdAt - b.createdAt);

  const deletedIds = new Set<Id<"transactionEvents">>();
  const corrections = new Map<Id<"transactionEvents">, LedgerEvent>();
  const creates = new Map<Id<"transactionEvents">, LedgerEvent>();

  for (const ev of sorted) {
    if (ev.eventType === "CREATE") {
      creates.set(ev._id, ev);
    } else if (ev.eventType === "CORRECTION" && ev.originalEventId) {
      corrections.set(ev.originalEventId, ev); // later iterations overwrite earlier ones
    } else if (ev.eventType === "DELETE" && ev.originalEventId) {
      deletedIds.add(ev.originalEventId);
    }
  }

  const results: EffectiveTransaction[] = [];
  for (const [id, createEv] of creates) {
    if (restrictToCreateIds && !restrictToCreateIds.has(id)) continue;
    if (deletedIds.has(id)) continue;
    const survivor = corrections.get(id) ?? createEv;
    const payload = await decryptJson<TransactionPayload>(survivor.encryptedPayload, dek);
    results.push({ ...payload, eventId: id, createdAt: createEv.createdAt });
  }
  results.sort((a, b) => a.createdAt - b.createdAt);
  return results;
}

/** Exported so other query files (engine.ts, cycles.ts, reports.ts, ...) can reuse this
 *  directly with their own ctx — cross-file query-to-query calls can't go through
 *  ctx.runQuery (that's action-only), so plain-function reuse is the pattern here. */
export async function getEffectiveTransactionsRaw(ctx: QueryCtx, cycleId: Id<"financialCycles">) {
  const dek = await getDekForRead(ctx);
  const events = await ctx.db
    .query("transactionEvents")
    .withIndex("by_cycle", (q) => q.eq("cycleId", cycleId))
    .collect();
  return replayEvents(events, dek);
}

export async function getEffectiveTransactionsInRangeRaw(ctx: QueryCtx, start: number, end: number) {
  const dek = await getDekForRead(ctx);

  const createEvents = await ctx.db
    .query("transactionEvents")
    .withIndex("by_type_createdAt", (q) =>
      q.eq("eventType", "CREATE").gte("createdAt", start).lte("createdAt", end),
    )
    .collect();
  const correctionEvents = await ctx.db
    .query("transactionEvents")
    .withIndex("by_type_createdAt", (q) => q.eq("eventType", "CORRECTION"))
    .collect();
  const deleteEvents = await ctx.db
    .query("transactionEvents")
    .withIndex("by_type_createdAt", (q) => q.eq("eventType", "DELETE"))
    .collect();

  const allowedCreateIds = new Set(createEvents.map((e) => e._id));
  return replayEvents(
    [...createEvents, ...correctionEvents, ...deleteEvents],
    dek,
    allowedCreateIds,
  );
}

/** Fully reactive — decryption is deterministic, safe in a plain query. */
export const getEffectiveTransactions = query({
  args: { cycleId: v.id("financialCycles") },
  handler: async (ctx, { cycleId }) => getEffectiveTransactionsRaw(ctx, cycleId),
});

/**
 * Cross-cycle range query (used by reports). Fetches CREATE events bounded by the range,
 * plus ALL correction/delete events unbounded (cheap at personal-app scale) so a late
 * correction/delete on an in-range transaction is still applied correctly.
 */
export const getEffectiveTransactionsInRange = query({
  args: { start: v.number(), end: v.number() },
  handler: async (ctx, { start, end }) => getEffectiveTransactionsInRangeRaw(ctx, start, end),
});
