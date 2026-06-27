import { Injectable } from "@nestjs/common";
import { EngineDataService } from "../engine/engine-data.service";

@Injectable()
export class DashboardService {
  constructor(private readonly engineData: EngineDataService) {}

  async getDashboard(userId: string) {
    return this.engineData.calculateForUser(userId);
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
