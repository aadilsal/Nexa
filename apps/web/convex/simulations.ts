import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { simulatePurchase, type EngineInput, type PurchaseSimulationOutput } from "@nexa/finance-engine";
import { normalizeCurrency } from "@nexa/shared";
import * as groq from "./lib/groq";
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

    const explanation = await groq.explain(
      {
        itemName,
        amount: amountInPrimary,
        currency: primaryCurrency,
        recommendation: result.recommendation,
        triggeredRule: result.triggeredRule,
        impacts: result.impacts,
        suggestedWaitUntil: result.suggestedWaitUntil,
      },
      `Explain why the recommendation is ${result.recommendation} for buying ${itemName} at ${primaryCurrency} ${amountInPrimary}.`,
      500,
    );

    return { ...result, explanation, currency: primaryCurrency };
  },
});
