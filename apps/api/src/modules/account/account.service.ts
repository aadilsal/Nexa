import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.module";
import { AuditService } from "../../common/audit/audit.service";

const DELETION_GRACE_DAYS = 30;

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async requestDeletion(userId: string) {
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + DELETION_GRACE_DAYS);

    await this.prisma.accountDeletion.upsert({
      where: { userId },
      create: { userId, scheduledFor },
      update: {
        requestedAt: new Date(),
        scheduledFor,
        cancelledAt: null,
        completedAt: null,
      },
    });

    await this.audit.log(userId, "ACCOUNT_DELETE_REQUEST", { scheduledFor });

    return { scheduledFor, graceDays: DELETION_GRACE_DAYS };
  }

  async cancelDeletion(userId: string) {
    const pending = await this.prisma.accountDeletion.findUnique({
      where: { userId },
    });

    if (!pending || pending.completedAt) {
      throw new NotFoundException("No pending deletion request");
    }

    await this.prisma.accountDeletion.update({
      where: { userId },
      data: { cancelledAt: new Date() },
    });

    await this.audit.log(userId, "ACCOUNT_DELETE_CANCEL");

    return { success: true };
  }

  async getStatus(userId: string) {
    const deletion = await this.prisma.accountDeletion.findUnique({
      where: { userId },
    });

    if (!deletion || deletion.cancelledAt || deletion.completedAt) {
      return { pending: false };
    }

    return {
      pending: true,
      scheduledFor: deletion.scheduledFor,
      requestedAt: deletion.requestedAt,
    };
  }

  async purgeExpiredDeletions() {
    const now = new Date();
    const due = await this.prisma.accountDeletion.findMany({
      where: {
        scheduledFor: { lte: now },
        cancelledAt: null,
        completedAt: null,
      },
    });

    let purged = 0;
    for (const row of due) {
      await this.prisma.user.delete({ where: { id: row.userId } });
      purged++;
    }

    return { purged };
  }
}
