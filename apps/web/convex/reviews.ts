import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { calculateWeeklyReview, calculateMonthlyReview, getCalendarWeekBounds, type WeeklyReviewOutput, type MonthlyReviewOutput } from "@nexa/finance-engine";
import * as groq from "./lib/groq";
import type { SerializedEngineInput, EngineOutputWithCurrency } from "./engine";

// Ported from apps/api/src/modules/reviews/reviews.service.ts, simplified: the React-Email
// template rendering (@nexa/emails) is dropped in favor of a plain HTML string built here —
// out of scope for today's cutover given Convex's default runtime's React-rendering support
// is unverified; a plain email is a reasonable v1 vs. the visual polish of the old template.

function reconstruct(serialized: SerializedEngineInput) {
  return {
    ...serialized,
    cycle: { ...serialized.cycle, startDate: new Date(serialized.cycle.startDate), endDate: new Date(serialized.cycle.endDate) },
    transactions: serialized.transactions.map((t) => ({ ...t, createdAt: new Date(t.createdAt) })),
    goals: serialized.goals.map((g) => ({ ...g, targetDate: new Date(g.targetDate) })),
    historicalCycles: serialized.historicalCycles.map((c) => ({
      ...c,
      startDate: new Date(c.startDate),
      endDate: new Date(c.endDate),
      transactions: c.transactions.map((t) => ({ ...t, createdAt: new Date(t.createdAt) })),
    })),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getSerialized(ctx: any): Promise<SerializedEngineInput | null> {
  return ctx.runQuery(internal.engine._buildEngineInputSerializable, {});
}

export const getWeeklyReview = action({
  args: { sessionToken: v.string(), referenceDate: v.optional(v.number()) },
  handler: async (ctx, { sessionToken, referenceDate }): Promise<{ review: WeeklyReviewOutput; narrative: string }> => {
    await ctx.runQuery(internal.lib.session._requireSession, { sessionToken });
    const serialized = await getSerialized(ctx);
    if (!serialized) throw new Error("No active cycle yet.");
    const engineInput = reconstruct(serialized);
    const output: EngineOutputWithCurrency | null = await ctx.runQuery(internal.engine._calculateOutputAtCutoff, { cutoff: Date.now() });
    if (!output) throw new Error("No active cycle yet.");

    const timezone = "Asia/Karachi";
    const ref = referenceDate ? new Date(referenceDate) : new Date();
    const { weekStart, weekEnd } = getCalendarWeekBounds(ref, timezone);
    const priorRef = new Date(weekStart);
    priorRef.setDate(priorRef.getDate() - 7);
    const { weekStart: priorStart, weekEnd: priorEnd } = getCalendarWeekBounds(priorRef, timezone);

    const allTransactions = [...engineInput.transactions, ...engineInput.historicalCycles.flatMap((c: (typeof engineInput.historicalCycles)[number]) => c.transactions)];
    const weekTransactions = allTransactions.filter((t) => t.createdAt >= weekStart && t.createdAt <= weekEnd);
    const priorWeekTransactions = allTransactions.filter((t) => t.createdAt >= priorStart && t.createdAt <= priorEnd);

    const outputAtWeekStart: EngineOutputWithCurrency | null = await ctx.runQuery(internal.engine._calculateOutputAtCutoff, { cutoff: weekStart.getTime() });

    const review = calculateWeeklyReview({
      timezone,
      weekStart,
      weekEnd,
      transactions: weekTransactions,
      priorWeekTransactions,
      goals: engineInput.goals,
      goalsAtWeekStart: engineInput.goals.map((goal) => {
        const atWeekStart = outputAtWeekStart?.goals.find(
          (item: NonNullable<typeof outputAtWeekStart>["goals"][number]) => item.id === goal.id,
        );
        return { ...goal, storedCurrentAmount: atWeekStart?.currentAmount ?? goal.storedCurrentAmount };
      }),
      expectedIncome: engineInput.expectedIncome,
      predictedMonthlyExpenses: output.expenses.predictedMonthly,
      savingsRateTarget: output.savings.targetRate,
      safeToSpendAtWeekStart: outputAtWeekStart?.safeToSpend.today,
      safeToSpendAtWeekEnd: output.safeToSpend.today,
      healthScoreAtWeekStart: outputAtWeekStart?.healthScore.overall,
      healthScoreAtWeekEnd: output.healthScore.overall,
    });

    const narrative = await groq.explain(
      { ...review, savingsRatePercent: Math.round(review.savingsRate * 100) },
      "Write a concise weekly financial review summary for the user.",
      500,
    );

    return { review, narrative };
  },
});

export const getMonthlyReview = action({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }): Promise<{ review: MonthlyReviewOutput; narrative: string }> => {
    await ctx.runQuery(internal.lib.session._requireSession, { sessionToken });
    const serialized = await getSerialized(ctx);
    if (!serialized) throw new Error("No active cycle yet.");
    const engineInput = reconstruct(serialized);
    const output: EngineOutputWithCurrency | null = await ctx.runQuery(internal.engine._calculateOutputAtCutoff, { cutoff: Date.now() });
    if (!output) throw new Error("No active cycle yet.");
    const emergencyGoal = output.goals.find((g: (typeof output.goals)[number]) => g.isEmergencyFund);

    const review = calculateMonthlyReview({
      cycleStart: engineInput.cycle.startDate,
      cycleEnd: engineInput.cycle.endDate,
      today: new Date(),
      transactions: engineInput.transactions,
      goals: output.goals,
      predictedMonthlyExpenses: output.expenses.predictedMonthly,
      recurringTotal: output.expenses.recurring,
      emergencyFundProgress: emergencyGoal ? emergencyGoal.progress / 100 : 0,
      healthScore: output.healthScore.overall,
      savingsRate: output.savings.actualRate,
      savingsRateTarget: output.savings.targetRate,
      netCashFlow: output.cash.currentCashAvailable - engineInput.cycle.startingBalance,
    });

    const narrative = await groq.explain(review, "Write a concise monthly financial review summary for the user.", 600);
    return { review, narrative };
  },
});

async function sendViaResend(to: string, subject: string, html: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY not configured" };
  const from = process.env.RESEND_FROM ?? "Nexa <onboarding@resend.dev>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html, text }),
  });
  return { sent: response.ok, reason: response.ok ? undefined : `Resend returned ${response.status}` };
}

/** Called by the weekly cron (crons.ts) — single-owner, so no user loop needed. */
export const sendWeeklyReviewEmail = internalAction({
  args: {},
  handler: async (ctx): Promise<{ sent: boolean; reason?: string }> => {
    const settingsRow = await ctx.runQuery(internal.settings._getRaw, {});
    if (settingsRow && settingsRow.weeklyReviewEmail === false) return { sent: false, reason: "disabled" };

    const serialized = await getSerialized(ctx);
    if (!serialized) return { sent: false, reason: "no active cycle" };

    // Reuse the same building blocks as the on-demand action, without a session token
    // (the cron runs unauthenticated, server-side, on the single owner's own data).
    const engineInput = reconstruct(serialized);
    const output: EngineOutputWithCurrency | null = await ctx.runQuery(internal.engine._calculateOutputAtCutoff, { cutoff: Date.now() });
    if (!output) return { sent: false, reason: "no active cycle" };

    const timezone = "Asia/Karachi";
    const lastWeekRef = new Date();
    lastWeekRef.setDate(lastWeekRef.getDate() - 7);
    const { weekStart, weekEnd } = getCalendarWeekBounds(lastWeekRef, timezone);
    const allTransactions = [...engineInput.transactions, ...engineInput.historicalCycles.flatMap((c: (typeof engineInput.historicalCycles)[number]) => c.transactions)];
    const weekTransactions = allTransactions.filter((t) => t.createdAt >= weekStart && t.createdAt <= weekEnd);
    const outputAtWeekStart: EngineOutputWithCurrency | null = await ctx.runQuery(internal.engine._calculateOutputAtCutoff, { cutoff: weekStart.getTime() });

    const review = calculateWeeklyReview({
      timezone, weekStart, weekEnd,
      transactions: weekTransactions,
      priorWeekTransactions: [],
      goals: engineInput.goals,
      goalsAtWeekStart: engineInput.goals,
      expectedIncome: engineInput.expectedIncome,
      predictedMonthlyExpenses: output.expenses.predictedMonthly,
      savingsRateTarget: output.savings.targetRate,
      safeToSpendAtWeekStart: outputAtWeekStart?.safeToSpend.today,
      safeToSpendAtWeekEnd: output.safeToSpend.today,
      healthScoreAtWeekStart: outputAtWeekStart?.healthScore.overall,
      healthScoreAtWeekEnd: output.healthScore.overall,
    });
    const narrative = await groq.explain(review, "Write a concise weekly financial review summary.", 500);

    const html = `<h1>Your weekly review</h1><p>${narrative}</p>
      <p>Income: ${output.currency} ${review.income}<br/>Spent: ${output.currency} ${review.spent}<br/>Saved: ${output.currency} ${review.saved}</p>
      <p>Health score: ${review.healthScoreChange.end ?? "-"}/100</p>`;
    const text = `Your weekly review\n\n${narrative}\n\nIncome: ${review.income}\nSpent: ${review.spent}\nSaved: ${review.saved}`;

    const to = process.env.OWNER_EMAIL ?? "";
    if (!to) return { sent: false, reason: "OWNER_EMAIL not configured" };
    return sendViaResend(to, `Your Nexa weekly review — ${review.overallRating}`, html, text);
  },
});
