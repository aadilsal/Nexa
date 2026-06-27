import { Global, Module } from "@nestjs/common";
import { EncryptionService } from "./encryption.service";
import { UserEncryptionService } from "./user-encryption.service";

@Global()
@Module({
  providers: [EncryptionService, UserEncryptionService],
  exports: [EncryptionService, UserEncryptionService],
})
export class EncryptionModule {}
