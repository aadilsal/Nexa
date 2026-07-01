import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import type { EngineOutput } from "@nexa/finance-engine";
import { GroqService } from "../../common/groq/groq.service";
import { RedisService } from "../../common/redis/redis.service";
import { EngineDataService } from "../engine/engine-data.service";

@Injectable()
export class InsightsService {
  constructor(
    private readonly engineData: EngineDataService,
    private readonly groq: GroqService,
    private readonly redis: RedisService,
  ) {}

  async getDashboardInsight(userId: string): Promise<string> {
    await this.checkAiRateLimit(userId);
    const output = await this.engineData.calculateForUser(userId);
    return this.groq.explain(output, "Write today's brief financial insight.");
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
    return this.groq.explain(
      { engine: this.slimOutput(output), postLog: diff },
      `Explain the impact of logging ${diff.transaction.description} for PKR ${diff.transaction.amount}.`,
    );
  }

  private slimOutput(output: EngineOutput) {
    return {
      safeToSpend: output.safeToSpend,
      healthScore: output.healthScore,
      savings: output.savings,
      goals: output.goals.map((g) => ({
        name: g.name,
        progress: g.progress,
        onTrack: g.onTrack,
        eta: g.eta,
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
