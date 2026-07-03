import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { AdminMfaSetupSchema, AdminMfaVerifySchema } from "@nexa/shared";
import { SessionGuard, type AuthenticatedRequest } from "../auth/session.guard";
import { AdminGuard } from "./guards/admin.guard";
import { AdminMfaService } from "./admin-mfa.service";
import { SkipMfa } from "./skip-mfa.decorator";

@ApiTags("admin-mfa")
@Controller("admin/mfa")
@UseGuards(SessionGuard, AdminGuard)
@SkipMfa()
@ApiCookieAuth("better-auth.session_token")
export class AdminMfaController {
  constructor(private readonly mfa: AdminMfaService) {}

  @Get("status")
  status(@Req() req: AuthenticatedRequest) {
    return this.mfa.getStatus(req.userId, req.user.role);
  }

  @Post("setup")
  setup(@Req() req: AuthenticatedRequest) {
    return this.mfa.setup(req.userId, req.user.email);
  }

  @Post("enable")
  enable(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const { code } = AdminMfaSetupSchema.parse(body);
    return this.mfa.enable(req.userId, req.user.email, code);
  }

  @Post("verify")
  verify(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const { code } = AdminMfaVerifySchema.parse(body);
    return this.mfa.verify(req.userId, req.user.email, code);
  }
}
