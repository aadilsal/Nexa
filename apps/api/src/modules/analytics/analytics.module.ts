import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsIngestionService } from "./analytics-ingestion.service";

@Module({
  imports: [AuthModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsIngestionService],
  exports: [AnalyticsIngestionService],
})
export class AnalyticsModule {}
