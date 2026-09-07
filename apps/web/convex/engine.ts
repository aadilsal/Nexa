import { v } from "convex/values";
import { query, internalQuery } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { calculateEngineOutput, diffEngineOutput, type EngineInput } from "@nexa/finance-engine";
import { requireSession } from "./lib/session";
import { getDekForRead } from "./lib/dek";
import { decryptNumber } from "./lib/crypto";
import { getActiveOrPendingRaw, resolveStartingBalanceNumber } from "./cycles";
import { getEffectiveTransactionsRaw } from "./ledger";
import { listActiveRaw as listActiveGoalsRaw } from "./goals";
import { listFixedExpensesRaw, listIncomeExpectationsRaw } from "./financialPlan";
import { getSettingsRow } from "./settings";
import { getCurrencyContext, toPrimary } from "./currencies";

// Ported from apps/api/src/modules/engine/engine-data.service.ts. A plain reactive query —
// no Redis snapshot cache needed, Convex queries recompute live and are cheap at personal
// scale. `engineSnapshots` stays as an audit-trail table only (not read here).

/** Builds the full EngineInput by composing cycle + ledger + goals + financial-plan data,
 *  exactly mirroring the old EngineDataService.buildEngineInput. Exported so dashboard.ts,
 *  reports.ts, and transactions.ts (for the post-log diff) can reuse it. */
export async function buildEngineInput(ctx: QueryCtx): Promise<EngineInput | null> {
  const cycle = await getActiveOrPendingRaw(ctx);
  if (!cycle) return null;

  const dek = await getDekForRead(ctx);
  const settings = await getSettingsRow(ctx);
  const currencyCtx = await getCurrencyContext(ctx);

  const startingBalance = await resolveStartingBalanceNumber(cycle, settings, dek);
  const rawTransactions = await getEffectiveTransactionsRaw(ctx, cycle._id);
  const goals = await listActiveGoalsRaw(ctx);
  const fixedExpenses = await listFixedExpensesRaw(ctx);
  const incomeExpectations = await listIncomeExpectationsRaw(ctx);

  const completedCycles = await ctx.db
    .query("financialCycles")
    .withIndex("by_status", (q) => q.eq("status", "COMPLETED"))
    .order("desc")
    .take(3);

  const recurringTotal = (
    await Promise.all(fixedExpenses.map((e) => decryptNumber(e.encryptedExpectedAmount, dek)))
  ).reduce((sum, amount, i) => sum + toPrimary(amount, fixedExpenses[i].currency, currencyCtx), 0);

  const expectedIncome = (
    await Promise.all(incomeExpectations.map((i) => decryptNumber(i.encryptedExpectedAmount, dek)))
  ).reduce((sum, amount, i) => sum + toPrimary(amount, incomeExpectations[i].currency, currencyCtx), 0);

  const variableEstimate = settings.encryptedVariableEstimate
    ? toPrimary(await decryptNumber(settings.encryptedVariableEstimate, dek), currencyCtx.primaryCurrency, currencyCtx)
    : 0;

  const engineGoals: EngineInput["goals"] = await Promise.all(
    goals.map(async (g) => ({
      id: g._id,
      name: g.name,
      priority: g.priority,
      targetAmount: toPrimary(await decryptNumber(g.encryptedTargetAmount, dek), g.currency, currencyCtx),
      targetDate: new Date(g.targetDate),
      isEmergencyFund: g.isEmergencyFund,
      storedCurrentAmount: g.encryptedCurrentAmount
        ? toPrimary(await decryptNumber(g.encryptedCurrentAmount, dek), g.currency, currencyCtx)
        : 0,
    })),
  );

  const engineFixedExpenses: EngineInput["fixedExpenses"] = await Promise.all(
    fixedExpenses.map(async (e) => ({
      name: e.name,
      category: e.category,
      expectedAmount: toPrimary(await decryptNumber(e.encryptedExpectedAmount, dek), e.currency, currencyCtx),
    })),
  );

  const transactions: EngineInput["transactions"] = rawTransactions.map((tx) => ({
    amount: toPrimary(tx.amount, tx.currency, currencyCtx),
    type: tx.type,
    category: tx.category,
    createdAt: new Date(tx.createdAt),
  }));

  const historicalCycles: EngineInput["historicalCycles"] = await Promise.all(
    completedCycles.map(async (c) => {
      const raw = await getEffectiveTransactionsRaw(ctx, c._id);
      return {
        startDate: new Date(c.startDate),
        endDate: new Date(c.endDate),
        transactions: raw.map((tx) => ({
          amount: toPrimary(tx.amount, tx.currency, currencyCtx),
          type: tx.type,
          category: tx.category,
          createdAt: new Date(tx.createdAt),
        })),
        recurringTotal,
      };
    }),
  );

  return {
    cycle: {
      id: cycle._id,
      startDate: new Date(cycle.startDate),
      endDate: new Date(cycle.endDate),
      status: cycle.status,
      startingBalance,
    },
    transactions,
    goals: engineGoals,
    fixedExpenses: engineFixedExpenses,
    expectedIncome,
    variableEstimate,
    completedCyclesCount: completedCycles.length,
    historicalCycles,
  };
}

export const get = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireSession(ctx, sessionToken);
    const input = await buildEngineInput(ctx);
    if (!input) return null;
    const currencyCtx = await getCurrencyContext(ctx);
    return { ...calculateEngineOutput(input), currency: currencyCtx.primaryCurrency };
  },
});

/** Internal — called (via ctx.runQuery) right after transactions.create commits a new
 *  ledger event, to report the before/after impact of that one transaction (plus the raw
 *  cash position, which the old TransactionsService.create returned alongside the engine
 *  diff). Mirrors EngineDataService.calculateDiffForNewTransaction. No sessionToken: only
 *  ever called server-side from another already-authenticated action. */
export const _diffForNewTransaction = internalQuery({
  args: {},
  handler: async (ctx) => {
    const input = await buildEngineInput(ctx);
    if (!input) throw new Error("No active cycle.");

    const cashUpTo = (txs: EngineInput["transactions"]) =>
      input.cycle.startingBalance + txs.reduce((sum, tx) => sum + (tx.type === "INCOME" ? tx.amount : -tx.amount), 0);

    if (input.transactions.length === 0) {
      const after = calculateEngineOutput(input);
      const cash = cashUpTo(input.transactions);
      return {
        cash: { before: cash, after: cash },
        safeToSpend: { before: after.safeToSpend.today, after: after.safeToSpend.today },
        healthScore: { before: after.healthScore.overall, after: after.healthScore.overall },
        goalImpact: after.goals.map((g) => ({
          goalName: g.name, etaBefore: g.eta, etaAfter: g.eta, stillOnTrack: g.onTrack,
        })),
      };
    }

    const beforeInput = { ...input, transactions: input.transactions.slice(0, -1) };
    const before = calculateEngineOutput(beforeInput);
    const after = calculateEngineOutput(input);
    return {
      cash: { before: cashUpTo(beforeInput.transactions), after: cashUpTo(input.transactions) },
      ...diffEngineOutput(before, after),
    };
  },
});

export const _getPrimaryCurrency = internalQuery({
  args: {},
  handler: async (ctx) => (await getCurrencyContext(ctx)).primaryCurrency,
});

export type EngineOutputWithCurrency = ReturnType<typeof calculateEngineOutput> & { currency: string };

/** Engine output as of a past cutoff — only transactions created strictly before it count.
 *  Used by reviews.ts to compare "safe to spend at week start" vs "at week end". */
export const _calculateOutputAtCutoff = internalQuery({
  args: { cutoff: v.number() },
  handler: async (ctx, { cutoff }): Promise<EngineOutputWithCurrency | null> => {
    const input = await buildEngineInput(ctx);
    if (!input) return null;
    const currencyCtx = await getCurrencyContext(ctx);
    const filtered = { ...input, transactions: input.transactions.filter((t) => t.createdAt.getTime() < cutoff), today: new Date(cutoff) };
    return { ...calculateEngineOutput(filtered), currency: currencyCtx.primaryCurrency };
  },
});

export interface SerializedEngineInput {
  cycle: Omit<EngineInput["cycle"], "startDate" | "endDate"> & { startDate: number; endDate: number };
  transactions: Array<Omit<EngineInput["transactions"][number], "createdAt"> & { createdAt: number }>;
  goals: Array<Omit<EngineInput["goals"][number], "targetDate"> & { targetDate: number }>;
  fixedExpenses: EngineInput["fixedExpenses"];
  expectedIncome: number;
  variableEstimate: number;
  completedCyclesCount: number;
  historicalCycles: Array<{
    startDate: number;
    endDate: number;
    recurringTotal: number;
    transactions: Array<Omit<EngineInput["transactions"][number], "createdAt"> & { createdAt: number }>;
  }>;
}

/** Serializable variant of buildEngineInput (Date -> epoch ms) for action callers
 *  (simulations.ts, reviews.ts) that can't use the plain function directly — actions have
 *  no ctx.db, and Convex return values can't carry Date objects over the wire. */
export const _buildEngineInputSerializable = internalQuery({
  args: {},
  handler: async (ctx): Promise<SerializedEngineInput | null> => {
    const input = await buildEngineInput(ctx);
    if (!input) return null;
    return {
      ...input,
      cycle: { ...input.cycle, startDate: input.cycle.startDate.getTime(), endDate: input.cycle.endDate.getTime() },
      transactions: input.transactions.map((t) => ({ ...t, createdAt: t.createdAt.getTime() })),
      goals: input.goals.map((g) => ({ ...g, targetDate: g.targetDate.getTime() })),
      historicalCycles: input.historicalCycles.map((c) => ({
        ...c,
        startDate: c.startDate.getTime(),
        endDate: c.endDate.getTime(),
        transactions: c.transactions.map((t) => ({ ...t, createdAt: t.createdAt.getTime() })),
      })),
    };
  },
});
