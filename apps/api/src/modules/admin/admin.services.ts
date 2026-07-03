import {
  GoneException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UpdateSupportTicketStatusSchema, ViewSnapshotSchema } from "@nexa/shared";
import type { AdminAuditAction } from ".prisma/analytics-client";
import { AnalyticsPrismaService } from "../../common/prisma/analytics-prisma.module";
import { PrismaService } from "../../common/prisma/prisma.module";
import { SnapshotCryptoService } from "../support/snapshot-crypto.service";
import { RedisService } from "../../common/redis/redis.service";

@Injectable()
export class AdminAuditService {
  constructor(private readonly analyticsPrisma: AnalyticsPrismaService) {}

  async log(
    adminUserId: string,
    adminEmail: string,
    action: AdminAuditAction,
    options?: {
      targetId?: string;
      metadata?: Record<string, unknown>;
      reason?: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ) {
    await this.analyticsPrisma.adminAuditLog.create({
      data: {
        adminUserId,
        adminEmail,
        action,
        targetId: options?.targetId,
        metadata: (options?.metadata ?? {}) as object,
        reason: options?.reason,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
      },
    });
  }

  async list(limit = 100) {
    return this.analyticsPrisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

@Injectable()
export class AdminMetricsService {
  constructor(private readonly analyticsPrisma: AnalyticsPrismaService) {}

  async getOverview() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      openTickets,
      recentErrors,
      dauMetric,
      signupMetric,
    ] = await Promise.all([
      this.analyticsPrisma.userDirectoryEntry.count(),
      this.analyticsPrisma.supportTicket.count({
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      }),
      this.analyticsPrisma.errorReport.count({
        where: {
          lastSeenAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      this.analyticsPrisma.dailyMetric.findFirst({
        where: { metric: "dau", date: today },
      }),
      this.analyticsPrisma.dailyMetric.findFirst({
        where: { metric: "new_users", date: today },
      }),
    ]);

    const eventCounts = await this.analyticsPrisma.analyticsEvent.groupBy({
      by: ["eventName"],
      _count: { eventName: true },
      where: {
        timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { _count: { eventName: "desc" } },
      take: 10,
    });

    return {
      totalUsers,
      openTickets,
      errorsLast24h: recentErrors,
      dau: dauMetric?.value ?? 0,
      newUsersToday: signupMetric?.value ?? 0,
      topEvents: eventCounts.map((e) => ({
        event: e.eventName,
        count: e._count.eventName,
      })),
    };
  }

  async getFeatureUsage(days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const events = await this.analyticsPrisma.analyticsEvent.groupBy({
      by: ["eventName"],
      _count: { eventName: true },
      where: { timestamp: { gte: since } },
      orderBy: { _count: { eventName: "desc" } },
    });
    return events.map((e) => ({
      event: e.eventName,
      count: e._count.eventName,
    }));
  }

  async getPageViews(days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const events = await this.analyticsPrisma.analyticsEvent.findMany({
      where: {
        eventName: "page_viewed",
        timestamp: { gte: since },
      },
      select: { properties: true, route: true },
      take: 5000,
    });

    const counts = new Map<string, number>();
    for (const event of events) {
      const props = event.properties as Record<string, unknown> | null;
      const path =
        (props?.path as string | undefined) ?? event.route ?? "unknown";
      counts.set(path, (counts.get(path) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getFunnels(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const steps = [
      "signup_completed",
      "onboarding_completed",
      "dashboard_viewed",
      "transaction_logged",
    ];

    const counts = await Promise.all(
      steps.map(async (event) => {
        const users = await this.analyticsPrisma.analyticsEvent.findMany({
          where: {
            eventName: event,
            timestamp: { gte: since },
            userIdHash: { not: null },
          },
          distinct: ["userIdHash"],
          select: { userIdHash: true },
        });
        return { step: event, count: users.length };
      }),
    );

    return counts;
  }

  async getErrors(limit = 50) {
    return this.analyticsPrisma.errorReport.findMany({
      orderBy: { lastSeenAt: "desc" },
      take: limit,
    });
  }

  async getSlowEndpoints(thresholdMs = 1000, limit = 20) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const metrics = await this.analyticsPrisma.apiRequestMetric.findMany({
      where: {
        durationMs: { gte: thresholdMs },
        createdAt: { gte: since },
      },
      orderBy: { durationMs: "desc" },
      take: 500,
    });

    const grouped = new Map<
      string,
      { path: string; method: string; count: number; maxMs: number; avgMs: number }
    >();

    for (const m of metrics) {
      const key = `${m.method} ${m.path}`;
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, {
          path: m.path,
          method: m.method,
          count: 1,
          maxMs: m.durationMs,
          avgMs: m.durationMs,
        });
      } else {
        existing.count += 1;
        existing.maxMs = Math.max(existing.maxMs, m.durationMs);
        existing.avgMs = Math.round(
          (existing.avgMs * (existing.count - 1) + m.durationMs) /
            existing.count,
        );
      }
    }

    return [...grouped.values()]
      .sort((a, b) => b.maxMs - a.maxMs)
      .slice(0, limit);
  }
}

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly analyticsPrisma: AnalyticsPrismaService,
    private readonly prisma: PrismaService,
  ) {}

  async listUsers(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.analyticsPrisma.userDirectoryEntry.findMany({
        skip,
        take: limit,
        orderBy: { signupDate: "desc" },
        include: { activity: true },
      }),
      this.analyticsPrisma.userDirectoryEntry.count(),
    ]);
    return { users, total, page, limit };
  }

  async getUser(userId: string) {
    const user = await this.analyticsPrisma.userDirectoryEntry.findUnique({
      where: { id: userId },
      include: { activity: true },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async syncUserDirectory() {
    const users = await this.prisma.user.findMany({
      include: {
        sessions: { select: { id: true, expiresAt: true, userAgent: true } },
        accounts: { select: { providerId: true } },
      },
    });

    let synced = 0;
    for (const user of users) {
      const activeSessions = user.sessions.filter(
        (s) => s.expiresAt > new Date(),
      );
      const authMethods = [
        ...new Set(user.accounts.map((a) => a.providerId)),
      ];
      const devices = new Set(
        activeSessions.map((s) => s.userAgent).filter(Boolean),
      );

      await this.analyticsPrisma.userDirectoryEntry.upsert({
        where: { id: user.id },
        create: {
          id: user.id,
          email: user.email,
          name: user.name,
          signupDate: user.createdAt,
          lastLoginAt: user.sessions[0]?.expiresAt ?? null,
          authMethods,
          activeSessionCount: activeSessions.length,
          deviceCount: devices.size,
          emailVerified: user.emailVerified,
          onboardingComplete: user.onboardingComplete,
          role: user.role,
        },
        update: {
          email: user.email,
          name: user.name,
          lastLoginAt: user.sessions[0]?.expiresAt ?? null,
          authMethods,
          activeSessionCount: activeSessions.length,
          deviceCount: devices.size,
          emailVerified: user.emailVerified,
          onboardingComplete: user.onboardingComplete,
          role: user.role,
        },
      });

      await this.analyticsPrisma.userActivitySummary.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      });

      synced++;
    }

    return { synced };
  }
}

@Injectable()
export class AdminSupportService {
  constructor(
    private readonly analyticsPrisma: AnalyticsPrismaService,
    private readonly snapshotCrypto: SnapshotCryptoService,
    private readonly audit: AdminAuditService,
  ) {}

  async listTickets(status?: string) {
    return this.analyticsPrisma.supportTicket.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        snapshot: {
          select: {
            id: true,
            status: true,
            expiresAt: true,
          },
        },
      },
    });
  }

  async updateTicketStatus(
    ticketId: string,
    body: unknown,
    admin: { id: string; email: string },
  ) {
    const input = UpdateSupportTicketStatusSchema.parse(body);

    const ticket = await this.analyticsPrisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: input.status },
    });

    await this.audit.log(admin.id, admin.email, "UPDATE_TICKET_STATUS", {
      targetId: ticketId,
      metadata: { status: input.status },
    });

    return ticket;
  }

  async viewSnapshot(
    ticketId: string,
    body: unknown,
    admin: { id: string; email: string },
    ipAddress?: string,
  ) {
    const input = ViewSnapshotSchema.parse(body);

    const ticket = await this.analyticsPrisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { snapshot: true },
    });
    if (!ticket?.snapshot) {
      throw new NotFoundException("No snapshot for this ticket");
    }

    const snapshot = ticket.snapshot;
    if (snapshot.status === "REVOKED") {
      throw new GoneException("Snapshot has been revoked by the user");
    }
    if (snapshot.expiresAt < new Date()) {
      await this.analyticsPrisma.supportSnapshot.update({
        where: { id: snapshot.id },
        data: { status: "EXPIRED" },
      });
      throw new GoneException("Snapshot has expired");
    }

    const payload = this.snapshotCrypto.decryptPayload(snapshot.encryptedPayload);

    await this.analyticsPrisma.snapshotAccessLog.create({
      data: {
        snapshotId: snapshot.id,
        ticketId,
        adminUserId: admin.id,
        adminEmail: admin.email,
        reason: input.reason,
        ipAddress,
      },
    });

    await this.audit.log(admin.id, admin.email, "VIEW_SNAPSHOT", {
      targetId: ticketId,
      reason: input.reason,
      ipAddress,
    });

    return { payload, expiresAt: snapshot.expiresAt };
  }
}

@Injectable()
export class AdminAggregationService {
  constructor(private readonly analyticsPrisma: AnalyticsPrismaService) {}

  async aggregateDaily() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const [dau, wau, mau, newUsers] = await Promise.all([
      this.analyticsPrisma.analyticsEvent.findMany({
        where: { timestamp: { gte: today, lt: tomorrow } },
        distinct: ["userIdHash"],
        select: { userIdHash: true },
      }),
      this.analyticsPrisma.analyticsEvent.findMany({
        where: { timestamp: { gte: weekAgo } },
        distinct: ["userIdHash"],
        select: { userIdHash: true },
      }),
      this.analyticsPrisma.analyticsEvent.findMany({
        where: { timestamp: { gte: monthAgo } },
        distinct: ["userIdHash"],
        select: { userIdHash: true },
      }),
      this.analyticsPrisma.userDirectoryEntry.count({
        where: { signupDate: { gte: today, lt: tomorrow } },
      }),
    ]);

    const metrics = [
      { metric: "dau", value: dau.filter((e) => e.userIdHash).length },
      { metric: "wau", value: wau.filter((e) => e.userIdHash).length },
      { metric: "mau", value: mau.filter((e) => e.userIdHash).length },
      { metric: "new_users", value: newUsers },
    ];

    for (const { metric, value } of metrics) {
      await this.analyticsPrisma.dailyMetric.upsert({
        where: {
          date_metric_dimensionKey: {
            date: today,
            metric,
            dimensionKey: "",
          },
        },
        create: { date: today, metric, value, dimensionKey: "" },
        update: { value },
      });
    }

    return { date: today, metrics };
  }
}

@Injectable()
export class AdminHealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsPrisma: AnalyticsPrismaService,
    private readonly redis: RedisService,
  ) {}

  async check() {
    const checks: Record<string, { status: string; latencyMs?: number }> = {};

    const financeStart = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.financeDb = { status: "ok", latencyMs: Date.now() - financeStart };
    } catch {
      checks.financeDb = { status: "error" };
    }

    const analyticsStart = Date.now();
    try {
      await this.analyticsPrisma.$queryRaw`SELECT 1`;
      checks.analyticsDb = {
        status: "ok",
        latencyMs: Date.now() - analyticsStart,
      };
    } catch {
      checks.analyticsDb = { status: "error" };
    }

    checks.redis = {
      status: this.redis.isAvailable() ? "ok" : "degraded",
    };

    checks.groq = {
      status: process.env.GROQ_API_KEY ? "configured" : "missing",
    };

    return {
      status: Object.values(checks).every(
        (c) => c.status === "ok" || c.status === "configured",
      )
        ? "healthy"
        : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}
