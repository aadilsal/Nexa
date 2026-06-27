import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { AdjustRolloverSchema } from "@nexa/shared";
import { AuditService } from "../../common/audit/audit.service";
import { SessionGuard } from "../auth/session.guard";
import { CyclesService } from "./cycles.service";

@ApiTags("cycles")
@Controller("cycles")
@UseGuards(SessionGuard)
@ApiCookieAuth("better-auth.session_token")
export class CyclesController {
  constructor(
    private readonly cyclesService: CyclesService,
    private readonly audit: AuditService,
  ) {}

  @Get("current")
  async getCurrent(@Req() req: { userId: string }) {
    const cycle = await this.cyclesService.getOrCreateActiveCycle(req.userId);
    const startingBalance = await this.cyclesService.getStartingBalance(
      req.userId,
      cycle.id,
    );

    return {
      id: cycle.id,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      status: cycle.status,
      startingBalance,
    };
  }

  @Post("confirm-rollover")
  async confirmRollover(@Req() req: { userId: string }) {
    const cycle = await this.cyclesService.confirmRollover(req.userId);
    await this.audit.log(req.userId, "CYCLE_ROLLOVER_CONFIRM");
    return { id: cycle.id, status: cycle.status };
  }

  @Post("adjust-rollover")
  async adjustRollover(
    @Req() req: { userId: string },
    @Body() body: unknown,
  ) {
    const input = AdjustRolloverSchema.parse(body);
    const cycle = await this.cyclesService.adjustRollover(
      req.userId,
      input.startingBalance,
    );
    await this.audit.log(req.userId, "CYCLE_ROLLOVER_ADJUST", {
      startingBalance: input.startingBalance,
    });
    return { id: cycle.id, status: cycle.status };
  }

  @Get("history")
  async history(@Req() req: { userId: string }) {
    return this.cyclesService.listHistory(req.userId);
  }
}
