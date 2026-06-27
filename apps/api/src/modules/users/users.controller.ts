import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../common/prisma/prisma.module";
import { SessionGuard } from "../auth/session.guard";

@ApiTags("users")
@Controller("users")
@UseGuards(SessionGuard)
@ApiCookieAuth("better-auth.session_token")
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("me")
  async getMe(@Req() req: { userId: string }) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        onboardingComplete: true,
        primaryPayday: true,
        preferredCycleStart: true,
        createdAt: true,
      },
    });

    return { user };
  }
}
