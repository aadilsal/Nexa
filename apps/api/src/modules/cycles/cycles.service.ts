import { Injectable } from "@nestjs/common";
import {
  computeCycleDates,
  computeNextCycleDates,
} from "@nexa/finance-engine";
import { PrismaService } from "../../common/prisma/prisma.module";
import { UserEncryptionService } from "../../common/encryption/user-encryption.service";

@Injectable()
export class CyclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userEncryption: UserEncryptionService,
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

    const events = await this.prisma.transactionEvent.findMany({
      where: { cycleId: cycle.id },
      orderBy: { createdAt: "asc" },
    });

    let income = 0;
    let expenses = 0;

    for (const event of events) {
      if (event.eventType === "DELETE") continue;
      const payload = await this.userEncryption.decryptJsonForUser<{
        amount: number;
        type: string;
      }>(userId, event.encryptedPayload);
      if (payload.type === "INCOME") income += payload.amount;
      else expenses += payload.amount;
    }

    const endingCash = startingBalance + income - expenses;
    const encryptedEnding = await this.userEncryption.encryptNumberForUser(
      userId,
      endingCash,
    );

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
}
