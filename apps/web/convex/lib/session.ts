import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import { sha256Hex, bytesToHex } from "./crypto";

/** ACTIONS ONLY (real entropy needed) — call from convex/auth.ts's login action. */
export function generateSessionToken(): string {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
}

/** Deterministic — safe anywhere. The raw token is never stored, only its hash. */
export async function hashSessionToken(token: string): Promise<string> {
  return sha256Hex(token);
}

/**
 * Shared auth check for every query/mutation that needs it. The web client stores the
 * session token (returned once by auth.login) itself — e.g. in localStorage — and passes
 * it explicitly as a `sessionToken` argument on every authenticated call. This is the
 * standard pattern for hand-rolled (non-OIDC) auth in Convex: there is no ambient
 * cookie/header Convex functions can read the way an HTTP framework's middleware would.
 */
export async function requireSession(ctx: QueryCtx | MutationCtx, sessionToken: string) {
  const tokenHash = await hashSessionToken(sessionToken);
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
    .first();
  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Not authenticated.");
  }
  return session;
}

/** ACTIONS ONLY (no ctx.db there) — call via ctx.runQuery to validate a session token before
 *  doing any privileged work in an action. Queries/mutations should call requireSession
 *  directly instead — it's cheaper (no extra round trip) and gives back the session doc. */
export const _requireSession = internalQuery({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireSession(ctx, sessionToken);
    return null;
  },
});
