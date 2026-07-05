import { Injectable } from "@nestjs/common";
import type { GoalPriority } from "@prisma/client";
import {
  calculatePredictedMonthlyExpenses,
  suggestEmergencyFundTarget,
} from "@nexa/finance-engine";
import {
  normalizeCurrency,
  type OnboardingInput,
  type OnboardingPreviewInput,
} from "@nexa/shared";
import { PrismaService } from "../../common/prisma/prisma.module";
import { UserEncryptionService } from "../../common/encryption/user-encryption.service";
import { CurrencyService } from "../../common/currency/currency.service";
import { CyclesService } from "../cycles/cycles.service";
import { EngineDataService } from "../engine/engine-data.service";

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userEncryption: UserEncryptionService,
    private readonly cycles: CyclesService,
    private readonly currency: CurrencyService,
    private readonly engineData: EngineDataService,
  ) {}

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { onboardingComplete: true },
    });
    return { complete: user.onboardingComplete };
  }

  async preview(input: OnboardingPreviewInput) {
    const currencyCtx = await this.currency.buildContext(input.primaryCurrency);

    const toPrimary = (amount: number, currency?: string) =>
      this.currency.toPrimary(amount, currency, currencyCtx);

    const recurringTotal = input.fixedExpenses.reduce(
      (sum, e) => sum + toPrimary(e.expectedAmount, e.currency),
      0,
    );
    const variableInPrimary = toPrimary(
      input.variableEstimate,
      currencyCtx.primaryCurrency,
    );
    const predictedMonthly = calculatePredictedMonthlyExpenses({
      recurringTotal,
      variableEstimate: variableInPrimary,
      completedCyclesCount: 0,
    });
    const emergencyFundTarget = suggestEmergencyFundTarget(predictedMonthly);
    return {
      predictedMonthly,
      emergencyFundTarget,
      recurringTotal,
      primaryCurrency: currencyCtx.primaryCurrency,
    };
  }

  async complete(userId: string, input: OnboardingInput) {
    const currencyCtx = await this.currency.buildContext(input.primaryCurrency);

    const toPrimary = (amount: number, currency?: string) =>
      this.currency.toPrimary(amount, currency, currencyCtx);

    const recurringTotal = input.fixedExpenses.reduce(
      (sum, e) => sum + toPrimary(e.expectedAmount, e.currency),
      0,
    );

    const variableInPrimary = toPrimary(
      input.variableEstimate,
      currencyCtx.primaryCurrency,
    );

    const predictedMonthly = calculatePredictedMonthlyExpenses({
      recurringTotal,
      variableEstimate: variableInPrimary,
      completedCyclesCount: 0,
    });

    const emergencyTarget =
      input.emergencyFundTarget ??
      suggestEmergencyFundTarget(predictedMonthly);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          onboardingComplete: true,
          primaryPayday: input.primaryPayday ?? null,
          preferredCycleStart: input.preferredCycleStart ?? null,
          encryptedVariableEstimate:
            await this.userEncryption.encryptNumberForUser(
              userId,
              variableInPrimary,
            ),
          encryptedStartingBalance:
            input.startingBalance != null
              ? await this.userEncryption.encryptNumberForUser(
                  userId,
                  input.startingBalance,
                )
              : undefined,
        },
      });

      await tx.userSettings.upsert({
        where: { userId },
        create: {
          userId,
          primaryCurrency: currencyCtx.primaryCurrency,
        },
        update: {
          primaryCurrency: currencyCtx.primaryCurrency,
        },
      });

      for (const expense of input.fixedExpenses) {
        await tx.fixedExpense.create({
          data: {
            userId,
            name: expense.name,
            category: expense.category,
            currency: normalizeCurrency(
              expense.currency,
              currencyCtx.primaryCurrency,
            ),
            encryptedExpectedAmount:
              await this.userEncryption.encryptNumberForUser(
                userId,
                expense.expectedAmount,
              ),
          },
        });
      }

      for (const income of input.incomeExpectations) {
        await tx.incomeExpectation.create({
          data: {
            userId,
            name: income.name,
            currency: normalizeCurrency(
              income.currency,
              currencyCtx.primaryCurrency,
            ),
            encryptedExpectedAmount:
              await this.userEncryption.encryptNumberForUser(
                userId,
                income.expectedAmount,
              ),
          },
        });
      }

      const hasEmergencyFund = input.goals?.some((g) => g.isEmergencyFund);

      if (!hasEmergencyFund) {
        const targetDate = new Date();
        targetDate.setFullYear(targetDate.getFullYear() + 1);

        await tx.goal.create({
          data: {
            userId,
            name: "Emergency Fund",
            priority: "EMERGENCY_FUND",
            targetDate,
            isEmergencyFund: true,
            currency: currencyCtx.primaryCurrency,
            encryptedTargetAmount:
              await this.userEncryption.encryptNumberForUser(
                userId,
                emergencyTarget,
              ),
            encryptedCurrentAmount:
              await this.userEncryption.encryptNumberForUser(userId, 0),
          },
        });
      }

      for (const goal of input.goals ?? []) {
        await tx.goal.create({
          data: {
            userId,
            name: goal.name,
            priority: goal.priority as GoalPriority,
            targetDate: new Date(goal.targetDate),
            isEmergencyFund: goal.isEmergencyFund ?? false,
            currency: currencyCtx.primaryCurrency,
            encryptedTargetAmount:
              await this.userEncryption.encryptNumberForUser(
                userId,
                goal.targetAmount,
              ),
            encryptedCurrentAmount:
              await this.userEncryption.encryptNumberForUser(userId, 0),
          },
        });
      }
    });

    await this.cycles.getOrCreateActiveCycle(userId);

    if (input.startingBalance != null) {
      await this.cycles.syncActiveCycleStartingBalance(
        userId,
        input.startingBalance,
      );
    }

    await this.engineData.invalidateUserCache(userId);

    return {
      success: true,
      predictedMonthlyExpenses: predictedMonthly,
      primaryCurrency: currencyCtx.primaryCurrency,
    };
  }
}
