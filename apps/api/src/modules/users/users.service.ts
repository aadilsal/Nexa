import { Injectable, NotFoundException } from "@nestjs/common";
import { UpdateProfileSchema, UpdateUserSettingsSchema } from "@nexa/shared";
import { PrismaService } from "../../common/prisma/prisma.module";
import { UserEncryptionService } from "../../common/encryption/user-encryption.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userEncryption: UserEncryptionService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        settings: true,
        passkeys: { select: { id: true, name: true, createdAt: true } },
        accountDeletion: true,
      },
    });

    const [fixedExpenses, incomeExpectations, goals] = await Promise.all([
      this.prisma.fixedExpense.findMany({ where: { userId } }),
      this.prisma.incomeExpectation.findMany({ where: { userId } }),
      this.prisma.goal.findMany({ where: { userId, isActive: true } }),
    ]);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        onboardingComplete: user.onboardingComplete,
        primaryPayday: user.primaryPayday,
        preferredCycleStart: user.preferredCycleStart,
        createdAt: user.createdAt,
      },
      settings: user.settings ?? {
        timezone: "Asia/Karachi",
        weeklyReviewEmail: true,
        passkeyPromptDismissed: false,
      },
      passkeys: user.passkeys,
      pendingDeletion: user.accountDeletion
        ? {
            scheduledFor: user.accountDeletion.scheduledFor,
            requestedAt: user.accountDeletion.requestedAt,
          }
        : null,
      fixedExpenses: await Promise.all(
        fixedExpenses.map(async (e) => ({
          id: e.id,
          name: e.name,
          category: e.category,
          expectedAmount: await this.userEncryption.decryptNumberForUser(
            userId,
            e.encryptedExpectedAmount,
          ),
        })),
      ),
      incomeExpectations: await Promise.all(
        incomeExpectations.map(async (i) => ({
          id: i.id,
          name: i.name,
          expectedAmount: await this.userEncryption.decryptNumberForUser(
            userId,
            i.encryptedExpectedAmount,
          ),
        })),
      ),
      goals: await Promise.all(
        goals.map(async (g) => ({
          id: g.id,
          name: g.name,
          priority: g.priority,
          targetDate: g.targetDate,
          isEmergencyFund: g.isEmergencyFund,
          targetAmount: await this.userEncryption.decryptNumberForUser(
            userId,
            g.encryptedTargetAmount,
          ),
        })),
      ),
    };
  }

  async updateProfile(userId: string, body: unknown) {
    const input = UpdateProfileSchema.parse(body);
    if (!input.name) return this.getProfile(userId);

    await this.prisma.user.update({
      where: { id: userId },
      data: { name: input.name },
    });

    return this.getProfile(userId);
  }

  async updateSettings(userId: string, body: unknown) {
    const input = UpdateUserSettingsSchema.parse(body);

    await this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...input },
      update: input,
    });

    return this.getProfile(userId);
  }
}
