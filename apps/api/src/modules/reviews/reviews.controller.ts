import {
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../auth/session.guard";
import { ReviewsService } from "./reviews.service";

@ApiTags("reviews")
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get("weekly")
  @UseGuards(SessionGuard)
  @ApiCookieAuth("better-auth.session_token")
  getWeekly(@Req() req: { userId: string }, @Query("date") date?: string) {
    const reference = date ? new Date(date) : new Date();
    return this.reviewsService.getWeeklyReview(req.userId, reference);
  }

  @Get("monthly")
  @UseGuards(SessionGuard)
  @ApiCookieAuth("better-auth.session_token")
  getMonthly(@Req() req: { userId: string }) {
    return this.reviewsService.getMonthlyReview(req.userId);
  }

  @Post("weekly/send")
  sendWeeklyEmails(@Headers("x-cron-secret") secret?: string) {
    const expected = process.env.CRON_SECRET;
    if (!expected || secret !== expected) {
      throw new UnauthorizedException("Invalid cron secret");
    }
    return this.reviewsService.sendWeeklyReviewEmails();
  }
}
