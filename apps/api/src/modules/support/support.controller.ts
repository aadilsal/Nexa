import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../auth/session.guard";
import { SupportService } from "./support.service";

@ApiTags("support")
@Controller("support")
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post("tickets")
  @UseGuards(SessionGuard)
  @ApiCookieAuth("better-auth.session_token")
  createTicket(@Req() req: { userId: string }, @Body() body: unknown) {
    return this.support.createTicket(req.userId, body);
  }

  @Get("tickets")
  @UseGuards(SessionGuard)
  @ApiCookieAuth("better-auth.session_token")
  listTickets(@Req() req: { userId: string }) {
    return this.support.listUserTickets(req.userId);
  }

  @Get("tickets/:id")
  @UseGuards(SessionGuard)
  @ApiCookieAuth("better-auth.session_token")
  getTicket(@Req() req: { userId: string }, @Param("id") id: string) {
    return this.support.getUserTicket(req.userId, id);
  }

  @Post("tickets/:id/revoke-snapshot")
  @UseGuards(SessionGuard)
  @ApiCookieAuth("better-auth.session_token")
  revokeSnapshot(@Req() req: { userId: string }, @Param("id") id: string) {
    return this.support.revokeSnapshot(req.userId, id);
  }

  @Post("contact")
  publicContact(
    @Body() body: unknown,
    @Headers("x-forwarded-for") forwardedFor?: string,
  ) {
    const ip = forwardedFor?.split(",")[0]?.trim();
    return this.support.createPublicContact(body, ip);
  }
}
