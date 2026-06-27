import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.module";
import { EncryptionService } from "./encryption.service";

@Injectable()
export class UserEncryptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  async getOrCreateDek(userId: string): Promise<Buffer> {
    const existing = await this.prisma.encryptionKey.findUnique({
      where: { userId },
    });

    if (existing) {
      return this.encryption.unwrapDek(existing.encryptedDek);
    }

    const dek = this.encryption.generateDek();
    const encryptedDek = this.encryption.wrapDek(dek);

    await this.prisma.encryptionKey.create({
      data: { userId, encryptedDek },
    });

    return dek;
  }

  async encryptForUser(userId: string, plaintext: string): Promise<string> {
    const dek = await this.getOrCreateDek(userId);
    return this.encryption.encrypt(plaintext, dek);
  }

  async decryptForUser(userId: string, ciphertext: string): Promise<string> {
    const dek = await this.getOrCreateDek(userId);
    return this.encryption.decrypt(ciphertext, dek);
  }

  async encryptNumberForUser(userId: string, value: number): Promise<string> {
    const dek = await this.getOrCreateDek(userId);
    return this.encryption.encryptNumber(value, dek);
  }

  async decryptNumberForUser(
    userId: string,
    ciphertext: string,
  ): Promise<number> {
    const dek = await this.getOrCreateDek(userId);
    return this.encryption.decryptNumber(ciphertext, dek);
  }

  async encryptJsonForUser<T>(userId: string, value: T): Promise<string> {
    const dek = await this.getOrCreateDek(userId);
    return this.encryption.encryptJson(value, dek);
  }

  async decryptJsonForUser<T>(
    userId: string,
    ciphertext: string,
  ): Promise<T> {
    const dek = await this.getOrCreateDek(userId);
    return this.encryption.decryptJson<T>(ciphertext, dek);
  }
}
