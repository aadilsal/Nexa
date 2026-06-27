import { Injectable } from "@nestjs/common";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

@Injectable()
export class EncryptionService {
  private getKek(): Buffer {
    const kek = process.env.KEK;
    if (!kek || kek.length < 64) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("KEK must be set in production");
      }
      return scryptSync("nexa-dev-kek-not-for-production", "nexa-salt", 32);
    }
    return Buffer.from(kek, "hex");
  }

  generateDek(): Buffer {
    return randomBytes(32);
  }

  wrapDek(dek: Buffer): string {
    const kek = this.getKek();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, kek, iv);
    const encrypted = Buffer.concat([cipher.update(dek), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString("base64");
  }

  unwrapDek(wrappedDek: string): Buffer {
    const kek = this.getKek();
    const data = Buffer.from(wrappedDek, "base64");
    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, kek, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  encrypt(plaintext: string, dek: Buffer): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, dek, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString("base64");
  }

  decrypt(ciphertext: string, dek: Buffer): string {
    const data = Buffer.from(ciphertext, "base64");
    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, dek, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
  }

  encryptNumber(value: number, dek: Buffer): string {
    return this.encrypt(value.toString(), dek);
  }

  decryptNumber(ciphertext: string, dek: Buffer): number {
    return parseInt(this.decrypt(ciphertext, dek), 10);
  }

  encryptJson<T>(value: T, dek: Buffer): string {
    return this.encrypt(JSON.stringify(value), dek);
  }

  decryptJson<T>(ciphertext: string, dek: Buffer): T {
    return JSON.parse(this.decrypt(ciphertext, dek)) as T;
  }
}
