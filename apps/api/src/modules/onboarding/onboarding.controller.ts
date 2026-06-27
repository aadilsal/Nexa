import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { OnboardingSchema } from "@nexa/shared";
import { SessionGuard } from "../auth/session.guard";
import { OnboardingService } from "./onboarding.service";

@ApiTags("onboarding")
@Controller("onboarding")
@UseGuards(SessionGuard)
@ApiCookieAuth("better-auth.session_token")
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get("status")
  getStatus(@Req() req: { userId: string }) {
    return this.onboardingService.getStatus(req.userId);
  }

  @Post("complete")
  complete(@Req() req: { userId: string }, @Body() body: unknown) {
    const input = OnboardingSchema.parse(body);
    return this.onboardingService.complete(req.userId, input);
  }
}
