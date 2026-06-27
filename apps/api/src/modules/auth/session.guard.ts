import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.module";

export interface AuthenticatedRequest extends Request {
  userId: string;
  user: { id: string; email: string; name: string | null };
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token =
      request.cookies?.["better-auth.session_token"] ??
      request.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new UnauthorizedException("Authentication required");
    }

    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException("Session expired or invalid");
    }

    request.userId = session.userId;
    request.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };

    return true;
  }
}
