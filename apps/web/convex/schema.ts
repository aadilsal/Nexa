import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Single-user app: no userId/ownerId discriminator anywhere. Tables marked "singleton"
// are expected to hold exactly one row for the lifetime of the deployment; that's enforced
// in the mutation layer (convex/*.ts), not in the schema itself.

export default defineSchema({
  // ─── Financial cycles & ledger ────────────────────────────────────────
  financialCycles: defineTable({
    startDate: v.number(), // ms epoch
    endDate: v.number(),
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("COMPLETED"),
      v.literal("PENDING_CONFIRMATION"),
    ),
    encryptedStartingBalance: v.optional(v.string()),
    encryptedEndingBalance: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_startDate", ["startDate"]),

  // The immutable hash-chain ledger. `createdAt` is an explicit field (not Convex's
  // built-in _creationTime) because the hash chain's ordering and the historical
  // migration both depend on a caller-controlled timestamp.
  transactionEvents: defineTable({
    cycleId: v.id("financialCycles"),
    eventType: v.union(
      v.literal("CREATE"),
      v.literal("CORRECTION"),
      v.literal("DELETE"),
    ),
    originalEventId: v.optional(v.id("transactionEvents")),
    encryptedPayload: v.string(),
    previousHash: v.string(),
    eventHash: v.string(),
    createdAt: v.number(),
  })
    .index("by_cycle", ["cycleId", "createdAt"])
    .index("by_type_createdAt", ["eventType", "createdAt"])
    .index("by_originalEventId", ["originalEventId"]),

  // ─── Goals, fixed expenses, income ─────────────────────────────────────
  goals: defineTable({
    name: v.string(),
    priority: v.union(
      v.literal("EMERGENCY_FUND"),
      v.literal("HIGH"),
      v.literal("MEDIUM"),
      v.literal("LOW"),
    ),
    targetDate: v.number(),
    currency: v.string(), // "PKR" always, kept as a formatting hint
    encryptedTargetAmount: v.string(),
    encryptedCurrentAmount: v.optional(v.string()),
    isEmergencyFund: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_isActive", ["isActive"]),

  fixedExpenses: defineTable({
    name: v.string(),
    category: v.union(
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
      v.literal("LOAN"),
      v.literal("OTHER"),
    ),
    currency: v.string(),
    encryptedExpectedAmount: v.string(),
    // Phase 6 addition: auto-log this fixed expense as a real ledger transaction
    // at cycle start instead of requiring manual re-entry every cycle.
    autoLogOnCycleStart: v.optional(v.boolean()),
    dueDay: v.optional(v.number()), // 1–31: day of month the bill is due (for reminders)
    createdAt: v.number(),
  }),

  incomeExpectations: defineTable({
    name: v.string(),
    currency: v.string(),
    encryptedExpectedAmount: v.string(),
    createdAt: v.number(),
  }),

  // Singleton
  userSettings: defineTable({
    weeklyReviewEmail: v.boolean(),
    timezone: v.string(),
    primaryCurrency: v.string(), // "PKR"
    // Owner display name — cosmetic only, single-owner app has no email/identity concept.
    name: v.optional(v.string()),
    // Day-of-month (1-31) a new financial cycle starts on. Defaults to 1 when unset
    // (see settings.ts getOrCreate) — was `user.primaryPayday`/`preferredCycleStart` in Postgres.
    primaryPayday: v.optional(v.number()),
    // Fallback starting balance for a brand-new cycle when no prior cycle exists to carry a
    // balance forward from. Was `user.encryptedStartingBalance` in Postgres.
    encryptedStartingBalance: v.optional(v.string()),
    // Manual variable-spending estimate, used until 2+ completed cycles give a historical
    // average. Was `user.encryptedVariableEstimate` in Postgres.
    encryptedVariableEstimate: v.optional(v.string()),
  }),

  // Cache for the Frankfurter exchange-rate fetch (replaces the old Redis 1hr TTL cache).
  // Singleton — one row holding the latest fetch.
  exchangeRatesCache: defineTable({
    ratesPerUsd: v.record(v.string(), v.number()),
    date: v.union(v.string(), v.null()),
    fetchedAt: v.number(),
  }),

  // Singleton — the wrapped DEK
  encryptionKey: defineTable({
    encryptedDek: v.string(),
    dekVersion: v.number(),
    createdAt: v.number(),
  }),

  // ─── Auth: hand-rolled password + TOTP ─────────────────────────────────
  // Singleton
  authCredentials: defineTable({
    // Legacy: login is TOTP-only now. Kept optional so existing rows still validate.
    passwordHash: v.optional(v.string()),
    passwordSalt: v.optional(v.string()),
    passwordIterations: v.optional(v.number()),
    totpSecretEncrypted: v.string(), // app-encrypted with the same DEK mechanism
    lastTotpCounter: v.optional(v.number()), // highest 30s step accepted — blocks code replay
    recoveryCodeHashes: v.array(v.string()), // one-time-use, consumed on use
    createdAt: v.number(),
  }),

  sessions: defineTable({
    tokenHash: v.string(), // sha256(token) — raw token is never stored
    expiresAt: v.number(),
    createdAt: v.number(),
    userAgent: v.optional(v.string()),
  }).index("by_tokenHash", ["tokenHash"]),

  // Minimal login-attempt log (Phase 8 security hardening) — replaces the old
  // generic multi-user AuditLog.
  loginAttempts: defineTable({
    success: v.boolean(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  // ─── Automatic import of bank/wallet alerts (iPhone Shortcut SMS + Gmail script) ───
  ingestConfig: defineTable({
    tokenHash: v.string(), // sha256 of the bearer token; the raw token is shown once
    ownerAliases: v.array(v.string()), // names your own accounts appear under — skipped
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
  }),

  // One row per received message. No message text or plaintext amounts are stored:
  // messageHash dedupes exact repeats, matchKey (sha256 of type+amount) dedupes the same
  // transaction arriving twice (SMS + email, or a bank's double alert) within minutes.
  ingestedMessages: defineTable({
    source: v.union(v.literal("sms"), v.literal("email")),
    messageHash: v.string(),
    status: v.union(v.literal("LOGGED"), v.literal("IGNORED"), v.literal("DUPLICATE")),
    reason: v.optional(v.string()),
    matchKey: v.optional(v.string()),
    eventId: v.optional(v.id("transactionEvents")),
    createdAt: v.number(),
  })
    .index("by_messageHash", ["messageHash"])
    .index("by_matchKey", ["matchKey", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  // ─── Planning: budgets, Zakat, push notifications ───────────────────────
  budgets: defineTable({
    category: v.string(),
    encryptedLimit: v.string(), // monthly limit, app-encrypted like other amounts
    alertMonth: v.optional(v.string()), // "YYYY-MM" the alert levels below apply to
    alertedLevel: v.optional(v.number()), // highest threshold already notified (80 or 100)
    createdAt: v.number(),
  }).index("by_category", ["category"]),

  // Singleton. Inputs are a JSON blob encrypted as a whole (amounts, grams, prices).
  zakatProfile: defineTable({
    encryptedInputs: v.string(),
    zakatDate: v.optional(v.number()), // next Zakat due date (same Hijri date each year)
    lastRemindedFor: v.optional(v.number()), // zakatDate a reminder was already sent for
    updatedAt: v.number(),
  }),

  // Singleton. Daily international spot prices for the Zakat nisab, in PKR per gram (24k gold).
  metalPrices: defineTable({
    goldPerGramPkr: v.number(),
    silverPerGramPkr: v.number(),
    date: v.string(),
    fetchedAt: v.number(),
  }),

  // Singleton. Encrypted JSON of the tax calculator inputs.
  taxProfile: defineTable({
    encryptedInputs: v.string(),
    outdatedNoticeFor: v.optional(v.number()), // tax year we already warned has no rates yet
    updatedAt: v.number(),
  }),

  pushSubscriptions: defineTable({
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    createdAt: v.number(),
  }).index("by_endpoint", ["endpoint"]),

  // ─── Cached AI explanations (keyed by sha256 of scope + question + data) ───
  aiCache: defineTable({
    key: v.string(),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_key", ["key"]),

  // ─── Rate limiting (replaces Redis INCR+EXPIRE) ────────────────────────
  rateLimitCounters: defineTable({
    key: v.string(), // e.g. "login", "export", "ai"
    windowStart: v.number(),
    count: v.number(),
  }).index("by_key_window", ["key", "windowStart"]),
});
