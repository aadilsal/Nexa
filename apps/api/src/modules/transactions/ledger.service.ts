import { Injectable } from "@nestjs/common";
import { createHash } from "crypto";
import type { Category, TransactionEventType, TransactionType } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.module";
import { UserEncryptionService } from "../../common/encryption/user-encryption.service";

export interface TransactionPayload {
  description: string;
  amount: number;
  category: Category;
  type: TransactionType;
  notes?: string;
}

export interface EffectiveTransaction extends TransactionPayload {
  eventId: string;
  createdAt: Date;
}

const GENESIS_HASH = "genesis";

@Injectable()
export class LedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userEncryption: UserEncryptionService,
  ) {}

  private computeEventHash(previousHash: string, payload: string): string {
    return createHash("sha256")
      .update(previousHash + payload)
      .digest("hex");
  }

  private async getLastHash(cycleId: string): Promise<string> {
    const last = await this.prisma.transactionEvent.findFirst({
      where: { cycleId },
      orderBy: { createdAt: "desc" },
    });
    return last?.eventHash ?? GENESIS_HASH;
  }

  async appendEvent(
    userId: string,
    cycleId: string,
    eventType: TransactionEventType,
    payload: TransactionPayload,
    originalEventId?: string,
  ) {
    const encryptedPayload = await this.userEncryption.encryptJsonForUser(
      userId,
      payload,
    );
    const previousHash = await this.getLastHash(cycleId);
    const eventHash = this.computeEventHash(previousHash, encryptedPayload);

    return this.prisma.transactionEvent.create({
      data: {
        userId,
        cycleId,
        eventType,
        originalEventId,
        encryptedPayload,
        previousHash,
        eventHash,
      },
    });
  }

  async getEffectiveTransactions(
    userId: string,
    cycleId: string,
  ): Promise<EffectiveTransaction[]> {
    const events = await this.prisma.transactionEvent.findMany({
      where: { cycleId },
      orderBy: { createdAt: "asc" },
    });

    const deletedIds = new Set<string>();
    const corrections = new Map<string, TransactionPayload>();

    for (const event of events) {
      if (event.eventType === "DELETE" && event.originalEventId) {
        deletedIds.add(event.originalEventId);
      }
      if (event.eventType === "CORRECTION" && event.originalEventId) {
        const payload = await this.userEncryption.decryptJsonForUser<TransactionPayload>(
          userId,
          event.encryptedPayload,
        );
        corrections.set(event.originalEventId, payload);
      }
    }

    const effective: EffectiveTransaction[] = [];

    for (const event of events) {
      if (event.eventType !== "CREATE") continue;
      if (deletedIds.has(event.id)) continue;

      const payload =
        corrections.get(event.id) ??
        (await this.userEncryption.decryptJsonForUser<TransactionPayload>(
          userId,
          event.encryptedPayload,
        ));

      effective.push({
        ...payload,
        eventId: event.id,
        createdAt: event.createdAt,
      });
    }

    return effective;
  }
}
