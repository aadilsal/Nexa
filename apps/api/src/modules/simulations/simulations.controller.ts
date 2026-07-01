import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { PurchaseSimulationSchema } from "@nexa/shared";
import { SessionGuard } from "../auth/session.guard";
import { SimulationsService } from "./simulations.service";

@ApiTags("simulations")
@Controller("simulations")
@UseGuards(SessionGuard)
@ApiCookieAuth("better-auth.session_token")
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Post("purchase")
  purchase(@Req() req: { userId: string }, @Body() body: unknown) {
    const input = PurchaseSimulationSchema.parse(body);
    return this.simulationsService.simulate(req.userId, input);
  }
}
