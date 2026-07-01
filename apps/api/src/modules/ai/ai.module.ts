import { Module } from "@nestjs/common";
import { EngineModule } from "../engine/engine.module";
import { InsightsModule } from "../insights/insights.module";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";

@Module({
  imports: [EngineModule, InsightsModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
