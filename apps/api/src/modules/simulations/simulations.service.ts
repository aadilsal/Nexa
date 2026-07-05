import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { simulatePurchase } from "@nexa/finance-engine";
import type { PurchaseSimulationInput } from "@nexa/shared";
import { GroqService } from "../../common/groq/groq.service";
import { CurrencyService } from "../../common/currency/currency.service";
import { RedisService } from "../../common/redis/redis.service";
import { EngineDataService } from "../engine/engine-data.service";

@Injectable()
export class SimulationsService {
  constructor(
    private readonly engineData: EngineDataService,
    private readonly groq: GroqService,
    private readonly redis: RedisService,
    private readonly currency: CurrencyService,
  ) {}

  async simulate(userId: string, input: PurchaseSimulationInput) {
    await this.checkRateLimit(userId, "simulations", 60, 60);

    const currencyCtx = await this.currency.getUserContext(userId);
    const engineInput = await this.engineData.buildEngineInput(userId);
    const purchaseDate = input.purchaseDate
      ? new Date(input.purchaseDate)
      : undefined;
    const amountInPrimary = this.currency.toPrimary(
      input.amount,
      input.currency,
      currencyCtx,
    );

    const result = simulatePurchase(engineInput, {
      itemName: input.itemName,
      amount: amountInPrimary,
      purchaseDate,
    });

    const explanation = await this.groq.explain(
      {
        itemName: input.itemName,
        amount: amountInPrimary,
        currency: currencyCtx.primaryCurrency,
        recommendation: result.recommendation,
        triggeredRule: result.triggeredRule,
        impacts: result.impacts,
        suggestedWaitUntil: result.suggestedWaitUntil,
      },
      `Explain why the recommendation is ${result.recommendation} for buying ${input.itemName} at ${currencyCtx.primaryCurrency} ${amountInPrimary}.`,
      500,
      currencyCtx.primaryCurrency,
    );

    return { ...result, explanation, currency: currencyCtx.primaryCurrency };
  }

  private async checkRateLimit(
    userId: string,
    group: string,
    limit: number,
    windowSeconds: number,
  ) {
    const { allowed } = await this.redis.checkRateLimit(
      `ratelimit:${group}:${userId}`,
      limit,
      windowSeconds,
    );
    if (!allowed) {
      throw new HttpException("Rate limit exceeded", HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
