/** Plain-language explanations for features and displayed metrics. */
export const FEATURE_HELP = {
  primaryCurrency:
    "The currency Nexa uses for totals, Safe To Spend, and your dashboard. You can log income and expenses in other currencies — they convert automatically using live rates.",
  payday:
    "The day you usually receive income. Nexa uses this to start each financial cycle and calculate daily spending allowances.",
  cycleStart:
    "The day your month begins. Useful if you don't have a fixed payday — your cycle resets on this date each month.",
  incomeSource:
    "Recurring money you expect each cycle — salary, freelance retainers, rental income, etc.",
  fixedExpense:
    "Bills that stay roughly the same each month — rent, subscriptions, loan payments.",
  variableSpending:
    "Average monthly spend on things that change — groceries, dining, shopping, entertainment.",
  startingBalance:
    "Cash you have right now. This becomes your opening balance for the current cycle.",
  emergencyFund:
    "A savings cushion for unexpected costs. Nexa auto-creates one at 3× your monthly expenses — you can edit the target anytime.",
  predictedMonthly:
    "Your fixed bills plus average variable spending, converted to your primary currency.",
  safeToSpend:
    "How much you can spend today without falling behind on bills, goals, or your emergency fund. Calculated fresh each day.",
  healthScore:
    "A 0–100 snapshot of your finances — savings rate, goal progress, emergency fund, and spending consistency.",
  currentCash:
    "Money available right now in this cycle: starting balance + income logged − expenses logged.",
  incomeCycle:
    "Total income recorded since your current financial cycle started.",
  spentCycle:
    "Total expenses logged since your current financial cycle started.",
  projectedSavings:
    "Estimated amount you'll save this cycle if spending continues at the current pace.",
  savingsRate:
    "Percentage of income saved this cycle. 'Target' is what Nexa recommends based on your goals.",
  goalProgress:
    "How close you are to your target. Progress updates automatically from cycle savings — you don't enter it manually.",
  goalEta:
    "When Nexa projects you'll reach this goal at your current savings pace.",
  requiredMonthlySavings:
    "How much you need to set aside each month to hit your target date on time.",
  onTrack:
    "Whether your current pace will reach the goal by its target date.",
  canIBuy:
    "Simulates a purchase against your real numbers — shows if it's safe now or how long to wait.",
  savingsRateImpact:
    "How this purchase would change the percentage of income you save this cycle.",
  goalDelay:
    "How many extra days this purchase could push back a goal, based on your current pace.",
  weeklyReview:
    "A summary of last calendar week (Mon–Sun) — income, spending, savings, and goal movement.",
  aiInsight:
    "A short, plain-language read on your finances — grounded in your real numbers, not generic tips.",
  aiCoach:
    "Ask questions about your money. Answers use your actual data and cannot move funds or change settings.",
  timezone:
    "When your day resets for Safe To Spend and when weekly reviews are timed. Change anytime in Profile.",
  transactionLog:
    "Quick expense or income entry. Nexa uses this to keep Safe To Spend and projections accurate.",
} as const;

export type FeatureHelpKey = keyof typeof FEATURE_HELP;
