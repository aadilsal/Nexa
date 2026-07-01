import { Injectable, Logger } from "@nestjs/common";
import {
  calculateMonthlyReview,
  calculateWeeklyReview,
  getCalendarWeekBounds,
  type MonthlyReviewOutput,
  type WeeklyReviewOutput,
} from "@nexa/finance-engine";
import { sendNexaEmail } from "@nexa/emails";
import { Resend } from "resend";
import { GroqService } from "../../common/groq/groq.service";
import { PrismaService } from "../../common/prisma/prisma.module";
import { EngineDataService } from "../engine/engine-data.service";

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);
  private readonly resend: Resend | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly engineData: EngineDataService,
    private readonly groq: GroqService,
  ) {
    this.resend = process.env.RESEND_API_KEY
      ? new Resend(process.env.RESEND_API_KEY)
      : null;
  }

  async getWeeklyReview(
    userId: string,
    referenceDate = new Date(),
  ): Promise<{ review: WeeklyReviewOutput; narrative: string }> {
    const review = await this.buildWeeklyReview(userId, referenceDate);
    const narrative = await this.groq.explain(
      review,
      "Write a concise weekly financial review summary for the user.",
      500,
    );
    return { review, narrative };
  }

  async getMonthlyReview(
    userId: string,
  ): Promise<{ review: MonthlyReviewOutput; narrative: string }> {
    const review = await this.buildMonthlyReview(userId);
    const narrative = await this.groq.explain(
      review,
      "Write a concise monthly financial review summary for the user.",
      600,
    );
    return { review, narrative };
  }

  async sendWeeklyReviewEmails(): Promise<{ sent: number; skipped: number }> {
    const users = await this.prisma.user.findMany({
      where: { onboardingComplete: true },
      include: {
        settings: true,
      },
    });

    let sent = 0;
    let skipped = 0;

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    for (const user of users) {
      if (user.settings?.weeklyReviewEmail === false) {
        skipped++;
        continue;
      }

      try {
        const { review, narrative } = await this.getWeeklyReview(
          user.id,
          lastWeek,
        );
        await this.sendEmail(user.email, user.name, review, narrative);
        sent++;
      } catch (err) {
        this.logger.warn(`Weekly email failed for ${user.id}: ${err}`);
        skipped++;
      }
    }

    return { sent, skipped };
  }

  private async buildWeeklyReview(userId: string, referenceDate: Date) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { settings: true },
    });

    const timezone = user.settings?.timezone ?? "Asia/Karachi";
    const { weekStart, weekEnd } = getCalendarWeekBounds(
      referenceDate,
      timezone,
    );

    const priorWeekRef = new Date(weekStart);
    priorWeekRef.setDate(priorWeekRef.getDate() - 7);
    const { weekStart: priorStart, weekEnd: priorEnd } = getCalendarWeekBounds(
      priorWeekRef,
      timezone,
    );

    const engineInput = await this.engineData.buildEngineInput(userId);
    const output = await this.engineData.calculateForUser(userId);

    const allTransactions = [
      ...engineInput.transactions,
      ...engineInput.historicalCycles.flatMap((c) => c.transactions),
    ];

    const weekTransactions = allTransactions.filter(
      (t) => t.createdAt >= weekStart && t.createdAt <= weekEnd,
    );
    const priorWeekTransactions = allTransactions.filter(
      (t) => t.createdAt >= priorStart && t.createdAt <= priorEnd,
    );

    const cycleTxAtWeekStart = engineInput.transactions.filter(
      (t) => t.createdAt < weekStart,
    );
    const outputAtWeekStart = await this.engineData.calculateAtDate(
      userId,
      weekStart,
      cycleTxAtWeekStart,
    );

    return calculateWeeklyReview({
      timezone,
      weekStart,
      weekEnd,
      transactions: weekTransactions,
      priorWeekTransactions,
      goals: engineInput.goals,
      goalsAtWeekStart: engineInput.goals.map((g) => ({
        ...g,
        storedCurrentAmount: Math.max(
          0,
          g.storedCurrentAmount -
            Math.round(
              (output.savings.projectedSavings > 0
                ? output.savings.projectedSavings
                : 0) / 30,
            ),
        ),
      })),
      expectedIncome: engineInput.expectedIncome,
      predictedMonthlyExpenses: output.expenses.predictedMonthly,
      savingsRateTarget: output.savings.targetRate,
      safeToSpendAtWeekStart: outputAtWeekStart.safeToSpend.today,
      safeToSpendAtWeekEnd: output.safeToSpend.today,
      healthScoreAtWeekStart: outputAtWeekStart.healthScore.overall,
      healthScoreAtWeekEnd: output.healthScore.overall,
    });
  }

  private async buildMonthlyReview(userId: string) {
    const engineInput = await this.engineData.buildEngineInput(userId);
    const output = await this.engineData.calculateForUser(userId);
    const emergencyGoal = output.goals.find((g) => g.isEmergencyFund);

    return calculateMonthlyReview({
      cycleStart: engineInput.cycle.startDate,
      cycleEnd: engineInput.cycle.endDate,
      today: new Date(),
      transactions: engineInput.transactions,
      goals: output.goals,
      predictedMonthlyExpenses: output.expenses.predictedMonthly,
      recurringTotal: output.expenses.recurring,
      emergencyFundProgress: emergencyGoal ? emergencyGoal.progress / 100 : 0,
      healthScore: output.healthScore.overall,
      savingsRate: output.savings.actualRate,
      savingsRateTarget: output.savings.targetRate,
      netCashFlow:
        output.cash.currentCashAvailable - engineInput.cycle.startingBalance,
    });
  }

  private async sendEmail(
    email: string,
    name: string | null,
    review: WeeklyReviewOutput,
    narrative: string,
  ) {
    if (!this.resend) {
      this.logger.log(`Resend not configured — skip email to ${email}`);
      return;
    }

    const from = process.env.RESEND_FROM ?? "Nexa <onboarding@resend.dev>";
    const appUrl = process.env.CORS_ORIGIN ?? "http://localhost:3000";
    const weekStart = new Date(review.weekStart).toLocaleDateString("en-PK", {
      month: "short",
      day: "numeric",
    });
    const weekEnd = new Date(review.weekEnd).toLocaleDateString("en-PK", {
      month: "short",
      day: "numeric",
    });

    const rendered = await sendNexaEmail("reports.weekly", {
      firstName: name,
      weekLabel: `${weekStart} – ${weekEnd}`,
      income: review.income,
      spent: review.spent,
      saved: review.saved,
      healthScore: review.healthScoreChange.end ?? 0,
      safeToSpend: review.safeToSpendTrend.end ?? 0,
      overallRating: review.overallRating,
      narrative,
      goals: review.goalProgress.map((g) => ({
        goalName: g.goalName,
        progress: g.progressEnd,
        targetAmount: 0,
        currentAmount: 0,
        onTrack: g.onTrack,
      })),
      reportUrl: `${appUrl}/weekly-review`,
      appUrl,
    });

    await this.resend.emails.send({
      from,
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  }
}
