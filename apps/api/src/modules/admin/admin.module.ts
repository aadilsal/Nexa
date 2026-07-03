import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { SupportModule } from "../support/support.module";
import { AdminController } from "./admin.controller";
import { AdminMfaController } from "./admin-mfa.controller";
import { AdminSeedService } from "./admin-seed.service";
import { AdminMfaService } from "./admin-mfa.service";
import {
  AdminAggregationService,
  AdminAuditService,
  AdminHealthService,
  AdminMetricsService,
  AdminSupportService,
  AdminUsersService,
} from "./admin.services";
import { AdminGuard, RolesGuard } from "./guards/admin.guard";
import { MfaGuard } from "./guards/mfa.guard";

@Module({
  imports: [AuthModule, SupportModule],
  controllers: [AdminController, AdminMfaController],
  providers: [
    AdminGuard,
    RolesGuard,
    MfaGuard,
    AdminMfaService,
    AdminAuditService,
    AdminMetricsService,
    AdminUsersService,
    AdminSupportService,
    AdminAggregationService,
    AdminHealthService,
    AdminSeedService,
  ],
  exports: [AdminAuditService],
})
export class AdminModule {}
