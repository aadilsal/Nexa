import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { SessionGuard, type AuthenticatedRequest } from "../auth/session.guard";
import { AdminGuard, RolesGuard } from "./guards/admin.guard";
import { MfaGuard } from "./guards/mfa.guard";
import { SkipMfa } from "./skip-mfa.decorator";
import { Roles } from "./roles.decorator";
import {
  AdminAggregationService,
  AdminAuditService,
  AdminHealthService,
  AdminMetricsService,
  AdminSupportService,
  AdminUsersService,
} from "./admin.services";

@ApiTags("admin")
@Controller("admin")
@UseGuards(SessionGuard, AdminGuard, MfaGuard, RolesGuard)
@ApiCookieAuth("better-auth.session_token")
export class AdminController {
  constructor(
    private readonly metrics: AdminMetricsService,
    private readonly users: AdminUsersService,
    private readonly support: AdminSupportService,
    private readonly audit: AdminAuditService,
    private readonly aggregation: AdminAggregationService,
    private readonly health: AdminHealthService,
  ) {}

  @Get("me")
  @SkipMfa()
  me(@Req() req: AuthenticatedRequest) {
    return {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    };
  }

  @Get("metrics/overview")
  @Roles("OPERATIONS", "ADMIN", "SUPER_ADMIN")
  overview() {
    return this.metrics.getOverview();
  }

  @Get("analytics/features")
  @Roles("OPERATIONS", "ADMIN", "SUPER_ADMIN")
  features(@Query("days") days?: string) {
    return this.metrics.getFeatureUsage(days ? parseInt(days, 10) : 7);
  }

  @Get("analytics/funnels")
  @Roles("OPERATIONS", "ADMIN", "SUPER_ADMIN")
  funnels(@Query("days") days?: string) {
    return this.metrics.getFunnels(days ? parseInt(days, 10) : 30);
  }

  @Get("errors")
  @Roles("OPERATIONS", "ADMIN", "SUPER_ADMIN")
  async errors(
    @Req() req: AuthenticatedRequest,
    @Query("limit") limit?: string,
  ) {
    await this.audit.log(req.user.id, req.user.email, "VIEW_ERRORS");
    return this.metrics.getErrors(limit ? parseInt(limit, 10) : 50);
  }

  @Get("metrics/slow-endpoints")
  @Roles("OPERATIONS", "ADMIN", "SUPER_ADMIN")
  slowEndpoints() {
    return this.metrics.getSlowEndpoints();
  }

  @Get("analytics/pages")
  @Roles("OPERATIONS", "ADMIN", "SUPER_ADMIN")
  pages(@Query("days") days?: string) {
    return this.metrics.getPageViews(days ? parseInt(days, 10) : 7);
  }

  @Get("users")
  @Roles("SUPPORT", "OPERATIONS", "ADMIN", "SUPER_ADMIN")
  async listUsers(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    await this.audit.log(req.user.id, req.user.email, "VIEW_USER_PROFILE", {
      metadata: { action: "list" },
    });
    return this.users.listUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get("users/:id")
  @Roles("SUPPORT", "OPERATIONS", "ADMIN", "SUPER_ADMIN")
  async getUser(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    await this.audit.log(req.user.id, req.user.email, "VIEW_USER_PROFILE", {
      targetId: id,
    });
    return this.users.getUser(id);
  }

  @Get("support/tickets")
  @Roles("SUPPORT", "ADMIN", "SUPER_ADMIN")
  listTickets(@Query("status") status?: string) {
    return this.support.listTickets(status);
  }

  @Patch("support/tickets/:id/status")
  @Roles("SUPPORT", "ADMIN", "SUPER_ADMIN")
  updateTicket(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.support.updateTicketStatus(id, body, req.user);
  }

  @Post("support/tickets/:id/snapshot")
  @Roles("SUPPORT", "ADMIN", "SUPER_ADMIN")
  viewSnapshot(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-forwarded-for") forwardedFor?: string,
  ) {
    const ip = forwardedFor?.split(",")[0]?.trim();
    return this.support.viewSnapshot(id, body, req.user, ip);
  }

  @Get("audit-logs")
  @Roles("ADMIN", "SUPER_ADMIN")
  async auditLogs(
    @Req() req: AuthenticatedRequest,
    @Query("limit") limit?: string,
  ) {
    await this.audit.log(req.user.id, req.user.email, "VIEW_AUDIT_LOGS");
    return this.audit.list(limit ? parseInt(limit, 10) : 100);
  }

  @Get("health")
  @Roles("OPERATIONS", "ADMIN", "SUPER_ADMIN")
  healthCheck(@Req() req: AuthenticatedRequest) {
    void this.audit.log(req.user.id, req.user.email, "SYSTEM_HEALTH_CHECK");
    return this.health.check();
  }

  @Post("sync/user-directory")
  syncUserDirectory(@Headers("x-cron-secret") secret?: string) {
    const expected = process.env.CRON_SECRET;
    if (!expected || secret !== expected) {
      throw new UnauthorizedException("Invalid cron secret");
    }
    return this.users.syncUserDirectory();
  }

  @Post("aggregate/daily")
  aggregateDaily(@Headers("x-cron-secret") secret?: string) {
    const expected = process.env.CRON_SECRET;
    if (!expected || secret !== expected) {
      throw new UnauthorizedException("Invalid cron secret");
    }
    return this.aggregation.aggregateDaily();
  }
}
