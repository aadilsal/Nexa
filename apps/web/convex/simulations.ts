import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { simulatePurchase, type EngineInput, type PurchaseSimulationOutput } from "@nexa/finance-engine";
import { normalizeCurrency } from "@nexa/shared";
import type { SerializedEngineInput } from "./engine";

// Ported from apps/api/src/modules/simulations/simulations.service.ts ("can I buy this?").

export const purchase = action({
  args: {
    sessionToken: v.string(),
    itemName: v.string(),
    amount: v.number(),
    currency: v.optional(v.string()),
    purchaseDate: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { sessionToken, itemName, amount, currency, purchaseDate },
  ): Promise<PurchaseSimulationOutput & { explanation: string; currency: string }> => {
    await ctx.runQuery(internal.lib.session._requireSession, { sessionToken });

    const serialized: SerializedEngineInput | null = await ctx.runQuery(internal.engine._buildEngineInputSerializable, {});
    if (!serialized) throw new Error("No active cycle — nothing to simulate against yet.");

    const primaryCurrency = await ctx.runQuery(internal.engine._getPrimaryCurrency, {});
    const rates = await ctx.runQuery(internal.currencies._getCacheRaw, {});
    const from = normalizeCurrency(currency, primaryCurrency);
    const amountInPrimary =
      from === primaryCurrency || !rates
        ? amount
        : Math.round((amount / (rates.ratesPerUsd[from] ?? 1)) * (rates.ratesPerUsd[primaryCurrency] ?? 1));

    const engineInput: EngineInput = {
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

    const result = simulatePurchase(engineInput, {
      itemName,
      amount: amountInPrimary,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
    });

    // Deterministic explanation from the rule that fired — no AI call needed for a verdict the
    // engine already reasoned out.
    const worstGoal = [...result.impacts.goalDelays].sort((a, b) => b.delayDays - a.delayDays)[0];
    const reasons: Record<string, string> = {
      R1: "It would leave your emergency fund below 3 months of expenses.",
      R2: worstGoal ? `It would push your "${worstGoal.goalName}" goal back by ${worstGoal.delayDays} days.` : "It would delay one of your goals by more than a month.",
      R3: "It would drop your savings rate below your target this cycle.",
      R5: "It's more than you have left to spend this cycle.",
      R4: "It fits your budget without hurting your savings or goals.",
    };
    const wait = result.suggestedWaitUntil ? ` Waiting until ${new Date(result.suggestedWaitUntil).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} would make it safe.` : "";
    const explanation = `${reasons[result.triggeredRule ?? "R4"]}${result.recommendation === "WAIT" ? wait : ""}`;

    return { ...result, explanation, currency: primaryCurrency };
  },
});
