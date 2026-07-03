import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { authenticator } from "otplib";
import { PrismaService } from "../../common/prisma/prisma.module";
import { EncryptionService } from "../../common/encryption/encryption.service";
import { RedisService } from "../../common/redis/redis.service";
import { AdminAuditService } from "./admin.services";

const MFA_SESSION_TTL = 8 * 60 * 60; // 8 hours
const ADMIN_ROLES = new Set(["SUPPORT", "OPERATIONS", "ADMIN", "SUPER_ADMIN"]);

@Injectable()
export class AdminMfaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly redis: RedisService,
    private readonly audit: AdminAuditService,
  ) {}

  isMfaRequired(role: string): boolean {
    if (!ADMIN_ROLES.has(role)) return false;
    if (process.env.ADMIN_MFA_REQUIRED === "true") return true;
    return role === "ADMIN" || role === "SUPER_ADMIN";
  }

  async getStatus(userId: string, role: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { adminMfaEnabled: true },
    });
    const verified = await this.isSessionVerified(userId);
    return {
      required: this.isMfaRequired(role),
      enabled: user.adminMfaEnabled,
      verified,
    };
  }

  async setup(userId: string, email: string) {
    const secret = authenticator.generateSecret();
    const pendingKey = `admin:mfa:pending:${userId}`;
    await this.redis.set(pendingKey, secret, 600);

    const otpauthUrl = authenticator.keyuri(email, "Nexa Admin", secret);

    await this.audit.log(userId, email, "MFA_SETUP");

    return { otpauthUrl, secret };
  }

  async enable(userId: string, email: string, code: string) {
    const pendingKey = `admin:mfa:pending:${userId}`;
    const secret = await this.redis.get(pendingKey);
    if (!secret) {
      throw new BadRequestException("MFA setup expired — start again");
    }

    if (!authenticator.verify({ token: code, secret })) {
      throw new BadRequestException("Invalid verification code");
    }

    const dek = this.encryption.generateDek();
    const encryptedSecret = this.encryption.encrypt(secret, dek);
    // Store wrapped: base64(dek) + ":" + encryptedSecret for simplicity use encryptJson
    const stored = this.encryption.encryptJson({ secret }, dek);
    const wrappedDek = this.encryption.wrapDek(dek);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        adminMfaEnabled: true,
        adminMfaSecret: `${wrappedDek}|${stored}`,
      },
    });

    await this.redis.del(pendingKey);
    await this.markSessionVerified(userId);

    return { enabled: true };
  }

  async verify(userId: string, email: string, code: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { adminMfaEnabled: true, adminMfaSecret: true },
    });

    if (!user.adminMfaEnabled || !user.adminMfaSecret) {
      throw new BadRequestException("MFA is not enabled for this account");
    }

    const secret = this.decryptMfaSecret(user.adminMfaSecret);
    if (!authenticator.verify({ token: code, secret })) {
      throw new ForbiddenException("Invalid MFA code");
    }

    await this.markSessionVerified(userId);
    await this.audit.log(userId, email, "MFA_VERIFY");

    return { verified: true };
  }

  async isSessionVerified(userId: string): Promise<boolean> {
    const val = await this.redis.get(`admin:mfa:verified:${userId}`);
    return val === "1";
  }

  private async markSessionVerified(userId: string) {
    await this.redis.set(`admin:mfa:verified:${userId}`, "1", MFA_SESSION_TTL);
  }

  private decryptMfaSecret(stored: string): string {
    const sep = stored.indexOf("|");
    if (sep === -1) {
      throw new BadRequestException("Invalid MFA configuration");
    }
    const wrappedDek = stored.slice(0, sep);
    const encrypted = stored.slice(sep + 1);
    const dek = this.encryption.unwrapDek(wrappedDek);
    const payload = this.encryption.decryptJson<{ secret: string }>(
      encrypted,
      dek,
    );
    return payload.secret;
  }
}
