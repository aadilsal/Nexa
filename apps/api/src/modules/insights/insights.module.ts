import { Module } from "@nestjs/common";
import { EngineModule } from "../engine/engine.module";
import { InsightsService } from "./insights.service";

@Module({
  imports: [EngineModule],
  providers: [InsightsService],
  exports: [InsightsService],
})
export class InsightsModule {}
