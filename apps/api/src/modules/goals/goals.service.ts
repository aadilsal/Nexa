import { Injectable, NotFoundException } from "@nestjs/common";
import type { GoalPriority } from "@prisma/client";
import type { GoalInput } from "@nexa/shared";
import { PrismaService } from "../../common/prisma/prisma.module";
import { UserEncryptionService } from "../../common/encryption/user-encryption.service";
import { AuditService } from "../../common/audit/audit.service";

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userEncryption: UserEncryptionService,
    private readonly audit: AuditService,
  ) {}

  async list(userId: string) {
    const goals = await this.prisma.goal.findMany({
      where: { userId, isActive: true },
      orderBy: [{ priority: "asc" }, { targetDate: "asc" }],
    });

    return Promise.all(
      goals.map(async (goal) => {
        const targetAmount = await this.userEncryption.decryptNumberForUser(
          userId,
          goal.encryptedTargetAmount,
        );
        const currentAmount = goal.encryptedCurrentAmount
          ? await this.userEncryption.decryptNumberForUser(
              userId,
              goal.encryptedCurrentAmount,
            )
          : 0;

        return {
          id: goal.id,
          name: goal.name,
          priority: goal.priority,
          targetAmount,
          currentAmount,
          progress: targetAmount > 0 ? Math.round((currentAmount / targetAmount) * 100) : 0,
          targetDate: goal.targetDate,
          isEmergencyFund: goal.isEmergencyFund,
        };
      }),
    );
  }

  async create(userId: string, input: GoalInput) {
    const goal = await this.prisma.goal.create({
      data: {
        userId,
        name: input.name,
        priority: input.priority as GoalPriority,
        targetDate: new Date(input.targetDate),
        isEmergencyFund: input.isEmergencyFund ?? false,
        encryptedTargetAmount: await this.userEncryption.encryptNumberForUser(
          userId,
          input.targetAmount,
        ),
        encryptedCurrentAmount: await this.userEncryption.encryptNumberForUser(
          userId,
          0,
        ),
      },
    });

    await this.audit.log(userId, "GOAL_CREATE", { goalId: goal.id });

    return { id: goal.id, name: goal.name };
  }

  async update(userId: string, goalId: string, input: Partial<GoalInput>) {
    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) throw new NotFoundException("Goal not found");

    const data: Record<string, unknown> = {};

    if (input.name) data.name = input.name;
    if (input.priority) data.priority = input.priority;
    if (input.targetDate) data.targetDate = new Date(input.targetDate);
    if (input.targetAmount != null) {
      data.encryptedTargetAmount =
        await this.userEncryption.encryptNumberForUser(
          userId,
          input.targetAmount,
        );
    }

    const updated = await this.prisma.goal.update({
      where: { id: goalId },
      data,
    });

    await this.audit.log(userId, "GOAL_UPDATE", { goalId });

    return { id: updated.id };
  }

  async delete(userId: string, goalId: string) {
    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) throw new NotFoundException("Goal not found");

    await this.prisma.goal.update({
      where: { id: goalId },
      data: { isActive: false },
    });

    await this.audit.log(userId, "GOAL_DELETE", { goalId });

    return { success: true };
  }
}
