import { Module } from "@nestjs/common";
import { CyclesModule } from "../cycles/cycles.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { EngineDataService } from "./engine-data.service";

@Module({
  imports: [CyclesModule, TransactionsModule],
  providers: [EngineDataService],
  exports: [EngineDataService],
})
export class EngineModule {}
