import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ChatMessageSchema } from "@nexa/shared";
import { GroqService } from "../../common/groq/groq.service";
import { RedisService } from "../../common/redis/redis.service";
import { EngineDataService } from "../engine/engine-data.service";

@Injectable()
export class AiService {
  constructor(
    private readonly engineData: EngineDataService,
    private readonly groq: GroqService,
    private readonly redis: RedisService,
  ) {}

  async chat(userId: string, body: unknown) {
    const input = ChatMessageSchema.parse(body);
    const { allowed } = await this.redis.checkRateLimit(
      `ratelimit:ai:${userId}`,
      30,
      60,
    );
    if (!allowed) {
      throw new HttpException("AI rate limit exceeded", HttpStatus.TOO_MANY_REQUESTS);
    }

    const engineOutput = await this.engineData.calculateForUser(userId);
    const reply = await this.groq.chat(
      engineOutput,
      input.message,
      input.history ?? [],
    );

    return { reply };
  }
}
