import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@nexa/shared";
import {
  calculateIncomeTax,
  calculateSpendingPace,
  detectRecurring,
  getPeriodBounds,
  nextZakatDate,
  separateLoans,
  summarizeLoans,
  taxYearFor,
} from "@nexa/finance-engine";
import { requireSession } from "./lib/session";
import { getDekForRead, getOrCreateDekForAction } from "./lib/dek";
import { decryptJson, decryptNumber, encryptJson, encryptNumber } from "./lib/crypto";
import { getEffectiveTransactionsInRangeRaw, getEffectiveTransactionsRaw } from "./ledger";
import { getActiveOrPendingRaw } from "./cycles";
import { getCurrencyContext, toPrimary } from "./currencies";
import { notify } from "./push";

// Planning tools: budgets (+ alerts), subscriptions, money lent/borrowed, spending pace,
// end-of-cycle surplus, Zakat and income tax, plus the daily reminder job. All maths lives in
// @nexa/finance-engine; this file loads data, decrypts it and schedules notifications.

const DAY = 24 * 60 * 60 * 1000;
const categoryValidator = v.union(...CATEGORIES.map((c) => v.literal(c)));

const zakatInputsValidator = v.object({
  cash: v.number(),
  goldGrams: v.number(),
  goldPricePerGram: v.number(),
  silverGrams: v.number(),
  silverPricePerGram: v.number(),
  receivables: v.number(),
  investments: v.number(),
  businessStock: v.number(),
  otherAssets: v.number(),
  debtsDueNow: v.number(),
  loanInstallmentsNext12Months: v.number(),
  alreadyDeducted: v.number(),
  nisabBasis: v.union(v.literal("silver"), v.literal("gold")),
});

const taxInputsValidator = v.object({
  salaryIncome: v.number(),
  businessIncome: v.number(),
  itExportIncome: v.number(),
  psebRegistered: v.boolean(),
  filer: v.boolean(),
});

type Ctx = QueryCtx | MutationCtx;

function money(currency: string, amount: number) {
  return `${currency} ${Math.round(amount).toLocaleString("en-PK")}`;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Transactions in [start, end] with amounts converted to the primary currency. */
async function loadTransactions(ctx: Ctx, start: number, end: number) {
  const currency = await getCurrencyContext(ctx);
  const raw = await getEffectiveTransactionsInRangeRaw(ctx, start, end);
  return {
    primaryCurrency: currency.primaryCurrency,
    txs: raw.map((t) => ({
      description: t.description,
      amount: toPrimary(t.amount, t.currency, currency),
      type: t.type,
      category: t.category as string,
      createdAt: t.createdAt,
    })),
  };
}

function spentThisMonth(txs: Array<{ amount: number; type: string; category: string; createdAt: number }>, monthStart: number, category?: string) {
  return txs
    .filter((t) => t.type === "EXPENSE" && t.category !== "LOAN" && t.createdAt >= monthStart && (!category || t.category === category))
    .reduce((s, t) => s + t.amount, 0);
}

// ─── Overview for Home + Plan ────────────────────────────────────────────────────

export const overview = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireSession(ctx, sessionToken);
    const now = new Date();
    const monthStart = getPeriodBounds("month", now).start.getTime();
    const { primaryCurrency, txs } = await loadTransactions(ctx, 0, now.getTime()); // single-owner scale

    const budgetRows = await ctx.db.query("budgets").collect();
    const dek = budgetRows.length ? await getDekForRead(ctx) : null;
    const budgets = await Promise.all(
      budgetRows.map(async (b) => {
        const limit = dek ? await decryptNumber(b.encryptedLimit, dek) : 0;
        const spent = spentThisMonth(txs, monthStart, b.category);
        return {
          id: b._id,
          category: b.category as Category,
          label: CATEGORY_LABELS[b.category as Category] ?? b.category,
          limit,
          spent: Math.round(spent),
          percent: limit > 0 ? Math.round((spent / limit) * 100) : 0,
        };
      }),
    );
    budgets.sort((a, b) => b.percent - a.percent);

    const recurring = detectRecurring(txs.filter((t) => t.createdAt >= now.getTime() - 150 * DAY), now.getTime());

    // End-of-cycle surplus: shown for the first week of a new cycle.
    let surplus: { amount: number } | null = null;
    const current = await getActiveOrPendingRaw(ctx);
    if (current && now.getTime() - current.startDate < 7 * DAY) {
      const completed = await ctx.db.query("financialCycles").withIndex("by_status", (q) => q.eq("status", "COMPLETED")).collect();
      const previous = completed.sort((a, b) => b.endDate - a.endDate)[0];
      if (previous) {
        const currency = await getCurrencyContext(ctx);
        const prevTxs = (await getEffectiveTransactionsRaw(ctx, previous._id)).map((t) => ({ ...t, amount: toPrimary(t.amount, t.currency, currency) }));
        const net = separateLoans(prevTxs).regular.reduce((s, t) => s + (t.type === "INCOME" ? t.amount : -t.amount), 0);
        if (net > 0) surplus = { amount: Math.round(net) };
      }
    }

    return {
      currency: primaryCurrency,
      budgets,
      pace: calculateSpendingPace(txs, now),
      recurring,
      recurringMonthlyTotal: recurring.reduce((s, r) => s + r.monthlyCost, 0),
      loans: summarizeLoans(txs),
      surplus,
    };
  },
});

// ─── Budgets ─────────────────────────────────────────────────────────────────────

export const setBudget = action({
  args: { sessionToken: v.string(), category: categoryValidator, limit: v.number() },
  handler: async (ctx, { sessionToken, category, limit }) => {
    await ctx.runQuery(internal.lib.session._requireSession, { sessionToken });
    if (!(limit > 0)) throw new Error("Budget must be more than zero.");
    const dek = await getOrCreateDekForAction(ctx);
    await ctx.runMutation(internal.planning._upsertBudget, { category, encryptedLimit: await encryptNumber(limit, dek) });
  },
});

export const _upsertBudget = internalMutation({
  args: { category: v.string(), encryptedLimit: v.string() },
  handler: async (ctx, { category, encryptedLimit }) => {
    const existing = await ctx.db.query("budgets").withIndex("by_category", (q) => q.eq("category", category)).first();
    // A new limit re-arms alerts for this month.
    if (existing) await ctx.db.patch(existing._id, { encryptedLimit, alertMonth: undefined, alertedLevel: undefined });
    else await ctx.db.insert("budgets", { category, encryptedLimit, createdAt: Date.now() });
  },
});

export const removeBudget = mutation({
  args: { sessionToken: v.string(), id: v.id("budgets") },
  handler: async (ctx, { sessionToken, id }) => {
    await requireSession(ctx, sessionToken);
    await ctx.db.delete(id);
  },
});

/** After an expense is logged: notify once per month when a budget crosses 80% and 100%. */
export const _checkBudget = internalMutation({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    const budget = await ctx.db.query("budgets").withIndex("by_category", (q) => q.eq("category", category)).first();
    if (!budget) return;
    const now = new Date();
    const monthStart = getPeriodBounds("month", now).start.getTime();
    const { primaryCurrency, txs } = await loadTransactions(ctx, monthStart, now.getTime());
    const limit = await decryptNumber(budget.encryptedLimit, await getDekForRead(ctx));
    const spent = spentThisMonth(txs, monthStart, category);
    const percent = limit > 0 ? (spent / limit) * 100 : 0;
    const level = percent >= 100 ? 100 : percent >= 80 ? 80 : 0;
    const key = monthKey(now);
    const already = budget.alertMonth === key ? (budget.alertedLevel ?? 0) : 0;
    if (level <= already) return;

    await ctx.db.patch(budget._id, { alertMonth: key, alertedLevel: level });
    const label = CATEGORY_LABELS[category as Category] ?? category;
    await notify(ctx, {
      title: level === 100 ? `${label} budget used up` : `80% of ${label} budget used`,
      body:
        level === 100
          ? `You've spent ${money(primaryCurrency, spent)} of ${money(primaryCurrency, limit)} this month.`
          : `${money(primaryCurrency, limit - spent)} left for the rest of the month.`,
      url: "/plan/budgets",
    });
  },
});

// ─── Zakat ───────────────────────────────────────────────────────────────────────

export const getZakat = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireSession(ctx, sessionToken);
    const row = await ctx.db.query("zakatProfile").first();
    const { txs } = await loadTransactions(ctx, 0, Date.now());
    return {
      inputs: row ? await decryptJson<Record<string, unknown>>(row.encryptedInputs, await getDekForRead(ctx)) : null,
      zakatDate: row?.zakatDate ?? null,
      suggestedReceivables: summarizeLoans(txs).owedToYou,
    };
  },
});

export const saveZakat = action({
  args: { sessionToken: v.string(), inputs: zakatInputsValidator, zakatDate: v.optional(v.number()) },
  handler: async (ctx, { sessionToken, inputs, zakatDate }) => {
    await ctx.runQuery(internal.lib.session._requireSession, { sessionToken });
    const dek = await getOrCreateDekForAction(ctx);
    await ctx.runMutation(internal.planning._putZakat, { encryptedInputs: await encryptJson(inputs, dek), zakatDate });
  },
});

export const _putZakat = internalMutation({
  args: { encryptedInputs: v.string(), zakatDate: v.optional(v.number()) },
  handler: async (ctx, { encryptedInputs, zakatDate }) => {
    const row = await ctx.db.query("zakatProfile").first();
    if (row) await ctx.db.patch(row._id, { encryptedInputs, zakatDate, updatedAt: Date.now() });
    else await ctx.db.insert("zakatProfile", { encryptedInputs, zakatDate, updatedAt: Date.now() });
  },
});

// ─── Income tax ──────────────────────────────────────────────────────────────────

export const getTax = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireSession(ctx, sessionToken);
    const now = new Date();
    const taxYear = taxYearFor(now);
    const yearStart = new Date(taxYear - 1, 6, 1).getTime(); // 1 July
    const { txs } = await loadTransactions(ctx, yearStart, now.getTime());
    const incomeSoFar = txs.filter((t) => t.type === "INCOME" && t.category !== "LOAN").reduce((s, t) => s + t.amount, 0);
    const elapsed = Math.max(1 / 12, (now.getTime() - yearStart) / (365 * DAY));
    const row = await ctx.db.query("taxProfile").first();
    return {
      taxYear,
      incomeSoFar: Math.round(incomeSoFar),
      projectedAnnualIncome: Math.round(incomeSoFar / elapsed),
      inputs: row ? await decryptJson<Record<string, unknown>>(row.encryptedInputs, await getDekForRead(ctx)) : null,
    };
  },
});

export const saveTax = action({
  args: { sessionToken: v.string(), inputs: taxInputsValidator },
  handler: async (ctx, { sessionToken, inputs }) => {
    await ctx.runQuery(internal.lib.session._requireSession, { sessionToken });
    const dek = await getOrCreateDekForAction(ctx);
    await ctx.runMutation(internal.planning._putTax, { encryptedInputs: await encryptJson(inputs, dek) });
  },
});

export const _putTax = internalMutation({
  args: { encryptedInputs: v.string() },
  handler: async (ctx, { encryptedInputs }) => {
    const row = await ctx.db.query("taxProfile").first();
    if (row) await ctx.db.patch(row._id, { encryptedInputs, updatedAt: Date.now() });
    else await ctx.db.insert("taxProfile", { encryptedInputs, updatedAt: Date.now() });
  },
});

// ─── Daily reminders (cron, 9am Pakistan time) ───────────────────────────────────

export const _dailyReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const pkt = new Date(now + 5 * 60 * 60 * 1000); // Pakistan is UTC+5, no DST
    const tomorrow = new Date(Date.UTC(pkt.getUTCFullYear(), pkt.getUTCMonth(), pkt.getUTCDate() + 1));
    const tomorrowDay = tomorrow.getUTCDate();
    const lastDayOfMonth = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth() + 1, 0)).getUTCDate();
    const { primaryCurrency } = await getCurrencyContext(ctx);

    // Bills due tomorrow (a due day past month-end falls on the last day).
    const bills = (await ctx.db.query("fixedExpenses").collect()).filter(
      (b) => b.dueDay && Math.min(b.dueDay, lastDayOfMonth) === tomorrowDay,
    );
    if (bills.length) {
      const dek = await getDekForRead(ctx);
      for (const bill of bills) {
        const amount = await decryptNumber(bill.encryptedExpectedAmount, dek);
        await notify(ctx, { title: `${bill.name} is due tomorrow`, body: money(primaryCurrency, amount), url: "/profile/plan" });
      }
    }

    // Zakat: remind once in the 7 days before the date, then roll to next lunar year.
    const zakat = await ctx.db.query("zakatProfile").first();
    if (zakat?.zakatDate) {
      if (now > zakat.zakatDate + DAY) {
        await ctx.db.patch(zakat._id, { zakatDate: nextZakatDate(new Date(zakat.zakatDate)).getTime() });
      } else if (zakat.zakatDate - now <= 7 * DAY && zakat.lastRemindedFor !== zakat.zakatDate) {
        const days = Math.max(0, Math.ceil((zakat.zakatDate - now) / DAY));
        await ctx.db.patch(zakat._id, { lastRemindedFor: zakat.zakatDate });
        await notify(ctx, {
          title: days === 0 ? "Your Zakat is due today" : `Zakat due in ${days} day${days === 1 ? "" : "s"}`,
          body: "Open Nexa to review your savings and the amount due.",
          url: "/plan/zakat",
        });
      }
    }

    // New tax year without rates yet → warn once instead of silently using last year's.
    const taxYear = taxYearFor(new Date(now));
    const check = calculateIncomeTax({ salaryIncome: 0, businessIncome: 0, itExportIncome: 0, psebRegistered: false, filer: true, taxYear });
    if (check.ratesOutdated) {
      const tax = await ctx.db.query("taxProfile").first();
      if (tax && tax.outdatedNoticeFor !== taxYear) {
        await ctx.db.patch(tax._id, { outdatedNoticeFor: taxYear });
        await notify(ctx, {
          title: `Tax Year ${taxYear} rates not added yet`,
          body: `Nexa is still using Tax Year ${check.taxYear} rates until the new Finance Act is added.`,
          url: "/plan/tax",
        });
      }
    }
  },
});
