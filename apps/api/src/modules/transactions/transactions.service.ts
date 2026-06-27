import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { parseTransactionInput } from "@nexa/finance-engine";
import type {
  Category,
  CreateTransactionInput,
  ParsedTransaction,
  TransactionType,
} from "@nexa/shared";
import { AuditService } from "../../common/audit/audit.service";
import { CyclesService } from "../cycles/cycles.service";
import { LedgerService } from "./ledger.service";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly ledger: LedgerService,
    private readonly cycles: CyclesService,
    private readonly audit: AuditService,
  ) {}

  parse(rawInput: string): ParsedTransaction {
    try {
      return parseTransactionInput(rawInput);
    } catch {
      throw new BadRequestException(
        "Could not parse transaction. Use format: 'Description 5000'",
      );
    }
  }

  async create(userId: string, input: CreateTransactionInput) {
    let parsed: ParsedTransaction;

    if (input.rawInput) {
      parsed = this.parse(input.rawInput);
    } else if (
      input.description &&
      input.amount &&
      input.category &&
      input.type
    ) {
      parsed = {
        description: input.description,
        amount: input.amount,
        category: input.category,
        type: input.type,
        confidence: 1,
      };
    } else {
      throw new BadRequestException("Provide rawInput or full transaction fields");
    }

    const cycle = await this.cycles.getOrCreateActiveCycle(userId);

    const event = await this.ledger.appendEvent(userId, cycle.id, "CREATE", {
      description: parsed.description,
      amount: parsed.amount,
      category: parsed.category as Category,
      type: parsed.type as TransactionType,
    });

    await this.audit.log(userId, "TRANSACTION_CREATE", {
      eventId: event.id,
      category: parsed.category,
    });

    const startingBalance = await this.cycles.getStartingBalance(
      userId,
      cycle.id,
    );
    const transactions = await this.ledger.getEffectiveTransactions(
      userId,
      cycle.id,
    );

    const cashBefore =
      startingBalance +
      transactions
        .slice(0, -1)
        .reduce(
          (sum, tx) =>
            sum + (tx.type === "INCOME" ? tx.amount : -tx.amount),
          0,
        );

    const cashAfter =
      startingBalance +
      transactions.reduce(
        (sum, tx) => sum + (tx.type === "INCOME" ? tx.amount : -tx.amount),
        0,
      );

    return {
      transaction: {
        eventId: event.id,
        ...parsed,
      },
      cash: { before: cashBefore, after: cashAfter },
    };
  }

  async list(userId: string) {
    const cycle = await this.cycles.getOrCreateActiveCycle(userId);
    const transactions = await this.ledger.getEffectiveTransactions(
      userId,
      cycle.id,
    );

    return transactions.map((tx) => ({
      id: tx.eventId,
      description: tx.description,
      amount: tx.amount,
      category: tx.category,
      type: tx.type,
      createdAt: tx.createdAt,
    }));
  }

  async correct(
    userId: string,
    eventId: string,
    updates: Partial<{
      description: string;
      amount: number;
      category: Category;
      type: TransactionType;
    }>,
  ) {
    const cycle = await this.cycles.getOrCreateActiveCycle(userId);
    const transactions = await this.ledger.getEffectiveTransactions(
      userId,
      cycle.id,
    );
    const existing = transactions.find((tx) => tx.eventId === eventId);

    if (!existing) {
      throw new NotFoundException("Transaction not found");
    }

    const payload = { ...existing, ...updates };
    delete (payload as { eventId?: string }).eventId;
    delete (payload as { createdAt?: Date }).createdAt;

    const event = await this.ledger.appendEvent(
      userId,
      cycle.id,
      "CORRECTION",
      payload,
      eventId,
    );

    await this.audit.log(userId, "TRANSACTION_CORRECT", { eventId });

    return { correctionEventId: event.id, transaction: payload };
  }

  async delete(userId: string, eventId: string) {
    const cycle = await this.cycles.getOrCreateActiveCycle(userId);
    const transactions = await this.ledger.getEffectiveTransactions(
      userId,
      cycle.id,
    );

    if (!transactions.find((tx) => tx.eventId === eventId)) {
      throw new NotFoundException("Transaction not found");
    }

    const event = await this.ledger.appendEvent(
      userId,
      cycle.id,
      "DELETE",
      {
        description: "deleted",
        amount: 0,
        category: "OTHER",
        type: "EXPENSE",
      },
      eventId,
    );

    await this.audit.log(userId, "TRANSACTION_DELETE", { eventId });

    return { deleteEventId: event.id };
  }

  async recategorize(userId: string, eventId: string, category: Category) {
    return this.correct(userId, eventId, { category });
  }
}
