import { Injectable } from "@nestjs/common";
import type { FinancialCycle } from "@prisma/client";
import {
  calculateEngineOutput,
  diffEngineOutput,
  type EngineInput,
  type EngineOutput,
} from "@nexa/finance-engine";
import { RedisService } from "../../common/redis/redis.service";
import { PrismaService } from "../../common/prisma/prisma.module";
import { UserEncryptionService } from "../../common/encryption/user-encryption.service";
import { CurrencyService } from "../../common/currency/currency.service";
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
    private readonly currency: CurrencyService,
  ) {}

  async buildEngineInput(
    userId: string,
    existingCycle?: FinancialCycle,
  ): Promise<EngineInput> {
    const currencyCtx = await this.currency.getUserContext(userId);
    const cycle =
      existingCycle ?? (await this.cycles.getOrCreateActiveCycle(userId));

    const [
      startingBalance,
      transactions,
      goals,
      fixedExpenses,
      incomeExpectations,
      user,
      completedCycles,
    ] = await Promise.all([
      this.cycles.getStartingBalance(userId, cycle.id),
      this.ledger.getEffectiveTransactions(userId, cycle.id),
      this.prisma.goal.findMany({ where: { userId, isActive: true } }),
      this.prisma.fixedExpense.findMany({ where: { userId } }),
      this.prisma.incomeExpectation.findMany({ where: { userId } }),
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      this.prisma.financialCycle.findMany({
        where: { userId, status: "COMPLETED" },
        orderBy: { startDate: "desc" },
        take: 3,
      }),
    ]);

    const [
      recurringTotal,
      expectedIncome,
      variableEstimate,
      engineGoals,
      engineFixedExpenses,
      historicalCycles,
    ] = await Promise.all([
      this.sumFixedExpenses(userId, fixedExpenses, currencyCtx),
      this.sumIncomeExpectations(userId, incomeExpectations, currencyCtx),
      user.encryptedVariableEstimate
        ? this.currency.toPrimary(
            await this.userEncryption.decryptNumberForUser(
              userId,
              user.encryptedVariableEstimate,
            ),
            currencyCtx.primaryCurrency,
            currencyCtx,
          )
        : Promise.resolve(0),
      this.mapGoals(userId, goals, currencyCtx),
      this.mapFixedExpenses(userId, fixedExpenses, currencyCtx),
      Promise.all(
        completedCycles.map(async (c) => ({
          startDate: c.startDate,
          endDate: c.endDate,
          transactions: (
            await this.ledger.getEffectiveTransactions(userId, c.id)
          ).map((tx) => ({
            amount: this.currency.toPrimary(
              tx.amount,
              tx.currency,
              currencyCtx,
            ),
            type: tx.type,
            category: tx.category,
            createdAt: tx.createdAt,
          })),
          recurringTotal: 0,
        })),
      ),
    ]);

    const historicalWithRecurring = historicalCycles.map((cycle) => ({
      ...cycle,
      recurringTotal,
    }));

    return {
      cycle: {
        id: cycle.id,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        status: cycle.status,
        startingBalance,
      },
      transactions: transactions.map((tx) => ({
        amount: this.currency.toPrimary(tx.amount, tx.currency, currencyCtx),
        type: tx.type,
        category: tx.category,
        createdAt: tx.createdAt,
      })),
      goals: engineGoals,
      fixedExpenses: engineFixedExpenses,
      expectedIncome,
      variableEstimate,
      completedCyclesCount: completedCycles.length,
      historicalCycles: historicalWithRecurring,
    };
  }

  async calculateForUser(userId: string): Promise<EngineOutput & { currency: string }> {
    const cycle = await this.cycles.getOrCreateActiveCycle(userId);
    const currencyCtx = await this.currency.getUserContext(userId);
    const cacheKey = `engine:${userId}:${cycle.id}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as EngineOutput & { currency: string };
    }

    const input = await this.buildEngineInput(userId, cycle);
    const output = {
      ...calculateEngineOutput(input),
      currency: currencyCtx.primaryCurrency,
    };
    await this.redis.set(cacheKey, JSON.stringify(output), ENGINE_CACHE_TTL);

    void this.persistSnapshot(cycle.id, output);

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

  private persistSnapshot(cycleId: string, output: EngineOutput): void {
    void this.prisma.engineSnapshot
      .create({
        data: {
          cycleId,
          engineVersion: output.version,
          output: JSON.parse(JSON.stringify(output)),
        },
      })
      .catch(() => undefined);
  }

  private async mapGoals(
    userId: string,
    goals: Array<{
      id: string;
      name: string;
      priority: string;
      targetDate: Date;
      isEmergencyFund: boolean;
      currency: string;
      encryptedTargetAmount: string;
      encryptedCurrentAmount: string | null;
    }>,
    currencyCtx: Awaited<ReturnType<CurrencyService["getUserContext"]>>,
  ): Promise<EngineInput["goals"]> {
    const targetAmounts = await this.userEncryption.decryptNumbersForUser(
      userId,
      goals.map((g) => g.encryptedTargetAmount),
    );
    const currentAmounts = await Promise.all(
      goals.map((goal) =>
        goal.encryptedCurrentAmount
          ? this.userEncryption.decryptNumberForUser(
              userId,
              goal.encryptedCurrentAmount,
            )
          : Promise.resolve(0),
      ),
    );

    return goals.map((goal, index) => ({
      id: goal.id,
      name: goal.name,
      priority: goal.priority as EngineInput["goals"][0]["priority"],
      targetAmount: this.currency.toPrimary(
        targetAmounts[index] ?? 0,
        goal.currency,
        currencyCtx,
      ),
      targetDate: goal.targetDate,
      isEmergencyFund: goal.isEmergencyFund,
      storedCurrentAmount: goal.encryptedCurrentAmount
        ? this.currency.toPrimary(
            currentAmounts[index] ?? 0,
            goal.currency,
            currencyCtx,
          )
        : 0,
    }));
  }

  private async mapFixedExpenses(
    userId: string,
    expenses: Array<{
      name: string;
      category: string;
      currency: string;
      encryptedExpectedAmount: string;
    }>,
    currencyCtx: Awaited<ReturnType<CurrencyService["getUserContext"]>>,
  ): Promise<EngineInput["fixedExpenses"]> {
    const amounts = await this.userEncryption.decryptNumbersForUser(
      userId,
      expenses.map((e) => e.encryptedExpectedAmount),
    );
    return expenses.map((expense, index) => ({
      name: expense.name,
      category: expense.category as EngineInput["fixedExpenses"][0]["category"],
      expectedAmount: this.currency.toPrimary(
        amounts[index] ?? 0,
        expense.currency,
        currencyCtx,
      ),
    }));
  }

  private async sumFixedExpenses(
    userId: string,
    expenses: Array<{ currency: string; encryptedExpectedAmount: string }>,
    currencyCtx: Awaited<ReturnType<CurrencyService["getUserContext"]>>,
  ): Promise<number> {
    if (expenses.length === 0) return 0;
    const amounts = await this.userEncryption.decryptNumbersForUser(
      userId,
      expenses.map((e) => e.encryptedExpectedAmount),
    );
    return expenses.reduce(
      (sum, expense, index) =>
        sum +
        this.currency.toPrimary(
          amounts[index] ?? 0,
          expense.currency,
          currencyCtx,
        ),
      0,
    );
  }

  private async sumIncomeExpectations(
    userId: string,
    expectations: Array<{ currency: string; encryptedExpectedAmount: string }>,
    currencyCtx: Awaited<ReturnType<CurrencyService["getUserContext"]>>,
  ): Promise<number> {
    if (expectations.length === 0) return 0;
    const amounts = await this.userEncryption.decryptNumbersForUser(
      userId,
      expectations.map((e) => e.encryptedExpectedAmount),
    );
    return expectations.reduce(
      (sum, expectation, index) =>
        sum +
        this.currency.toPrimary(
          amounts[index] ?? 0,
          expectation.currency,
          currencyCtx,
        ),
      0,
    );
  }
}
