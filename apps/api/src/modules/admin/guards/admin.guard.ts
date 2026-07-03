import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AuthenticatedRequest } from "../../auth/session.guard";
import { ROLES_KEY } from "../roles.decorator";

const ADMIN_ROLES = new Set([
  "SUPPORT",
  "OPERATIONS",
  "ADMIN",
  "SUPER_ADMIN",
]);

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!ADMIN_ROLES.has(request.user?.role ?? "USER")) {
      throw new ForbiddenException("Admin access required");
    }
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!requiredRoles.includes(request.user?.role ?? "USER")) {
      throw new ForbiddenException("Insufficient permissions");
    }
    return true;
  }
}
