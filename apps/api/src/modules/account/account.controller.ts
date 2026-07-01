import {
  Controller,
  Delete,
  Get,
  Headers,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../auth/session.guard";
import { AccountService } from "./account.service";

@ApiTags("account")
@Controller("account")
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get("deletion-status")
  @UseGuards(SessionGuard)
  @ApiCookieAuth("better-auth.session_token")
  status(@Req() req: { userId: string }) {
    return this.accountService.getStatus(req.userId);
  }

  @Delete()
  @UseGuards(SessionGuard)
  @ApiCookieAuth("better-auth.session_token")
  requestDeletion(@Req() req: { userId: string }) {
    return this.accountService.requestDeletion(req.userId);
  }

  @Post("cancel-deletion")
  @UseGuards(SessionGuard)
  @ApiCookieAuth("better-auth.session_token")
  cancelDeletion(@Req() req: { userId: string }) {
    return this.accountService.cancelDeletion(req.userId);
  }

  @Post("purge-expired")
  purgeExpired(@Headers("x-cron-secret") secret?: string) {
    const expected = process.env.CRON_SECRET;
    if (!expected || secret !== expected) {
      throw new UnauthorizedException("Invalid cron secret");
    }
    return this.accountService.purgeExpiredDeletions();
  }
}
