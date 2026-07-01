import {
  Controller,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { RedisService } from "../../common/redis/redis.service";
import { SessionGuard } from "../auth/session.guard";
import { ExportService } from "./export.service";

@ApiTags("export")
@Controller("export")
@UseGuards(SessionGuard)
@ApiCookieAuth("better-auth.session_token")
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly redis: RedisService,
  ) {}

  @Get("json")
  async json(@Req() req: { userId: string }) {
    await this.checkRateLimit(req.userId);
    return this.exportService.exportJson(req.userId);
  }

  @Get("csv")
  @Header("Content-Type", "text/csv")
  @Header("Content-Disposition", 'attachment; filename="nexa-export.csv"')
  async csv(@Req() req: { userId: string }, @Res() res: Response) {
    await this.checkRateLimit(req.userId);
    const csv = await this.exportService.exportCsv(req.userId);
    res.send(csv);
  }

  private async checkRateLimit(userId: string) {
    const { allowed } = await this.redis.checkRateLimit(
      `ratelimit:export:${userId}`,
      3,
      3600,
    );
    if (!allowed) {
      throw new HttpException("Export rate limit exceeded", HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
