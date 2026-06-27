import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../auth/session.guard";
import { DashboardService } from "./dashboard.service";

@ApiTags("dashboard")
@Controller("dashboard")
@UseGuards(SessionGuard)
@ApiCookieAuth("better-auth.session_token")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@Req() req: { userId: string }) {
    return this.dashboardService.getDashboard(req.userId);
  }

  @Get("safe-to-spend")
  getSafeToSpend(@Req() req: { userId: string }) {
    return this.dashboardService.getSafeToSpend(req.userId);
  }

  @Get("health-score")
  getHealthScore(@Req() req: { userId: string }) {
    return this.dashboardService.getHealthScore(req.userId);
  }
}
