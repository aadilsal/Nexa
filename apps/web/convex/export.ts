import { v } from "convex/values";
import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { requireSession } from "./lib/session";
import { getDekForRead } from "./lib/dek";
import { decryptNumber } from "./lib/crypto";
import { getEffectiveTransactionsRaw } from "./ledger";
import { getSettingsRow } from "./settings";

// Ported from apps/api/src/modules/export/export.service.ts. Pure decryption (no writes),
// so this is a plain query rather than an action. (Audit logging of exports is dropped —
// see the plan's decision to skip the old multi-user AuditLog surface for v1.)

async function buildExportData(ctx: QueryCtx) {
  const settings = await getSettingsRow(ctx);
  const dek = await getDekForRead(ctx);

  const cycles = await ctx.db.query("financialCycles").withIndex("by_startDate").order("desc").collect();

  const allTransactions: Array<{
    description: string; amount: number; category: string; type: string;
    createdAt: string; cycleId: string;
  }> = [];

  for (const cycle of cycles) {
    const txs = await getEffectiveTransactionsRaw(ctx, cycle._id);
    for (const tx of txs) {
      allTransactions.push({
        description: tx.description,
        amount: tx.amount,
        category: tx.category,
        type: tx.type,
        createdAt: new Date(tx.createdAt).toISOString(),
        cycleId: cycle._id,
      });
    }
  }

  const goals = await ctx.db.query("goals").collect();

  return {
    exportedAt: new Date().toISOString(),
    settings: { timezone: settings.timezone, primaryCurrency: settings.primaryCurrency },
    cycles: cycles.map((c) => ({
      id: c._id, startDate: c.startDate, endDate: c.endDate, status: c.status,
    })),
    transactions: allTransactions,
    goals: await Promise.all(
      goals.map(async (g) => ({
        name: g.name,
        priority: g.priority,
        targetAmount: await decryptNumber(g.encryptedTargetAmount, dek),
        isEmergencyFund: g.isEmergencyFund,
      })),
    ),
  };
}

export const exportJson = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    await requireSession(ctx, sessionToken);
    return buildExportData(ctx);
  },
});

export const exportCsv = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }): Promise<string> => {
    await requireSession(ctx, sessionToken);
    const data = await buildExportData(ctx);
    const rows = [
      "type,description,amount,category,transaction_type,date",
      ...data.transactions.map(
        (t) => `transaction,"${t.description.replace(/"/g, '""')}",${t.amount},${t.category},${t.type},${t.createdAt}`,
      ),
    ];
    return rows.join("\n");
  },
});
