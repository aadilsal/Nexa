import { Injectable } from "@nestjs/common";
import { buildDashboardSummary } from "@nexa/finance-engine";
import { CyclesService } from "../cycles/cycles.service";
import { GoalsService } from "../goals/goals.service";
import { LedgerService } from "../transactions/ledger.service";

@Injectable()
export class DashboardService {
  constructor(
    private readonly cycles: CyclesService,
    private readonly ledger: LedgerService,
    private readonly goals: GoalsService,
  ) {}

  async getDashboard(userId: string) {
    const cycle = await this.cycles.getOrCreateActiveCycle(userId);
    const startingBalance = await this.cycles.getStartingBalance(
      userId,
      cycle.id,
    );

    const transactions = await this.ledger.getEffectiveTransactions(
      userId,
      cycle.id,
    );

    const goals = await this.goals.list(userId);

    const summary = buildDashboardSummary({
      cycle: {
        id: cycle.id,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        status: cycle.status,
        startingBalance,
      },
      transactions: transactions.map((tx) => ({
        amount: tx.amount,
        type: tx.type,
      })),
      goals: goals.map((g) => ({
        id: g.id,
        name: g.name,
        priority: g.priority,
        targetAmount: g.targetAmount,
        targetDate: new Date(g.targetDate),
        isEmergencyFund: g.isEmergencyFund,
      })),
    });

    return {
      ...summary,
      safeToSpend: {
        today: null,
        message: "Safe To Spend available in Phase 2",
      },
      healthScore: {
        overall: null,
        message: "Financial Health Score available in Phase 2",
      },
    };
  }
}
