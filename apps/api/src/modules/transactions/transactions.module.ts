import { forwardRef, Module } from "@nestjs/common";
import { InsightsModule } from "../insights/insights.module";
import { CyclesModule } from "../cycles/cycles.module";
import { EngineModule } from "../engine/engine.module";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";
import { LedgerService } from "./ledger.service";

@Module({
  imports: [forwardRef(() => CyclesModule), EngineModule, InsightsModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, LedgerService],
  exports: [TransactionsService, LedgerService],
})
export class TransactionsModule {}
