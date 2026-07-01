import { Global, Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../../modules/auth/auth.module";
import { AuditLogsController } from "./audit-logs.controller";
import { AuditService } from "./audit.service";

@Global()
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AuditLogsController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
