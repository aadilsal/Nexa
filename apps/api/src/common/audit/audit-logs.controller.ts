import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.module";
import { SessionGuard } from "../../modules/auth/session.guard";

@ApiTags("audit-logs")
@Controller("audit-logs")
@UseGuards(SessionGuard)
@ApiCookieAuth("better-auth.session_token")
export class AuditLogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @Req() req: { userId: string },
    @Query("limit") limit?: string,
  ) {
    const take = Math.min(Number(limit) || 50, 100);

    const logs = await this.prisma.auditLog.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        action: true,
        metadata: true,
        createdAt: true,
      },
    });

    return { logs };
  }
}
