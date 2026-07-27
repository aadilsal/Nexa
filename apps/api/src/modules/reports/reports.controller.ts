import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../auth/session.guard";
import { ReportsService } from "./reports.service";

@ApiTags("reports")
@Controller("reports")
@UseGuards(SessionGuard)
@ApiCookieAuth("better-auth.session_token")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("summary")
  getSummary(
    @Req() req: { userId: string },
    @Query("period") periodParam?: string,
    @Query("date") date?: string,
  ) {
    const period = this.reportsService.parsePeriod(periodParam);
    const reference = date ? new Date(date) : new Date();
    return this.reportsService.getSummary(req.userId, period, reference);
  }
}
