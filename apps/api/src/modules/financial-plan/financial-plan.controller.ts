import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { UpdateVariableEstimateSchema } from "@nexa/shared";
import { SessionGuard } from "../auth/session.guard";
import { FinancialPlanService } from "./financial-plan.service";

@ApiTags("financial-plan")
@Controller("financial-plan")
@UseGuards(SessionGuard)
@ApiCookieAuth("better-auth.session_token")
export class FinancialPlanController {
  constructor(private readonly financialPlanService: FinancialPlanService) {}

  @Patch("variable-estimate")
  updateVariableEstimate(@Req() req: { userId: string }, @Body() body: unknown) {
    const { variableEstimate } = UpdateVariableEstimateSchema.parse(body);
    return this.financialPlanService.updateVariableEstimate(
      req.userId,
      variableEstimate,
    );
  }

  @Post("fixed-expenses")
  createFixedExpense(@Req() req: { userId: string }, @Body() body: unknown) {
    return this.financialPlanService.createFixedExpense(req.userId, body);
  }

  @Patch("fixed-expenses/:id")
  updateFixedExpense(
    @Req() req: { userId: string },
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.financialPlanService.updateFixedExpense(req.userId, id, body);
  }

  @Delete("fixed-expenses/:id")
  deleteFixedExpense(@Req() req: { userId: string }, @Param("id") id: string) {
    return this.financialPlanService.deleteFixedExpense(req.userId, id);
  }

  @Post("income-expectations")
  createIncome(@Req() req: { userId: string }, @Body() body: unknown) {
    return this.financialPlanService.createIncomeExpectation(req.userId, body);
  }

  @Patch("income-expectations/:id")
  updateIncome(
    @Req() req: { userId: string },
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.financialPlanService.updateIncomeExpectation(
      req.userId,
      id,
      body,
    );
  }

  @Delete("income-expectations/:id")
  deleteIncome(@Req() req: { userId: string }, @Param("id") id: string) {
    return this.financialPlanService.deleteIncomeExpectation(req.userId, id);
  }
}
