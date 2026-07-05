import { Module } from "@nestjs/common";
import { EngineModule } from "../engine/engine.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [EngineModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
