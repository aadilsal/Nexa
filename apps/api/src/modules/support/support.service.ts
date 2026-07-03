import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import {
  CreateSupportTicketSchema,
  PublicContactSchema,
} from "@nexa/shared";
import { AnalyticsPrismaService } from "../../common/prisma/analytics-prisma.module";
import { RedisService } from "../../common/redis/redis.service";
import { SnapshotBuilderService } from "./snapshot-builder.service";
import { SnapshotCryptoService } from "./snapshot-crypto.service";

@Injectable()
export class SupportService {
  constructor(
    private readonly analyticsPrisma: AnalyticsPrismaService,
    private readonly snapshotCrypto: SnapshotCryptoService,
    private readonly redis: RedisService,
    private readonly snapshotBuilder: SnapshotBuilderService,
  ) {}

  async createTicket(userId: string, body: unknown) {
    const { allowed } = await this.redis.checkRateLimit(
      `ratelimit:support:${userId}`,
      10,
      3600,
    );
    if (!allowed) {
      throw new BadRequestException(
        "Too many support requests. Try again later.",
      );
    }

    const input = CreateSupportTicketSchema.parse(body);

    if (input.includeSnapshot && !input.snapshotConsent) {
      throw new BadRequestException(
        "Snapshot consent is required when including a financial snapshot",
      );
    }

    const ticket = await this.analyticsPrisma.supportTicket.create({
      data: {
        userId,
        category: input.category,
        subject: input.subject,
        description: input.description,
        route: input.route,
        browser: input.browser,
        os: input.os,
        deviceType: input.deviceType,
        appVersion: input.appVersion,
        consoleErrors: input.consoleErrors ?? [],
        hasSnapshot: Boolean(input.includeSnapshot && input.snapshotConsent),
      },
    });

    if (input.includeSnapshot && input.snapshotConsent) {
      const payload = await this.snapshotBuilder.build(userId);
      const encryptedPayload = this.snapshotCrypto.encryptPayload(payload);
      const accessToken = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

      await this.analyticsPrisma.supportSnapshot.create({
        data: {
          ticketId: ticket.id,
          encryptedPayload,
          accessToken,
          expiresAt,
        },
      });
    }

    return this.getUserTicket(userId, ticket.id);
  }

  async createPublicContact(body: unknown, ip?: string) {
    if (ip) {
      const { allowed } = await this.redis.checkRateLimit(
        `ratelimit:contact:${ip}`,
        5,
        3600,
      );
      if (!allowed) {
        throw new BadRequestException("Too many contact requests. Try again later.");
      }
    }

    const input = PublicContactSchema.parse(body);

    const ticket = await this.analyticsPrisma.supportTicket.create({
      data: {
        guestEmail: input.email,
        guestName: input.name,
        category: "OTHER",
        subject: `Contact from ${input.name}`,
        description: input.message,
      },
    });

    return { id: ticket.id, message: "Thank you — we will get back to you soon." };
  }

  async listUserTickets(userId: string) {
    const tickets = await this.analyticsPrisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        snapshot: {
          select: {
            id: true,
            status: true,
            expiresAt: true,
            revokedAt: true,
            accessLogs: {
              select: {
                adminEmail: true,
                reason: true,
                createdAt: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    return tickets.map((t) => ({
      id: t.id,
      category: t.category,
      subject: t.subject,
      description: t.description,
      status: t.status,
      hasSnapshot: t.hasSnapshot,
      createdAt: t.createdAt,
      snapshot: t.snapshot
        ? {
            status: t.snapshot.status,
            expiresAt: t.snapshot.expiresAt,
            revokedAt: t.snapshot.revokedAt,
            accessLogs: t.snapshot.accessLogs,
          }
        : null,
    }));
  }

  async getUserTicket(userId: string, ticketId: string) {
    const ticket = await this.analyticsPrisma.supportTicket.findFirst({
      where: { id: ticketId, userId },
      include: {
        snapshot: {
          select: {
            status: true,
            expiresAt: true,
            revokedAt: true,
            accessLogs: {
              select: { adminEmail: true, reason: true, createdAt: true },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    return ticket;
  }

  async revokeSnapshot(userId: string, ticketId: string) {
    const ticket = await this.analyticsPrisma.supportTicket.findFirst({
      where: { id: ticketId, userId },
      include: { snapshot: true },
    });
    if (!ticket?.snapshot) {
      throw new NotFoundException("No snapshot found for this ticket");
    }

    await this.analyticsPrisma.supportSnapshot.update({
      where: { id: ticket.snapshot.id },
      data: { status: "REVOKED", revokedAt: new Date() },
    });

    return { ok: true };
  }
}
