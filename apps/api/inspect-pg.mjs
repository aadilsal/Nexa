// Read-only inspection — counts and non-sensitive fields only, no decryption, no ciphertext printed.
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const envContents = readFileSync("F:/Projects/Nexa/.env", "utf8");
const dbUrlMatch = envContents.match(/^DATABASE_URL=(.+)$/m);
process.env.DATABASE_URL = dbUrlMatch[1].trim();

const prisma = new PrismaClient();

const [users, cycles, events, goals, fixedExpenses, incomeExpectations, settings, encKeys] =
  await Promise.all([
    prisma.user.findMany({ select: { id: true, email: true, createdAt: true, onboardingComplete: true } }),
    prisma.financialCycle.count(),
    prisma.transactionEvent.count(),
    prisma.goal.count(),
    prisma.fixedExpense.count(),
    prisma.incomeExpectation.count(),
    prisma.userSettings.count(),
    prisma.encryptionKey.count(),
  ]);

console.log("Users:", users.map((u) => ({ id: u.id, email: u.email, onboardingComplete: u.onboardingComplete })));
console.log("FinancialCycle count:", cycles);
console.log("TransactionEvent count:", events);
console.log("Goal count:", goals);
console.log("FixedExpense count:", fixedExpenses);
console.log("IncomeExpectation count:", incomeExpectations);
console.log("UserSettings count:", settings);
console.log("EncryptionKey count:", encKeys);

// Event type breakdown, per cycle counts (structure only, no payload content)
const eventTypeBreakdown = await prisma.transactionEvent.groupBy({
  by: ["eventType"],
  _count: true,
});
console.log("Event type breakdown:", eventTypeBreakdown);

const cyclesDetail = await prisma.financialCycle.findMany({
  select: { id: true, userId: true, startDate: true, endDate: true, status: true },
  orderBy: { startDate: "asc" },
});
console.log("Cycles:", cyclesDetail);

await prisma.$disconnect();
