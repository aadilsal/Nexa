import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { createHmac } from "crypto";
import { SessionGuard } from "../auth/session.guard";
import { AnalyticsIngestionService } from "./analytics-ingestion.service";

function sessionSignKey(userId: string): string {
  const secret = process.env.ANALYTICS_EVENT_SIGNING_SECRET;
  if (!secret) return "";
  return createHmac("sha256", secret).update(userId).digest("hex");
}

@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly ingestion: AnalyticsIngestionService) {}

  @Get("sign-key")
  @UseGuards(SessionGuard)
  @ApiCookieAuth("better-auth.session_token")
  signKey(@Req() req: { userId: string }) {
    return { key: sessionSignKey(req.userId) };
  }

  @Post("events/batch")
  @UseGuards(SessionGuard)
  @ApiCookieAuth("better-auth.session_token")
  ingestBatch(
    @Req() req: { userId: string },
    @Body() body: unknown,
    @Headers("x-analytics-signature") signature?: string,
  ) {
    const payload = JSON.stringify(body);
    if (process.env.ANALYTICS_EVENT_SIGNING_SECRET) {
      const expected = createHmac("sha256", sessionSignKey(req.userId))
        .update(payload)
        .digest("hex");
      if (!signature || signature !== expected) {
        throw new UnauthorizedException("Invalid analytics signature");
      }
    }
    return this.ingestion.ingestBatch(req.userId, body);
  }

  @Post("errors")
  reportError(@Body() body: unknown) {
    return this.ingestion.reportError(undefined, body);
  }

  @Post("errors/authenticated")
  @UseGuards(SessionGuard)
  @ApiCookieAuth("better-auth.session_token")
  reportErrorAuth(@Req() req: { userId: string }, @Body() body: unknown) {
    return this.ingestion.reportError(req.userId, body);
  }
}
