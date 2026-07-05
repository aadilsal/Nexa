import { Injectable, NotFoundException } from "@nestjs/common";
import type { Category } from "@prisma/client";
import {
  FixedExpenseInputSchema,
  IncomeExpectationInputSchema,
  UpdateFixedExpenseSchema,
  UpdateIncomeExpectationSchema,
  normalizeCurrency,
} from "@nexa/shared";
import { PrismaService } from "../../common/prisma/prisma.module";
import { UserEncryptionService } from "../../common/encryption/user-encryption.service";
import { CurrencyService } from "../../common/currency/currency.service";
import { EngineDataService } from "../engine/engine-data.service";

@Injectable()
export class FinancialPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userEncryption: UserEncryptionService,
    private readonly currency: CurrencyService,
    private readonly engineData: EngineDataService,
  ) {}

  async updateVariableEstimate(userId: string, amount: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        encryptedVariableEstimate:
          await this.userEncryption.encryptNumberForUser(userId, amount),
      },
    });
    await this.engineData.invalidateUserCache(userId);
    return { variableEstimate: amount };
  }

  async createFixedExpense(userId: string, body: unknown) {
    const input = FixedExpenseInputSchema.parse(body);
    const currencyCtx = await this.currency.getUserContext(userId);

    const expense = await this.prisma.fixedExpense.create({
      data: {
        userId,
        name: input.name,
        category: input.category as Category,
        currency: normalizeCurrency(input.currency, currencyCtx.primaryCurrency),
        encryptedExpectedAmount:
          await this.userEncryption.encryptNumberForUser(
            userId,
            input.expectedAmount,
          ),
      },
    });

    await this.engineData.invalidateUserCache(userId);
    return { id: expense.id, name: expense.name };
  }

  async updateFixedExpense(userId: string, id: string, body: unknown) {
    const input = UpdateFixedExpenseSchema.parse(body);
    const expense = await this.prisma.fixedExpense.findFirst({
      where: { id, userId },
    });
    if (!expense) throw new NotFoundException("Fixed expense not found");

    await this.prisma.fixedExpense.update({
      where: { id },
      data: {
        encryptedExpectedAmount:
          await this.userEncryption.encryptNumberForUser(
            userId,
            input.expectedAmount,
          ),
      },
    });

    await this.engineData.invalidateUserCache(userId);
    return { id };
  }

  async deleteFixedExpense(userId: string, id: string) {
    const expense = await this.prisma.fixedExpense.findFirst({
      where: { id, userId },
    });
    if (!expense) throw new NotFoundException("Fixed expense not found");

    await this.prisma.fixedExpense.delete({ where: { id } });
    await this.engineData.invalidateUserCache(userId);
    return { success: true };
  }

  async createIncomeExpectation(userId: string, body: unknown) {
    const input = IncomeExpectationInputSchema.parse(body);
    const currencyCtx = await this.currency.getUserContext(userId);

    const income = await this.prisma.incomeExpectation.create({
      data: {
        userId,
        name: input.name,
        currency: normalizeCurrency(input.currency, currencyCtx.primaryCurrency),
        encryptedExpectedAmount:
          await this.userEncryption.encryptNumberForUser(
            userId,
            input.expectedAmount,
          ),
      },
    });

    await this.engineData.invalidateUserCache(userId);
    return { id: income.id, name: income.name };
  }

  async updateIncomeExpectation(userId: string, id: string, body: unknown) {
    const input = UpdateIncomeExpectationSchema.parse(body);
    const income = await this.prisma.incomeExpectation.findFirst({
      where: { id, userId },
    });
    if (!income) throw new NotFoundException("Income source not found");

    await this.prisma.incomeExpectation.update({
      where: { id },
      data: {
        encryptedExpectedAmount:
          await this.userEncryption.encryptNumberForUser(
            userId,
            input.expectedAmount,
          ),
      },
    });

    await this.engineData.invalidateUserCache(userId);
    return { id };
  }

  async deleteIncomeExpectation(userId: string, id: string) {
    const income = await this.prisma.incomeExpectation.findFirst({
      where: { id, userId },
    });
    if (!income) throw new NotFoundException("Income source not found");

    await this.prisma.incomeExpectation.delete({ where: { id } });
    await this.engineData.invalidateUserCache(userId);
    return { success: true };
  }
}
