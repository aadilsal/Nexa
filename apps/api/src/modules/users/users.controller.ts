import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../auth/session.guard";
import { UsersService } from "./users.service";

@ApiTags("users")
@Controller("users")
@UseGuards(SessionGuard)
@ApiCookieAuth("better-auth.session_token")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  getMe(@Req() req: { userId: string }) {
    return this.usersService.getProfile(req.userId);
  }

  @Patch("me")
  updateProfile(@Req() req: { userId: string }, @Body() body: unknown) {
    return this.usersService.updateProfile(req.userId, body);
  }

  @Patch("settings")
  updateSettings(@Req() req: { userId: string }, @Body() body: unknown) {
    return this.usersService.updateSettings(req.userId, body);
  }
}
