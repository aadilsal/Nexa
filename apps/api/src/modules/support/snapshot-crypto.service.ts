import { Injectable } from "@nestjs/common";
import { scryptSync } from "crypto";
import { EncryptionService } from "../../common/encryption/encryption.service";

@Injectable()
export class SnapshotCryptoService {
  constructor(private readonly encryption: EncryptionService) {}

  private getSnapshotDek(): Buffer {
    const kek = process.env.KEK;
    if (!kek || kek.length < 64) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("KEK must be set for snapshot encryption");
      }
      return scryptSync("nexa-dev-snapshot-key", "nexa-snapshot-salt", 32);
    }
    return scryptSync(kek, "nexa-support-snapshot-v1", 32);
  }

  encryptPayload(payload: unknown): string {
    return this.encryption.encryptJson(payload, this.getSnapshotDek());
  }

  decryptPayload<T>(ciphertext: string): T {
    return this.encryption.decryptJson<T>(ciphertext, this.getSnapshotDek());
  }
}
