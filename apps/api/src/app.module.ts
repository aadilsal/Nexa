import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./common/prisma/prisma.module";
import { EncryptionModule } from "./common/encryption/encryption.module";
import { AuditModule } from "./common/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { OnboardingModule } from "./modules/onboarding/onboarding.module";
import { CyclesModule } from "./modules/cycles/cycles.module";
import { TransactionsModule } from "./modules/transactions/transactions.module";
import { GoalsModule } from "./modules/goals/goals.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EncryptionModule,
    AuditModule,
    AuthModule,
    UsersModule,
    OnboardingModule,
    CyclesModule,
    TransactionsModule,
    GoalsModule,
    DashboardModule,
  ],
})
export class AppModule {}
