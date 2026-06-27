import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { GoalInputSchema, UpdateGoalSchema } from "@nexa/shared";
import { SessionGuard } from "../auth/session.guard";
import { GoalsService } from "./goals.service";

@ApiTags("goals")
@Controller("goals")
@UseGuards(SessionGuard)
@ApiCookieAuth("better-auth.session_token")
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  list(@Req() req: { userId: string }) {
    return this.goalsService.list(req.userId);
  }

  @Post()
  create(@Req() req: { userId: string }, @Body() body: unknown) {
    const input = GoalInputSchema.parse(body);
    return this.goalsService.create(req.userId, input);
  }

  @Patch(":id")
  update(
    @Req() req: { userId: string },
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const input = UpdateGoalSchema.parse(body);
    return this.goalsService.update(req.userId, id, input);
  }

  @Delete(":id")
  delete(@Req() req: { userId: string }, @Param("id") id: string) {
    return this.goalsService.delete(req.userId, id);
  }
}
