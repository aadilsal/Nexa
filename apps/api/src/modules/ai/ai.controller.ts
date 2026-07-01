import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../auth/session.guard";
import { InsightsService } from "../insights/insights.service";
import { AiService } from "./ai.service";

@ApiTags("ai")
@Controller("ai")
@UseGuards(SessionGuard)
@ApiCookieAuth("better-auth.session_token")
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly insightsService: InsightsService,
  ) {}

  @Get("insight")
  getInsight(@Req() req: { userId: string }) {
    return this.insightsService
      .getDashboardInsight(req.userId)
      .then((insight) => ({ insight }));
  }

  @Post("chat")
  chat(@Req() req: { userId: string }, @Body() body: unknown) {
    return this.aiService.chat(req.userId, body);
  }
}
