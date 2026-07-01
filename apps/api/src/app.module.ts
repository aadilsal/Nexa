import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
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
  ],
})
export class AppModule {}
