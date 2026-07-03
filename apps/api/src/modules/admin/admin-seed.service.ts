import {
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.module";

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const email = process.env.ADMIN_SEED_EMAIL;
    if (!email) return;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.warn(`ADMIN_SEED_EMAIL=${email} not found — skipping admin seed`);
      return;
    }

    if (user.role === "SUPER_ADMIN") return;

    await this.prisma.user.update({
      where: { id: user.id },
      data: { role: "SUPER_ADMIN" },
    });
    this.logger.log(`Seeded SUPER_ADMIN role for ${email}`);
  }
}
