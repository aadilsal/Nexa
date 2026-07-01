import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly enabled: boolean;

  constructor() {
    const url = process.env.REDIS_URL;
    this.enabled = Boolean(url);

    if (this.enabled && url) {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
      this.client.connect().catch((err) => {
        this.logger.warn(`Redis unavailable: ${err.message}`);
        this.client = null;
      });
    }
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  isAvailable(): boolean {
    return this.client?.status === "ready";
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.set(key, value, "EX", ttlSeconds);
    } catch {
      // cache miss is acceptable
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch {
      // ignore
    }
  }

  async delPattern(prefix: string): Promise<void> {
    if (!this.client) return;
    try {
      const keys = await this.client.keys(`${prefix}*`);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch {
      // ignore
    }
  }

  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{ allowed: boolean; remaining: number }> {
    if (!this.client) {
      return { allowed: true, remaining: limit };
    }

    try {
      const count = await this.client.incr(key);
      if (count === 1) {
        await this.client.expire(key, windowSeconds);
      }
      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
      };
    } catch {
      return { allowed: true, remaining: limit };
    }
  }
}
