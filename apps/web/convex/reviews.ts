import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { calculateWeeklyReview, calculateMonthlyReview, getCalendarWeekBounds, type WeeklyReviewOutput, type MonthlyReviewOutput } from "@nexa/finance-engine";
import * as claude from "./lib/claude";
import type { SerializedEngineInput, EngineOutputWithCurrency } from "./engine";

// Ported from apps/api/src/modules/reviews/reviews.service.ts. Weekly/monthly reviews for the
// Reports pages; AI summaries are cached per period per day (see lib/claude.ts cachedExplain).

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

    const narrative = await claude.cachedExplain(
      ctx,
      "weekly-review",
      { ...review, savingsRatePercent: Math.round(review.savingsRate * 100) },
      "Write a concise weekly financial review summary for the user.",
      { week: review.weekStart, day: claude.todayKey() },
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

    const narrative = await claude.cachedExplain(ctx, "monthly-review", review, "Write a concise monthly financial review summary for the user.", claude.todayKey());
    return { review, narrative };
  },
});
