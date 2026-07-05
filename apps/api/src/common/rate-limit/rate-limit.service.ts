import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class RateLimitService {
  constructor(private readonly redis: RedisService) {}

  async assertAllowed(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<void> {
    const { allowed } = await this.redis.checkRateLimit(
      key,
      limit,
      windowSeconds,
    );
    if (!allowed) {
      throw new HttpException(
        "Too many requests — please try again shortly",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async assertUserLimit(
    userId: string,
    action: string,
    limit: number,
    windowSeconds: number,
  ): Promise<void> {
    await this.assertAllowed(`ratelimit:user:${userId}:${action}`, limit, windowSeconds);
  }

  async assertIpLimit(
    ip: string,
    action: string,
    limit: number,
    windowSeconds: number,
  ): Promise<void> {
    await this.assertAllowed(`ratelimit:ip:${ip}:${action}`, limit, windowSeconds);
  }
}
