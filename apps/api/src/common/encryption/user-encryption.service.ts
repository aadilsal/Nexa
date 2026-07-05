import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.module";
import { EncryptionService } from "./encryption.service";

const DEK_CACHE_TTL_MS = 120_000;

@Injectable()
export class UserEncryptionService {
  private readonly dekCache = new Map<
    string,
    { dek: Buffer; expiresAt: number }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  async getOrCreateDek(userId: string): Promise<Buffer> {
    const cached = this.dekCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.dek;
    }

    const existing = await this.prisma.encryptionKey.findUnique({
      where: { userId },
    });

    let dek: Buffer;
    if (existing) {
      dek = this.encryption.unwrapDek(existing.encryptedDek);
    } else {
      dek = this.encryption.generateDek();
      const encryptedDek = this.encryption.wrapDek(dek);
      await this.prisma.encryptionKey.create({
        data: { userId, encryptedDek },
      });
    }

    this.dekCache.set(userId, {
      dek,
      expiresAt: Date.now() + DEK_CACHE_TTL_MS,
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

  async decryptNumbersForUser(
    userId: string,
    ciphertexts: string[],
  ): Promise<number[]> {
    if (ciphertexts.length === 0) return [];
    const dek = await this.getOrCreateDek(userId);
    return ciphertexts.map((ciphertext) =>
      this.encryption.decryptNumber(ciphertext, dek),
    );
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
