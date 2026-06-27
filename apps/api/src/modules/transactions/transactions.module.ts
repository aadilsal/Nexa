import { Module } from "@nestjs/common";
import { CyclesModule } from "../cycles/cycles.module";
import { EngineModule } from "../engine/engine.module";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";
import { LedgerService } from "./ledger.service";

@Module({
  imports: [CyclesModule, EngineModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, LedgerService],
  exports: [TransactionsService, LedgerService],
})
export class TransactionsModule {}
