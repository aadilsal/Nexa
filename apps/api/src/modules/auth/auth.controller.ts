import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { SessionGuard } from "./session.guard";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  @Get("session")
  @UseGuards(SessionGuard)
  @ApiCookieAuth("better-auth.session_token")
  getSession(@Req() req: Request & { user: { id: string; email: string; name: string | null } }) {
    return { user: req.user };
  }
}
