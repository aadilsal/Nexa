import { Injectable } from "@nestjs/common";
import { scryptSync } from "crypto";
import { EngineDataService } from "../engine/engine-data.service";
import { PrismaService } from "../../common/prisma/prisma.module";

export interface SupportSnapshotPayload {
  generatedAt: string;
  cycle: {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
  } | null;
  engineOutput: unknown;
  transactionCount: number;
  goalCount: number;
  goals: Array<{ name: string; priority: string; isEmergencyFund: boolean }>;
}

@Injectable()
export class SnapshotBuilderService {
  constructor(
    private readonly engineData: EngineDataService,
    private readonly prisma: PrismaService,
  ) {}

  async build(userId: string): Promise<SupportSnapshotPayload> {
    const [engineOutput, cycle, transactionCount, goals] = await Promise.all([
      this.engineData.calculateForUser(userId),
      this.prisma.financialCycle.findFirst({
        where: { userId, status: "ACTIVE" },
        select: { id: true, startDate: true, endDate: true, status: true },
      }),
      this.prisma.transactionEvent.count({ where: { userId } }),
      this.prisma.goal.findMany({
        where: { userId, isActive: true },
        select: {
          name: true,
          priority: true,
          isEmergencyFund: true,
        },
      }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      cycle: cycle
        ? {
            id: cycle.id,
            startDate: cycle.startDate.toISOString(),
            endDate: cycle.endDate.toISOString(),
            status: cycle.status,
          }
        : null,
      engineOutput,
      transactionCount,
      goalCount: goals.length,
      goals,
    };
  }
}
