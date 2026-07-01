import { Injectable } from "@nestjs/common";
import { InsightsService } from "../insights/insights.service";
import { EngineDataService } from "../engine/engine-data.service";

@Injectable()
export class DashboardService {
  constructor(
    private readonly engineData: EngineDataService,
    private readonly insights: InsightsService,
  ) {}

  async getDashboard(userId: string) {
    const engine = await this.engineData.calculateForUser(userId);
    let insight: string | null = null;

    try {
      insight = await this.insights.getDashboardInsight(userId);
    } catch {
      insight = null;
    }

    return { ...engine, insight };
  }

  async getSafeToSpend(userId: string) {
    const output = await this.engineData.calculateForUser(userId);
    return output.safeToSpend;
  }

  async getHealthScore(userId: string) {
    const output = await this.engineData.calculateForUser(userId);
    return output.healthScore;
  }
}
