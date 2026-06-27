import { Injectable } from "@nestjs/common";
import type { AuditAction } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.module";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    userId: string,
    action: AuditAction,
    metadata?: Record<string, unknown>,
    ipAddress?: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        metadata: metadata ?? undefined,
        ipAddress,
      },
    });
  }
}
