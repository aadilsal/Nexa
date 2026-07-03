import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { EngineModule } from "../engine/engine.module";
import { SupportController } from "./support.controller";
import { SupportService } from "./support.service";
import { SnapshotBuilderService } from "./snapshot-builder.service";
import { SnapshotCryptoService } from "./snapshot-crypto.service";

@Module({
  imports: [AuthModule, EngineModule],
  controllers: [SupportController],
  providers: [SupportService, SnapshotBuilderService, SnapshotCryptoService],
  exports: [SupportService, SnapshotCryptoService],
})
export class SupportModule {}
