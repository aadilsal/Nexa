// One-time production data migration: Postgres (old NestJS/Prisma system) -> Convex.
//
// Safety properties (per the project plan's Phase 3):
// - Only the single wrapped DEK is ever unwrapped locally (via Node's `crypto`, matching
//   apps/api/src/common/encryption/encryption.service.ts exactly) and immediately re-wrapped
//   under the new Convex-side KEK. It is held only in local variables for this script's
//   lifetime, never written to disk, never logged.
// - Every transaction/goal/fixed-expense/income ciphertext field is copied byte-for-byte —
//   never decrypted-and-re-encrypted, so it's provably unchanged in transit.
// - The verification pass DOES decrypt (on both sides) to diff old vs. new, since that's the
//   only way to actually prove correctness — but only aggregate pass/fail + counts are logged,
//   never the decrypted values themselves.
// - Run this locally only, never in CI or a shared environment.
import { PrismaClient } from "@prisma/client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { readFileSync } from "node:fs";
import { createDecipheriv } from "node:crypto";

const rootEnvPath = new URL("../../../.env", import.meta.url);
const rootEnv = readFileSync(rootEnvPath, "utf8");
function envVar(name) {
  const m = rootEnv.match(new RegExp(`^${name}=(.+)$`, "m"));
  if (!m) throw new Error(`${name} not found in root .env`);
  return m[1].trim();
}
process.env.DATABASE_URL = envVar("DATABASE_URL");
const OLD_KEK_HEX = envVar("KEK");

const CONVEX_URL =
  process.env.CONVEX_URL_OVERRIDE?.trim() ??
  readFileSync(new URL("../.env.local", import.meta.url), "utf8").match(
    /^NEXT_PUBLIC_CONVEX_URL=(.+)$/m,
  )[1].trim();

const OWNER_EMAIL = process.env.MIGRATE_OWNER_EMAIL ?? "aadilsalman786@gmail.com";

const prisma = new PrismaClient();
const convex = new ConvexHttpClient(CONVEX_URL);

// --- Node-side AES-256-GCM, matching the old encryption.service.ts wire format exactly ---
// Raw-bytes variant (no utf8 round-trip) — required for the DEK, which is random binary,
// not text. Using nodeDecrypt's .toString("utf8") on it corrupts the bytes.
function nodeDecryptRaw(payloadB64, keyBytes) {
  const buf = Buffer.from(payloadB64, "base64");
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", keyBytes, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function nodeDecrypt(payloadB64, keyBytes) {
  return nodeDecryptRaw(payloadB64, keyBytes).toString("utf8");
}

function unwrapOldDek(encryptedDekB64, oldKekHex) {
  const kekBytes = Buffer.from(oldKekHex, "hex");
  return nodeDecryptRaw(encryptedDekB64, kekBytes);
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (!user) throw new Error(`User with that email not found`);
  console.log("Migrating owner account (id):", user.id);

  // 1. Encryption key — the one thing that genuinely gets decrypted (just the DEK itself).
  const encKeyRow = await prisma.encryptionKey.findUnique({ where: { userId: user.id } });
  if (!encKeyRow) throw new Error("No EncryptionKey row for this user");
  const dekBytes = unwrapOldDek(encKeyRow.encryptedDek, OLD_KEK_HEX);
  await convex.action(api.migration.importEncryptionKey, {
    dekBase64: dekBytes.toString("base64"),
  });
  console.log("Encryption key imported (re-wrapped under the new KEK).");

  // 2. Cycles — skip any with zero events (known duplicate/orphan from the old system).
  const allCycles = await prisma.financialCycle.findMany({
    where: { userId: user.id },
    orderBy: { startDate: "asc" },
  });
  const eventCounts = await prisma.transactionEvent.groupBy({
    by: ["cycleId"],
    _count: true,
    where: { userId: user.id },
  });
  const cyclesWithData = new Set(eventCounts.filter((e) => e._count > 0).map((e) => e.cycleId));
  const cycleIdMap = new Map();

  for (const cycle of allCycles) {
    if (!cyclesWithData.has(cycle.id)) {
      console.log(`Skipping empty cycle ${cycle.id} (no transaction events).`);
      continue;
    }
    const newId = await convex.mutation(api.migration.importCycle, {
      startDate: cycle.startDate.getTime(),
      endDate: cycle.endDate.getTime(),
      status: cycle.status,
      encryptedStartingBalance: cycle.encryptedStartingBalance ?? undefined,
      encryptedEndingBalance: cycle.encryptedEndingBalance ?? undefined,
      createdAt: cycle.createdAt.getTime(),
    });
    cycleIdMap.set(cycle.id, newId);
  }
  console.log(`Migrated ${cycleIdMap.size} cycles.`);

  // 3. Transaction events, per cycle, strictly in ascending createdAt order so the hash
  //    chain reconstructs identically, remapping originalEventId references as we go.
  let totalEvents = 0;
  for (const [oldCycleId, newCycleId] of cycleIdMap) {
    const events = await prisma.transactionEvent.findMany({
      where: { cycleId: oldCycleId },
      orderBy: { createdAt: "asc" },
    });
    const eventIdMap = new Map();
    for (const ev of events) {
      let newOriginalEventId;
      if (ev.originalEventId) {
        newOriginalEventId = eventIdMap.get(ev.originalEventId);
        if (!newOriginalEventId) {
          throw new Error(
            `Cannot remap originalEventId ${ev.originalEventId} for event ${ev.id} — events out of order?`,
          );
        }
      }
      const result = await convex.action(api.migration.importTransactionEvent, {
        cycleId: newCycleId,
        eventType: ev.eventType,
        originalEventId: newOriginalEventId,
        encryptedPayload: ev.encryptedPayload,
        createdAtOverride: ev.createdAt.getTime(),
      });
      eventIdMap.set(ev.id, result.eventId);
      totalEvents++;
    }
  }
  console.log(`Migrated ${totalEvents} transaction events.`);

  // 4. Goals
  const goals = await prisma.goal.findMany({ where: { userId: user.id } });
  for (const g of goals) {
    await convex.mutation(api.migration.importGoal, {
      name: g.name,
      priority: g.priority,
      targetDate: g.targetDate.getTime(),
      currency: g.currency,
      encryptedTargetAmount: g.encryptedTargetAmount,
      encryptedCurrentAmount: g.encryptedCurrentAmount ?? undefined,
      isEmergencyFund: g.isEmergencyFund,
      isActive: g.isActive,
      createdAt: g.createdAt.getTime(),
    });
  }
  console.log(`Migrated ${goals.length} goals.`);

  // 5. Fixed expenses
  const fixedExpenses = await prisma.fixedExpense.findMany({ where: { userId: user.id } });
  for (const fe of fixedExpenses) {
    await convex.mutation(api.migration.importFixedExpense, {
      name: fe.name,
      category: fe.category,
      currency: fe.currency,
      encryptedExpectedAmount: fe.encryptedExpectedAmount,
      createdAt: fe.createdAt.getTime(),
    });
  }
  console.log(`Migrated ${fixedExpenses.length} fixed expenses.`);

  // 6. Income expectations
  const incomes = await prisma.incomeExpectation.findMany({ where: { userId: user.id } });
  for (const inc of incomes) {
    await convex.mutation(api.migration.importIncomeExpectation, {
      name: inc.name,
      currency: inc.currency,
      encryptedExpectedAmount: inc.encryptedExpectedAmount,
      createdAt: inc.createdAt.getTime(),
    });
  }
  console.log(`Migrated ${incomes.length} income expectations.`);

  // 7. User settings (folds Postgres's `User` + `UserSettings` into one Convex singleton row)
  const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } });
  await convex.mutation(api.migration.importUserSettings, {
    weeklyReviewEmail: settings?.weeklyReviewEmail ?? true,
    timezone: settings?.timezone ?? "Asia/Karachi",
    primaryCurrency: settings?.primaryCurrency ?? "PKR",
    name: user.name ?? undefined,
    primaryPayday: user.primaryPayday ?? user.preferredCycleStart ?? undefined,
    encryptedStartingBalance: user.encryptedStartingBalance ?? undefined,
    encryptedVariableEstimate: user.encryptedVariableEstimate ?? undefined,
  });
  console.log("Migrated user settings.");

  // --- Verification pass: replay both sides, diff decrypted results, log only pass/fail ---
  console.log("\nVerifying...");
  let mismatchedCycles = 0;
  let verifiedCount = 0;

  for (const [oldCycleId, newCycleId] of cycleIdMap) {
    const events = await prisma.transactionEvent.findMany({
      where: { cycleId: oldCycleId },
      orderBy: { createdAt: "asc" },
    });
    const deletedIds = new Set();
    const corrections = new Map();
    const creates = new Map();
    for (const ev of events) {
      if (ev.eventType === "CREATE") creates.set(ev.id, ev);
      else if (ev.eventType === "CORRECTION") corrections.set(ev.originalEventId, ev);
      else if (ev.eventType === "DELETE") deletedIds.add(ev.originalEventId);
    }
    const oldEffective = [];
    for (const [id, createEv] of creates) {
      if (deletedIds.has(id)) continue;
      const survivor = corrections.get(id) ?? createEv;
      const payload = JSON.parse(nodeDecrypt(survivor.encryptedPayload, dekBytes));
      oldEffective.push({
        description: payload.description,
        amount: payload.amount,
        category: payload.category,
        type: payload.type,
        createdAt: createEv.createdAt.getTime(),
      });
    }
    oldEffective.sort((a, b) => a.createdAt - b.createdAt);

    const newEffective = await convex.query(api.ledger.getEffectiveTransactions, {
      cycleId: newCycleId,
    });
    const newSimplified = newEffective
      .map((t) => ({
        description: t.description,
        amount: t.amount,
        category: t.category,
        type: t.type,
        createdAt: t.createdAt,
      }))
      .sort((a, b) => a.createdAt - b.createdAt);

    verifiedCount += oldEffective.length;
    const matches = JSON.stringify(oldEffective) === JSON.stringify(newSimplified);
    if (!matches) {
      mismatchedCycles++;
      console.error(
        `MISMATCH in cycle ${oldCycleId} -> ${newCycleId}: old has ${oldEffective.length} effective transactions, new has ${newSimplified.length}.`,
      );
    }
  }

  if (mismatchedCycles === 0) {
    console.log(
      `\nVerification PASSED — ${verifiedCount} effective transactions match exactly between old and new systems across ${cycleIdMap.size} cycles.`,
    );
  } else {
    console.error(
      `\nVerification FAILED — ${mismatchedCycles} cycle(s) had mismatches. Do NOT cut over yet.`,
    );
    process.exitCode = 1;
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exitCode = 1;
});
