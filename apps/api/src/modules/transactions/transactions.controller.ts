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
import {
  CreateTransactionSchema,
  ParseTransactionSchema,
  RecategorizeTransactionSchema,
  CorrectTransactionSchema,
} from "@nexa/shared";
import { SessionGuard } from "../auth/session.guard";
import { TransactionsService } from "./transactions.service";

@ApiTags("transactions")
@Controller("transactions")
@UseGuards(SessionGuard)
@ApiCookieAuth("better-auth.session_token")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post("parse")
  parse(@Body() body: unknown) {
    const input = ParseTransactionSchema.parse(body);
    return this.transactionsService.parse(input.rawInput);
  }

  @Post()
  create(@Req() req: { userId: string }, @Body() body: unknown) {
    const input = CreateTransactionSchema.parse(body);
    return this.transactionsService.create(req.userId, input);
  }

  @Get()
  list(@Req() req: { userId: string }) {
    return this.transactionsService.list(req.userId);
  }

  @Post(":id/correct")
  correct(
    @Req() req: { userId: string },
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const updates = CorrectTransactionSchema.parse(body);
    return this.transactionsService.correct(req.userId, id, updates);
  }

  @Post(":id/delete")
  deleteTransaction(@Req() req: { userId: string }, @Param("id") id: string) {
    return this.transactionsService.delete(req.userId, id);
  }

  @Patch(":id/category")
  recategorize(
    @Req() req: { userId: string },
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const input = RecategorizeTransactionSchema.parse(body);
    return this.transactionsService.recategorize(
      req.userId,
      id,
      input.category,
    );
  }
}
