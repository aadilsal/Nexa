import { Module } from "@nestjs/common";
import { CyclesModule } from "../cycles/cycles.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { GoalsModule } from "../goals/goals.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [CyclesModule, TransactionsModule, GoalsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
