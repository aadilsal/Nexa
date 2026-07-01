import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.module";
import { UserEncryptionService } from "../../common/encryption/user-encryption.service";
import { AuditService } from "../../common/audit/audit.service";
import { LedgerService } from "../transactions/ledger.service";

@Injectable()
export class ExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userEncryption: UserEncryptionService,
    private readonly audit: AuditService,
    private readonly ledger: LedgerService,
  ) {}

  async exportJson(userId: string) {
    const data = await this.buildExportData(userId);
    await this.audit.log(userId, "EXPORT_JSON");
    return data;
  }

  async exportCsv(userId: string): Promise<string> {
    const data = await this.buildExportData(userId);
    await this.audit.log(userId, "EXPORT_CSV");

    const rows = [
      "type,description,amount,category,transaction_type,date",
      ...data.transactions.map(
        (t) =>
          `transaction,"${t.description.replace(/"/g, '""')}",${t.amount},${t.category},${t.type},${t.createdAt}`,
      ),
    ];
    return rows.join("\n");
  }

  private async buildExportData(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { settings: true },
    });

    const cycles = await this.prisma.financialCycle.findMany({
      where: { userId },
      orderBy: { startDate: "desc" },
    });

    const allTransactions: Array<{
      description: string;
      amount: number;
      category: string;
      type: string;
      createdAt: string;
      cycleId: string;
    }> = [];

    for (const cycle of cycles) {
      const txs = await this.ledger.getEffectiveTransactions(userId, cycle.id);
      for (const tx of txs) {
        allTransactions.push({
          description: tx.description,
          amount: tx.amount,
          category: tx.category,
          type: tx.type,
          createdAt: tx.createdAt.toISOString(),
          cycleId: cycle.id,
        });
      }
    }

    const goals = await this.prisma.goal.findMany({ where: { userId } });

    return {
      exportedAt: new Date().toISOString(),
      user: {
        email: user.email,
        name: user.name,
        onboardingComplete: user.onboardingComplete,
      },
      settings: user.settings,
      cycles: cycles.map((c) => ({
        id: c.id,
        startDate: c.startDate,
        endDate: c.endDate,
        status: c.status,
      })),
      transactions: allTransactions,
      goals: await Promise.all(
        goals.map(async (g) => ({
          name: g.name,
          priority: g.priority,
          targetAmount: await this.userEncryption.decryptNumberForUser(
            userId,
            g.encryptedTargetAmount,
          ),
          isEmergencyFund: g.isEmergencyFund,
        })),
      ),
    };
  }
}
