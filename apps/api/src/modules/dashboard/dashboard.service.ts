import { Injectable } from "@nestjs/common";
import type { EngineOutput } from "@nexa/finance-engine";
import { RateLimitService } from "../../common/rate-limit/rate-limit.service";
import { EngineDataService } from "../engine/engine-data.service";

@Injectable()
export class DashboardService {
  constructor(
    private readonly engineData: EngineDataService,
    private readonly rateLimit: RateLimitService,
  ) {}

  async getDashboard(userId: string) {
    await this.rateLimit.assertUserLimit(userId, "dashboard", 60, 60);
    const engine = await this.engineData.calculateForUser(userId);
    return { ...engine, insight: null as string | null };
  }

  async getSafeToSpend(userId: string) {
    await this.rateLimit.assertUserLimit(userId, "dashboard", 60, 60);
    const output = await this.engineData.calculateForUser(userId);
    return output.safeToSpend;
  }

  async getHealthScore(userId: string) {
    await this.rateLimit.assertUserLimit(userId, "dashboard", 60, 60);
    const output = await this.engineData.calculateForUser(userId);
    return output.healthScore;
  }
}
