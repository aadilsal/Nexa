import { forwardRef, Inject, Injectable } from "@nestjs/common";
import {
  computeCycleDates,
  computeNextCycleDates,
  computePersistedGoalAmounts,
} from "@nexa/finance-engine";
import { PrismaService } from "../../common/prisma/prisma.module";
import { UserEncryptionService } from "../../common/encryption/user-encryption.service";
import { LedgerService } from "../transactions/ledger.service";

@Injectable()
export class CyclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userEncryption: UserEncryptionService,
    @Inject(forwardRef(() => LedgerService))
    private readonly ledger: LedgerService,
  ) {}

  getPayday(user: { primaryPayday: number | null; preferredCycleStart: number | null }) {
    return user.primaryPayday ?? user.preferredCycleStart ?? 1;
  }

  async getActiveCycle(userId: string) {
    let cycle = await this.prisma.financialCycle.findFirst({
      where: { userId, status: { in: ["ACTIVE", "PENDING_CONFIRMATION"] } },
      orderBy: { startDate: "desc" },
    });

    if (!cycle) {
      return null;
    }

    if (cycle.endDate < new Date() && cycle.status === "ACTIVE") {
      cycle = await this.rolloverCycle(userId, cycle.id);
    }

    return cycle;
  }

  async getOrCreateActiveCycle(userId: string) {
    const existing = await this.getActiveCycle(userId);
    if (existing) return existing;

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const payday = this.getPayday(user);
    const { startDate, endDate } = computeCycleDates(payday);

    const startingBalance = user.encryptedStartingBalance
      ? await this.userEncryption.decryptNumberForUser(
          userId,
          user.encryptedStartingBalance,
        )
      : 0;

    return this.prisma.financialCycle.create({
      data: {
        userId,
        startDate,
        endDate,
        status: "ACTIVE",
        encryptedStartingBalance:
          await this.userEncryption.encryptNumberForUser(
            userId,
            startingBalance,
          ),
      },
    });
  }

  async rolloverCycle(userId: string, cycleId: string) {
    const cycle = await this.prisma.financialCycle.findFirstOrThrow({
      where: { id: cycleId, userId },
    });

    const startingBalance = cycle.encryptedStartingBalance
      ? await this.userEncryption.decryptNumberForUser(
          userId,
          cycle.encryptedStartingBalance,
        )
      : 0;

    const transactions = await this.ledger.getEffectiveTransactions(
      userId,
      cycle.id,
    );

    let income = 0;
    let expenses = 0;

    for (const tx of transactions) {
      if (tx.type === "INCOME") income += tx.amount;
      else expenses += tx.amount;
    }

    const endingCash = startingBalance + income - expenses;
    const encryptedEnding = await this.userEncryption.encryptNumberForUser(
      userId,
      endingCash,
    );

    await this.persistCycleGoalProgress(userId, cycle.id);

    await this.prisma.financialCycle.update({
      where: { id: cycle.id },
      data: {
        status: "COMPLETED",
        encryptedEndingBalance: encryptedEnding,
      },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const payday = this.getPayday(user);
    const { startDate, endDate } = computeNextCycleDates(cycle.endDate, payday);

    return this.prisma.financialCycle.create({
      data: {
        userId,
        startDate,
        endDate,
        status: "PENDING_CONFIRMATION",
        encryptedStartingBalance:
          await this.userEncryption.encryptNumberForUser(userId, endingCash),
      },
    });
  }

  async confirmRollover(userId: string) {
    const cycle = await this.prisma.financialCycle.findFirstOrThrow({
      where: { userId, status: "PENDING_CONFIRMATION" },
    });

    return this.prisma.financialCycle.update({
      where: { id: cycle.id },
      data: { status: "ACTIVE" },
    });
  }

  async adjustRollover(userId: string, startingBalance: number) {
    const cycle = await this.prisma.financialCycle.findFirstOrThrow({
      where: { userId, status: "PENDING_CONFIRMATION" },
    });

    return this.prisma.financialCycle.update({
      where: { id: cycle.id },
      data: {
        status: "ACTIVE",
        encryptedStartingBalance:
          await this.userEncryption.encryptNumberForUser(
            userId,
            startingBalance,
          ),
      },
    });
  }

  async getStartingBalance(userId: string, cycleId: string): Promise<number> {
    const cycle = await this.prisma.financialCycle.findFirstOrThrow({
      where: { id: cycleId, userId },
    });

    if (!cycle.encryptedStartingBalance) return 0;

    return this.userEncryption.decryptNumberForUser(
      userId,
      cycle.encryptedStartingBalance,
    );
  }

  async listHistory(userId: string) {
    return this.prisma.financialCycle.findMany({
      where: { userId },
      orderBy: { startDate: "desc" },
      take: 12,
    });
  }

  private async persistCycleGoalProgress(userId: string, cycleId: string) {
    const goals = await this.prisma.goal.findMany({
      where: { userId, isActive: true },
    });

    if (goals.length === 0) return;

    const transactions = await this.ledger.getEffectiveTransactions(
      userId,
      cycleId,
    );

    const engineGoals = await Promise.all(
      goals.map(async (goal) => ({
        id: goal.id,
        name: goal.name,
        priority: goal.priority,
        targetAmount: await this.userEncryption.decryptNumberForUser(
          userId,
          goal.encryptedTargetAmount,
        ),
        targetDate: goal.targetDate,
        isEmergencyFund: goal.isEmergencyFund,
        storedCurrentAmount: goal.encryptedCurrentAmount
          ? await this.userEncryption.decryptNumberForUser(
              userId,
              goal.encryptedCurrentAmount,
            )
          : 0,
      })),
    );

    const persisted = computePersistedGoalAmounts(
      engineGoals,
      transactions.map((tx) => ({
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        createdAt: tx.createdAt,
      })),
    );

    for (const goal of goals) {
      const amount = persisted[goal.id];
      if (amount == null) continue;

      await this.prisma.goal.update({
        where: { id: goal.id },
        data: {
          encryptedCurrentAmount:
            await this.userEncryption.encryptNumberForUser(userId, amount),
        },
      });
    }
  }
}
