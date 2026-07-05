import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { parseTransactionInput } from "@nexa/finance-engine";
import {
  normalizeCurrency,
  type Category,
  type CreateTransactionInput,
  type ParsedTransaction,
  type TransactionType,
} from "@nexa/shared";
import { AuditService } from "../../common/audit/audit.service";
import { RateLimitService } from "../../common/rate-limit/rate-limit.service";
import { CurrencyService } from "../../common/currency/currency.service";
import { EngineDataService } from "../engine/engine-data.service";
import { InsightsService } from "../insights/insights.service";
import { CyclesService } from "../cycles/cycles.service";
import { LedgerService } from "./ledger.service";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly ledger: LedgerService,
    private readonly cycles: CyclesService,
    private readonly audit: AuditService,
    private readonly engineData: EngineDataService,
    private readonly insights: InsightsService,
    private readonly rateLimit: RateLimitService,
    private readonly currency: CurrencyService,
  ) {}

  async parseForUser(
    userId: string,
    rawInput: string,
    currencyOverride?: string,
  ): Promise<ParsedTransaction> {
    const ctx = await this.currency.getUserContext(userId);
    const defaultCurrency = normalizeCurrency(
      currencyOverride,
      ctx.primaryCurrency,
    );
    try {
      return parseTransactionInput(rawInput, defaultCurrency);
    } catch {
      throw new BadRequestException(
        "Could not parse transaction. Use format: 'Description 5000' or '$500 Description'",
      );
    }
  }

  async create(userId: string, input: CreateTransactionInput) {
    await this.rateLimit.assertUserLimit(userId, "transactions", 120, 60);
    const currencyCtx = await this.currency.getUserContext(userId);

    let parsed: ParsedTransaction;

    if (input.rawInput) {
      parsed = await this.parseForUser(userId, input.rawInput);
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
        currency: normalizeCurrency(
          input.currency ?? currencyCtx.primaryCurrency,
          currencyCtx.primaryCurrency,
        ),
        confidence: 1,
      };
    } else {
      throw new BadRequestException("Provide rawInput or full transaction fields");
    }

    const txCurrency = normalizeCurrency(
      input.currency ?? parsed.currency ?? currencyCtx.primaryCurrency,
      currencyCtx.primaryCurrency,
    );

    const cycle = await this.cycles.getOrCreateActiveCycle(userId);

    const event = await this.ledger.appendEvent(userId, cycle.id, "CREATE", {
      description: parsed.description,
      amount: parsed.amount,
      category: parsed.category as Category,
      type: parsed.type as TransactionType,
      currency: txCurrency,
    });

    await this.audit.log(userId, "TRANSACTION_CREATE", {
      eventId: event.id,
      category: parsed.category,
    });

    await this.engineData.invalidateUserCache(userId);

    const startingBalance = await this.cycles.getStartingBalance(
      userId,
      cycle.id,
    );
    const transactions = await this.ledger.getEffectiveTransactions(
      userId,
      cycle.id,
    );

    const signedAmount = (tx: {
      amount: number;
      type: TransactionType;
      currency?: string;
    }) => {
      const primary = this.currency.toPrimary(
        tx.amount,
        tx.currency,
        currencyCtx,
      );
      return tx.type === "INCOME" ? primary : -primary;
    };

    const cashBefore =
      startingBalance +
      transactions
        .slice(0, -1)
        .reduce((sum, tx) => sum + signedAmount(tx), 0);

    const cashAfter =
      startingBalance +
      transactions.reduce((sum, tx) => sum + signedAmount(tx), 0);

    const engineDiff = await this.engineData.calculateDiffForNewTransaction(
      userId,
      true,
    );

    let insight: string | null = null;
    try {
      insight = await this.insights.getPostLogInsight(userId, {
        safeToSpend: engineDiff.safeToSpend,
        healthScore: engineDiff.healthScore,
        transaction: {
          description: parsed.description,
          amount: parsed.amount,
          category: parsed.category,
        },
      });
    } catch {
      insight = null;
    }

    return {
      transaction: {
        eventId: event.id,
        ...parsed,
        currency: txCurrency,
      },
      cash: { before: cashBefore, after: cashAfter },
      safeToSpend: engineDiff.safeToSpend,
      healthScore: engineDiff.healthScore,
      goalImpact: engineDiff.goalImpact,
      insight,
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
      currency: normalizeCurrency(tx.currency),
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
    await this.engineData.invalidateUserCache(userId);

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
    await this.engineData.invalidateUserCache(userId);

    return { deleteEventId: event.id };
  }

  async recategorize(userId: string, eventId: string, category: Category) {
    return this.correct(userId, eventId, { category });
  }
}
