import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AuthenticatedRequest } from "../../auth/session.guard";
import { AdminMfaService } from "../admin-mfa.service";
import { SKIP_MFA_KEY } from "../skip-mfa.decorator";

@Injectable()
export class MfaGuard implements CanActivate {
  constructor(
    private readonly mfa: AdminMfaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_MFA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = request.user?.role ?? "USER";

    if (!this.mfa.isMfaRequired(role)) return true;

    const status = await this.mfa.getStatus(request.userId, role);

    if (!status.enabled) {
      throw new ForbiddenException({
        message: "MFA must be enabled before accessing admin",
        code: "MFA_SETUP_REQUIRED",
      });
    }

    if (!status.verified) {
      throw new ForbiddenException({
        message: "MFA verification required",
        code: "MFA_VERIFY_REQUIRED",
      });
    }

    return true;
  }
}
