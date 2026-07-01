import { Module, forwardRef } from "@nestjs/common";
import { TransactionsModule } from "../transactions/transactions.module";
import { ExportController } from "./export.controller";
import { ExportService } from "./export.service";

@Module({
  imports: [forwardRef(() => TransactionsModule)],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
