import { Module } from "@nestjs/common";
import { InsightsModule } from "../insights/insights.module";
import { EngineModule } from "../engine/engine.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [EngineModule, InsightsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
