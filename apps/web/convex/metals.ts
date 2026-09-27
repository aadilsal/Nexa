import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// Daily gold/silver spot prices for the Zakat calculator (free, keyless feed served via jsDelivr).
// Prices are international spot for 24k gold / pure silver; local sarafa rates can be entered
// on the Zakat page to override them.

const FEED = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies";
const GRAMS_PER_TROY_OUNCE = 31.1034768;

export const _get = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("metalPrices").first(),
});

export const _put = internalMutation({
  args: { goldPerGramPkr: v.number(), silverPerGramPkr: v.number(), date: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db.query("metalPrices").first();
    if (row) await ctx.db.patch(row._id, { ...args, fetchedAt: Date.now() });
    else await ctx.db.insert("metalPrices", { ...args, fetchedAt: Date.now() });
  },
});

async function ouncePricePkr(metal: "xau" | "xag"): Promise<{ pkr: number; date: string } | null> {
  try {
    const res = await fetch(`${FEED}/${metal}.json`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { date: string } & Record<string, Record<string, number>>;
    const pkr = json[metal]?.pkr;
    return pkr && pkr > 0 ? { pkr, date: json.date } : null;
  } catch {
    return null;
  }
}

export const _fetch = internalAction({
  args: {},
  handler: async (ctx) => {
    const [gold, silver] = await Promise.all([ouncePricePkr("xau"), ouncePricePkr("xag")]);
    if (!gold || !silver) return { updated: false };
    await ctx.runMutation(internal.metals._put, {
      goldPerGramPkr: gold.pkr / GRAMS_PER_TROY_OUNCE,
      silverPerGramPkr: silver.pkr / GRAMS_PER_TROY_OUNCE,
      date: gold.date,
    });
    return { updated: true };
  },
});

/** Zakat page calls this when no prices are cached yet (before the first daily run). */
export const refresh = action({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }): Promise<{ updated: boolean }> => {
    await ctx.runQuery(internal.lib.session._requireSession, { sessionToken });
    return ctx.runAction(internal.metals._fetch, {});
  },
});
