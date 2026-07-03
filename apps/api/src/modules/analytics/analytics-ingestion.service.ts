import { Injectable } from "@nestjs/common";
import type { Prisma } from ".prisma/analytics-client";
import { AnalyticsBatchSchema, ErrorReportSchema } from "@nexa/shared";
import { AnalyticsPrismaService } from "../../common/prisma/analytics-prisma.module";
import { PrismaService } from "../../common/prisma/prisma.module";
import {
  assertNoForbiddenKeys,
  sanitizeAnalyticsProperties,
} from "../../common/privacy/forbidden-fields";
import { hashUserId } from "../../common/privacy/user-hash";

const ACTIVITY_COUNTERS: Record<string, keyof ActivityCounters> = {
  transaction_logged: "transactionsLogged",
  goal_created: "goalsCreated",
  ai_chat_message_sent: "aiMessagesSent",
  simulation_run: "simulationsRun",
  session_started: "sessionCount",
  onboarding_completed: "onboardingCompleted",
};

interface ActivityCounters {
  transactionsLogged: number;
  goalsCreated: number;
  aiMessagesSent: number;
  simulationsRun: number;
  sessionCount: number;
  onboardingCompleted: boolean;
}

@Injectable()
export class AnalyticsIngestionService {
  constructor(
    private readonly analyticsPrisma: AnalyticsPrismaService,
    private readonly prisma: PrismaService,
  ) {}

  async ingestBatch(userId: string, body: unknown) {
    const { events } = AnalyticsBatchSchema.parse(body);

    for (const event of events) {
      assertNoForbiddenKeys(
        event.properties as Record<string, unknown> | undefined,
      );
    }

    await this.ensureUserDirectoryEntry(userId);

    const userIdHash = hashUserId(userId);
    const counters: ActivityCounters = {
      transactionsLogged: 0,
      goalsCreated: 0,
      aiMessagesSent: 0,
      simulationsRun: 0,
      sessionCount: 0,
      onboardingCompleted: false,
    };

    await this.analyticsPrisma.analyticsEvent.createMany({
      data: events.map((event) => {
        const counterKey = ACTIVITY_COUNTERS[event.event];
        if (counterKey === "onboardingCompleted") {
          counters.onboardingCompleted = true;
        } else if (counterKey) {
          counters[counterKey as Exclude<keyof ActivityCounters, "onboardingCompleted">] += 1;
        }

        return {
          eventName: event.event,
          userIdHash,
          sessionId: event.sessionId,
          properties: sanitizeAnalyticsProperties(
            event.properties as Record<string, unknown> | undefined,
          ) as Prisma.InputJsonValue,
          route: event.route,
          referrer: event.referrer,
          appVersion: event.appVersion,
          platform: event.platform,
          browser: event.browser,
          os: event.os,
          deviceType: event.deviceType,
          timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
        };
      }),
    });

    await this.analyticsPrisma.userActivitySummary.upsert({
      where: { userId },
      create: {
        userId,
        transactionsLogged: counters.transactionsLogged,
        goalsCreated: counters.goalsCreated,
        aiMessagesSent: counters.aiMessagesSent,
        simulationsRun: counters.simulationsRun,
        sessionCount: counters.sessionCount,
        onboardingCompleted: counters.onboardingCompleted,
        lastActiveAt: new Date(),
      },
      update: {
        transactionsLogged: { increment: counters.transactionsLogged },
        goalsCreated: { increment: counters.goalsCreated },
        aiMessagesSent: { increment: counters.aiMessagesSent },
        simulationsRun: { increment: counters.simulationsRun },
        sessionCount: { increment: counters.sessionCount },
        ...(counters.onboardingCompleted
          ? { onboardingCompleted: true }
          : {}),
        lastActiveAt: new Date(),
      },
    });

    return { accepted: events.length };
  }

  private async ensureUserDirectoryEntry(userId: string) {
    const existing = await this.analyticsPrisma.userDirectoryEntry.findUnique({
      where: { id: userId },
    });
    if (existing) return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: { select: { providerId: true } } },
    });
    if (!user) return;

    await this.analyticsPrisma.userDirectoryEntry.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        signupDate: user.createdAt,
        authMethods: [...new Set(user.accounts.map((a) => a.providerId))],
        emailVerified: user.emailVerified,
        onboardingComplete: user.onboardingComplete,
        role: user.role,
      },
    });
  }

  async reportError(userId: string | undefined, body: unknown) {
    const input = ErrorReportSchema.parse(body);
    const fingerprint = hashUserId(
      `${input.source}:${input.errorType}:${input.message}:${input.route ?? ""}`,
    );

    await this.analyticsPrisma.errorReport.upsert({
      where: { fingerprint },
      create: {
        source: input.source,
        errorType: input.errorType,
        message: input.message,
        stackTrace: input.stackTrace,
        route: input.route,
        userIdHash: userId ? hashUserId(userId) : undefined,
        browser: input.browser,
        os: input.os,
        appVersion: input.appVersion,
        fingerprint,
      },
      update: {
        count: { increment: 1 },
        lastSeenAt: new Date(),
      },
    });

    return { ok: true };
  }
}
