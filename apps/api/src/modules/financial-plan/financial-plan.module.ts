import { Module } from "@nestjs/common";
import { EngineModule } from "../engine/engine.module";
import { FinancialPlanController } from "./financial-plan.controller";
import { FinancialPlanService } from "./financial-plan.service";

@Module({
  imports: [EngineModule],
  controllers: [FinancialPlanController],
  providers: [FinancialPlanService],
})
export class FinancialPlanModule {}
