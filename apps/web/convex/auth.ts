import { v } from "convex/values";
import { action, mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { encrypt, decrypt, sha256Hex, timingSafeEqualHex } from "./lib/crypto";
import { getOrCreateDekForAction } from "./lib/dek";
import { generateTotpSecret, matchTotpCounter, buildOtpAuthUri } from "./lib/totp";
import { generateSessionToken, hashSessionToken, requireSession } from "./lib/session";
import { generateRecoveryCode } from "./lib/password";

// Hand-rolled TOTP-only auth for exactly one owner identity — no password, no signup, no
// email flows, no multi-user session listing. The authenticator code is the sole factor, so
// replay protection (lastTotpCounter) and the login rate limit carry the security load.
// Convex Auth (@convex-dev/auth) was rejected: it's beta, has no TOTP primitive, and is
// built around Auth.js email verify/reset flows that don't apply here.

const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const LOGIN_RATE_LIMIT = 5; // attempts per 15-minute window, see lib/ratelimit.ts

export const _getCredentials = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("authCredentials").first(),
});

export const _insertCredentials = internalMutation({
  args: {
    totpSecretEncrypted: v.string(),
    recoveryCodeHashes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("authCredentials").first();
    if (existing) {
      throw new Error(
        "Credentials already exist — this app supports exactly one owner identity.",
      );
    }
    return ctx.db.insert("authCredentials", { ...args, createdAt: Date.now() });
  },
});

export const _updateRecoveryCodes = internalMutation({
  args: { id: v.id("authCredentials"), recoveryCodeHashes: v.array(v.string()) },
  handler: async (ctx, { id, recoveryCodeHashes }) => {
    await ctx.db.patch(id, { recoveryCodeHashes });
  },
});

/** Atomically records a TOTP step as used. Returns false if it (or a later step) already was,
 *  so a code observed in transit or over a shoulder can't be replayed within its window. */
export const _consumeTotpCounter = internalMutation({
  args: { id: v.id("authCredentials"), counter: v.number() },
  handler: async (ctx, { id, counter }) => {
    const creds = await ctx.db.get(id);
    if (!creds) return false;
    if (creds.lastTotpCounter !== undefined && counter <= creds.lastTotpCounter) return false;
    await ctx.db.patch(id, { lastTotpCounter: counter });
    return true;
  },
});

export const _createSession = internalMutation({
  args: { tokenHash: v.string(), expiresAt: v.number() },
  handler: async (ctx, args) => ctx.db.insert("sessions", { ...args, createdAt: Date.now() }),
});

export const _recordLoginAttempt = internalMutation({
  args: { success: v.boolean() },
  handler: async (ctx, { success }) => {
    await ctx.db.insert("loginAttempts", { success, createdAt: Date.now() });
  },
});

/**
 * One-time setup. Run once via `node scripts/run-auth-setup.mjs` to create the single owner
 * identity — there is no signup UI, this is intentionally a CLI-only step.
 * Fails loudly if credentials already exist rather than silently overwriting them.
 * Returns the TOTP secret/QR URI and recovery codes ONCE — write them down immediately,
 * they cannot be retrieved again (only the encrypted/hashed forms are kept).
 */
export const setup = action({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.runQuery(internal.auth._getCredentials, {});
    if (existing) throw new Error("Already set up.");

    const totpSecret = generateTotpSecret();
    const dek = await getOrCreateDekForAction(ctx);
    const totpSecretEncrypted = await encrypt(totpSecret, dek);

    const recoveryCodes = Array.from({ length: 8 }, () => generateRecoveryCode());
    const recoveryCodeHashes = await Promise.all(recoveryCodes.map((c) => sha256Hex(c)));

    await ctx.runMutation(internal.auth._insertCredentials, {
      totpSecretEncrypted,
      recoveryCodeHashes,
    });

    return {
      otpAuthUri: buildOtpAuthUri(totpSecret, "owner", "Nexa"),
      totpSecret,
      recoveryCodes,
    };
  },
});

export const login = action({
  args: { totpCode: v.string() },
  handler: async (ctx, { totpCode }) => {
    const rl = await ctx.runMutation(internal.lib.ratelimit._checkAndIncrement, {
      key: "login",
      limit: LOGIN_RATE_LIMIT,
    });
    if (!rl.allowed) {
      throw new Error("Too many login attempts. Wait 15 minutes and try again.");
    }

    const creds = await ctx.runQuery(internal.auth._getCredentials, {});
    if (!creds) throw new Error("Not set up yet.");

    const dek = await getOrCreateDekForAction(ctx);
    const totpSecret = await decrypt(creds.totpSecretEncrypted, dek);
    const counter = await matchTotpCounter(totpSecret, totpCode.trim());
    const ok =
      counter !== null &&
      (await ctx.runMutation(internal.auth._consumeTotpCounter, { id: creds._id, counter }));

    await ctx.runMutation(internal.auth._recordLoginAttempt, { success: ok });

    if (!ok) {
      throw new Error("Invalid or already-used authenticator code.");
    }

    const token = generateSessionToken();
    const tokenHash = await hashSessionToken(token);
    await ctx.runMutation(internal.auth._createSession, {
      tokenHash,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });

    return { token };
  },
});

/** Lockout recovery for a lost authenticator device. Each code is one-time-use. */
export const loginWithRecoveryCode = action({
  args: { recoveryCode: v.string() },
  handler: async (ctx, { recoveryCode }): Promise<{ token: string; remainingRecoveryCodes: number }> => {
    const rl = await ctx.runMutation(internal.lib.ratelimit._checkAndIncrement, {
      key: "login",
      limit: LOGIN_RATE_LIMIT,
    });
    if (!rl.allowed) {
      throw new Error("Too many login attempts. Wait 15 minutes and try again.");
    }

    const creds = await ctx.runQuery(internal.auth._getCredentials, {});
    if (!creds) throw new Error("Not set up yet.");

    const codeHash = await sha256Hex(recoveryCode.trim().toUpperCase());
    const matchIndex = creds.recoveryCodeHashes.findIndex((h: string) => timingSafeEqualHex(h, codeHash));

    await ctx.runMutation(internal.auth._recordLoginAttempt, { success: matchIndex !== -1 });

    if (matchIndex === -1) {
      throw new Error("Invalid or already-used recovery code.");
    }

    const remaining = creds.recoveryCodeHashes.filter((_: string, i: number) => i !== matchIndex);
    await ctx.runMutation(internal.auth._updateRecoveryCodes, {
      id: creds._id,
      recoveryCodeHashes: remaining,
    });

    const token = generateSessionToken();
    const tokenHash = await hashSessionToken(token);
    await ctx.runMutation(internal.auth._createSession, {
      tokenHash,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });

    return { token, remainingRecoveryCodes: remaining.length };
  },
});

/** For profile/activity — the closest thing this app has to a security event log. */
export const recentLoginAttempts = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireSession(ctx, sessionToken);
    const attempts = await ctx.db.query("loginAttempts").withIndex("by_createdAt").order("desc").take(50);
    return attempts.map((a) => ({ id: a._id, success: a.success, createdAt: a.createdAt }));
  },
});

export const logout = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const tokenHash = await hashSessionToken(sessionToken);
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .first();
    if (session) await ctx.db.delete(session._id);
  },
});
