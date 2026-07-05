import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import type { EngineOutput } from "@nexa/finance-engine";
import { GroqService } from "../../common/groq/groq.service";
import { CurrencyService } from "../../common/currency/currency.service";
import { RedisService } from "../../common/redis/redis.service";
import { EngineDataService } from "../engine/engine-data.service";

const INSIGHT_CACHE_TTL = 3600;

@Injectable()
export class InsightsService {
  constructor(
    private readonly engineData: EngineDataService,
    private readonly groq: GroqService,
    private readonly redis: RedisService,
    private readonly currency: CurrencyService,
  ) {}

  async getDashboardInsight(
    userId: string,
    engineOutput?: EngineOutput,
  ): Promise<string> {
    const cacheKey = `insight:v2:${userId}:${new Date().toISOString().slice(0, 10)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    await this.checkAiRateLimit(userId);
    const output = engineOutput ?? (await this.engineData.calculateForUser(userId));
    const currencyCtx = await this.currency.getUserContext(userId);
    const insight = await this.groq.explain(
      this.slimOutput(output),
      "Write today's brief financial insight.",
      500,
      currencyCtx.primaryCurrency,
    );
    await this.redis.set(cacheKey, insight, INSIGHT_CACHE_TTL);
    return insight;
  }

  async getPostLogInsight(
    userId: string,
    diff: {
      safeToSpend: { before: number; after: number };
      healthScore: { before: number; after: number };
      transaction: { description: string; amount: number; category: string };
    },
  ): Promise<string> {
    await this.checkAiRateLimit(userId);
    const output = await this.engineData.calculateForUser(userId);
    const currencyCtx = await this.currency.getUserContext(userId);
    return this.groq.explain(
      { engine: this.slimOutput(output), postLog: diff, currency: currencyCtx.primaryCurrency },
      `Explain the impact of logging ${diff.transaction.description}.`,
      500,
      currencyCtx.primaryCurrency,
    );
  }

  private slimOutput(output: EngineOutput) {
    return {
      safeToSpend: output.safeToSpend,
      healthScore: output.healthScore,
      cash: output.cash,
      savings: {
        ...output.savings,
        actualRatePercent: Math.round(output.savings.actualRate * 100),
        targetRatePercent: Math.round(output.savings.targetRate * 100),
      },
      goals: output.goals.map((g) => ({
        name: g.name,
        progress: g.progress,
        onTrack: g.onTrack,
        eta: g.eta,
        etaMonth: new Date(g.eta).toLocaleString("en-PK", {
          month: "long",
          year: "numeric",
        }),
      })),
      cycle: { daysRemaining: output.cycle.daysRemaining },
    };
  }

  private async checkAiRateLimit(userId: string) {
    const { allowed } = await this.redis.checkRateLimit(
      `ratelimit:ai:${userId}`,
      30,
      60,
    );
    if (!allowed) {
      throw new HttpException("AI rate limit exceeded", HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
