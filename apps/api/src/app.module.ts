import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { getRootEnvPath } from "./config/env-path";
import { PrismaModule } from "./common/prisma/prisma.module";
import { EncryptionModule } from "./common/encryption/encryption.module";
import { AuditModule } from "./common/audit/audit.module";
import { RedisModule } from "./common/redis/redis.module";
import { GroqModule } from "./common/groq/groq.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { OnboardingModule } from "./modules/onboarding/onboarding.module";
import { CyclesModule } from "./modules/cycles/cycles.module";
import { TransactionsModule } from "./modules/transactions/transactions.module";
import { GoalsModule } from "./modules/goals/goals.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { SimulationsModule } from "./modules/simulations/simulations.module";
import { AiModule } from "./modules/ai/ai.module";
import { AccountModule } from "./modules/account/account.module";
import { ExportModule } from "./modules/export/export.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { AnalyticsPrismaModule } from "./common/prisma/analytics-prisma.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { SupportModule } from "./modules/support/support.module";
import { AdminModule } from "./modules/admin/admin.module";
import { HealthModule } from "./modules/health/health.module";
import { RateLimitModule } from "./common/rate-limit/rate-limit.module";
import { CurrencyModule } from "./common/currency/currency.module";
import { CurrenciesModule } from "./modules/currencies/currencies.module";
import { FinancialPlanModule } from "./modules/financial-plan/financial-plan.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: getRootEnvPath() }),
    PrismaModule,
    AnalyticsPrismaModule,
    RateLimitModule,
    CurrencyModule,
    CurrenciesModule,
    FinancialPlanModule,
    EncryptionModule,
    AuditModule,
    RedisModule,
    GroqModule,
    AuthModule,
    UsersModule,
    OnboardingModule,
    CyclesModule,
    TransactionsModule,
    GoalsModule,
    DashboardModule,
    SimulationsModule,
    AiModule,
    ReviewsModule,
    ExportModule,
    AccountModule,
    AnalyticsModule,
    SupportModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
