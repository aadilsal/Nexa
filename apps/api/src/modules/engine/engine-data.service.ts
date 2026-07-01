import { Injectable } from "@nestjs/common";
import {
  calculateEngineOutput,
  diffEngineOutput,
  type EngineInput,
  type EngineOutput,
} from "@nexa/finance-engine";
import { RedisService } from "../../common/redis/redis.service";
import { PrismaService } from "../../common/prisma/prisma.module";
import { UserEncryptionService } from "../../common/encryption/user-encryption.service";
import { CyclesService } from "../cycles/cycles.service";
import { LedgerService } from "../transactions/ledger.service";

const ENGINE_CACHE_TTL = 300;

@Injectable()
export class EngineDataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userEncryption: UserEncryptionService,
    private readonly cycles: CyclesService,
    private readonly ledger: LedgerService,
    private readonly redis: RedisService,
  ) {}

  async buildEngineInput(userId: string): Promise<EngineInput> {
    const cycle = await this.cycles.getOrCreateActiveCycle(userId);
    const startingBalance = await this.cycles.getStartingBalance(
      userId,
      cycle.id,
    );

    const transactions = await this.ledger.getEffectiveTransactions(
      userId,
      cycle.id,
    );

    const goals = await this.prisma.goal.findMany({
      where: { userId, isActive: true },
    });

    const fixedExpenses = await this.prisma.fixedExpense.findMany({
      where: { userId },
    });

    const incomeExpectations = await this.prisma.incomeExpectation.findMany({
      where: { userId },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const completedCycles = await this.prisma.financialCycle.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { startDate: "desc" },
      take: 3,
    });

    const recurringTotal = await this.sumFixedExpenses(userId, fixedExpenses);

    const historicalCycles = await Promise.all(
      completedCycles.map(async (c) => ({
        startDate: c.startDate,
        endDate: c.endDate,
        transactions: (
          await this.ledger.getEffectiveTransactions(userId, c.id)
        ).map((tx) => ({
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          createdAt: tx.createdAt,
        })),
        recurringTotal,
      })),
    );

    const expectedIncome = await this.sumIncomeExpectations(
      userId,
      incomeExpectations,
    );

    const variableEstimate = user.encryptedVariableEstimate
      ? await this.userEncryption.decryptNumberForUser(
          userId,
          user.encryptedVariableEstimate,
        )
      : 0;

    const engineGoals = await Promise.all(
      goals.map(async (goal) => ({
        id: goal.id,
        name: goal.name,
        priority: goal.priority as EngineInput["goals"][0]["priority"],
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

    const engineFixedExpenses = await Promise.all(
      fixedExpenses.map(async (expense) => ({
        name: expense.name,
        category: expense.category,
        expectedAmount: await this.userEncryption.decryptNumberForUser(
          userId,
          expense.encryptedExpectedAmount,
        ),
      })),
    );

    return {
      cycle: {
        id: cycle.id,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        status: cycle.status,
        startingBalance,
      },
      transactions: transactions.map((tx) => ({
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        createdAt: tx.createdAt,
      })),
      goals: engineGoals,
      fixedExpenses: engineFixedExpenses,
      expectedIncome,
      variableEstimate,
      completedCyclesCount: completedCycles.length,
      historicalCycles,
    };
  }

  async calculateForUser(userId: string): Promise<EngineOutput> {
    const cycle = await this.cycles.getOrCreateActiveCycle(userId);
    const cacheKey = `engine:${userId}:${cycle.id}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as EngineOutput;
    }

    const input = await this.buildEngineInput(userId);
    const output = calculateEngineOutput(input);
    await this.redis.set(cacheKey, JSON.stringify(output), ENGINE_CACHE_TTL);

    await this.prisma.engineSnapshot.create({
      data: {
        cycleId: cycle.id,
        engineVersion: output.version,
        output: JSON.parse(JSON.stringify(output)),
      },
    });

    return output;
  }

  async calculateAtDate(
    userId: string,
    asOf: Date,
    transactions: EngineInput["transactions"],
  ): Promise<EngineOutput> {
    const input = await this.buildEngineInput(userId);
    return calculateEngineOutput({
      ...input,
      transactions,
      today: asOf,
    });
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.redis.delPattern(`engine:${userId}:`);
  }

  async calculateDiffForNewTransaction(
    userId: string,
    excludeLastTransaction: boolean,
  ): Promise<ReturnType<typeof diffEngineOutput>> {
    const input = await this.buildEngineInput(userId);

    if (excludeLastTransaction && input.transactions.length > 0) {
      const beforeInput = {
        ...input,
        transactions: input.transactions.slice(0, -1),
      };
      const before = calculateEngineOutput(beforeInput);
      const after = calculateEngineOutput(input);
      return diffEngineOutput(before, after);
    }

    const after = calculateEngineOutput(input);
    return {
      safeToSpend: {
        before: after.safeToSpend.today,
        after: after.safeToSpend.today,
      },
      healthScore: {
        before: after.healthScore.overall,
        after: after.healthScore.overall,
      },
      goalImpact: after.goals.map((g) => ({
        goalName: g.name,
        etaBefore: g.eta,
        etaAfter: g.eta,
        stillOnTrack: g.onTrack,
      })),
    };
  }

  private async sumFixedExpenses(
    userId: string,
    expenses: Array<{ encryptedExpectedAmount: string }>,
  ): Promise<number> {
    let total = 0;
    for (const expense of expenses) {
      total += await this.userEncryption.decryptNumberForUser(
        userId,
        expense.encryptedExpectedAmount,
      );
    }
    return total;
  }

  private async sumIncomeExpectations(
    userId: string,
    expectations: Array<{ encryptedExpectedAmount: string }>,
  ): Promise<number> {
    let total = 0;
    for (const expectation of expectations) {
      total += await this.userEncryption.decryptNumberForUser(
        userId,
        expectation.encryptedExpectedAmount,
      );
    }
    return total;
  }
}
