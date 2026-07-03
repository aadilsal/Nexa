import {
  Global,
  Injectable,
  Module,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaClient } from ".prisma/analytics-client";

@Injectable()
export class AnalyticsPrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

@Global()
@Module({
  providers: [AnalyticsPrismaService],
  exports: [AnalyticsPrismaService],
})
export class AnalyticsPrismaModule {}
