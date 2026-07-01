import { forwardRef, Module } from "@nestjs/common";
import { TransactionsModule } from "../transactions/transactions.module";
import { CyclesController } from "./cycles.controller";
import { CyclesService } from "./cycles.service";

@Module({
  imports: [forwardRef(() => TransactionsModule)],
  controllers: [CyclesController],
  providers: [CyclesService],
  exports: [CyclesService],
})
export class CyclesModule {}
