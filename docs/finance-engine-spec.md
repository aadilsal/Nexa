# Nexa — Finance Engine Specification

**Version:** 1.0.0  
**Status:** Pre-Development  
**Last Updated:** June 2025

---

## 1. Overview

The Financial Intelligence Engine is Nexa's core competitive advantage. It performs **deterministic calculations** that power every financial number shown in the application.

### Principles

1. **Single Source of Truth** — Every financial number in the dashboard, weekly review, Can I Buy This, AI chat, notifications, and emails must come from this engine. No component calculates values independently.

2. **Deterministic** — Same inputs always produce same outputs. No randomness, no LLM involvement.

3. **Versioned** — Financial logic is treated like a public API. Changes release as v1.1, v2.0, etc., with regression tests.

4. **Testable** — Every formula has unit tests with known inputs and expected outputs.

### Architecture Position

```
User Action (log expense, view dashboard, simulate purchase)
        ↓
    NestJS API
        ↓
Financial Intelligence Engine v1.0  ← THIS DOCUMENT
        ↓
    Structured JSON Output
        ↓
    ┌─────────┬──────────┬──────────┐
    ↓         ↓          ↓          ↓
 Dashboard   Groq AI   Weekly     Email
             (explain   Review    Templates
              only)
```

---

## 2. Financial Cycle Model

### 2.1 Definition

A **Financial Cycle** is the fundamental time unit in Nexa. It represents one payday-to-payday period.

| Property | Rule |
|----------|------|
| Start | User's primary payday |
| End | Day before next payday |
| Duration | Typically ~30 days (varies by month) |
| Scope | All transactions, forecasts, STS, and reviews belong to exactly one cycle |

### 2.2 Cycle Configuration

**Salaried users:** Primary payday (e.g., 5th of every month)

**Freelancers without regular payday:** User-selected preferred cycle start date during onboarding

### 2.3 Cycle Rollover

At the end of every cycle:

```
Ending Cash (Cycle N) → Starting Balance (Cycle N+1)
```

**Ending Cash formula:**
```
Ending Cash = Starting Balance + Income Logged − Expenses Logged
```

On first login of a new cycle, present confirmation:
```
"New financial cycle started. Starting balance: PKR {amount}. Is this correct?"
[Confirm] [Adjust]
```

User adjustment creates a correction event in the ledger (not a silent edit).

### 2.4 Cycle State

| State | Description |
|-------|-------------|
| `ACTIVE` | Current cycle in progress |
| `COMPLETED` | Cycle ended, rollover processed |
| `PENDING_CONFIRMATION` | New cycle created, awaiting user balance confirmation |

---

## 3. Cash Position

### 3.1 Current Cash Available

Since Nexa does not integrate with banks, cash position is **derived from transactions**.

```
Current Cash Available =
    Starting Balance (optional, rolled over from previous cycle)
  + Income Logged (current cycle)
  − Expenses Logged (current cycle)
```

**Example:**
```
Starting Balance:     PKR  15,000
Salary:               PKR 120,000
Freelancing:          PKR  45,000
Expenses:            −PKR  58,000
                      ──────────
Current Cash Available: PKR 122,000
```

### 3.2 Rules

- Never ask users for live bank balance
- Starting balance is optional (defaults to 0 for first cycle)
- All amounts in PKR (integer, no decimals for MVP)
- Income and expenses are sums of ledger events in the current cycle (corrections included, deletes excluded)

---

## 4. Expense Prediction

### 4.1 Predicted Monthly Expenses

Used for emergency fund target suggestion, Can I Buy This rules, and forecasting.

```
Predicted Monthly Expenses = Recurring Expenses + Variable Spending
```

### 4.2 Recurring Expenses

Sum of all fixed expenses defined during onboarding:
```
Recurring = Σ(FixedExpense.expectedAmount)
```

Examples: rent, fuel budget, internet, mobile, gym, subscriptions, utilities, loan payments.

### 4.3 Variable Spending

**Cold start (0–1 completed cycles):**
```
Variable Spending = User Estimated Variable Spend (from onboarding)
```

**Warm start (2+ completed cycles):**
```
Variable Spending = Average Variable Spending over last 2–3 completed cycles
```

Where variable spending for a cycle is:
```
Cycle Variable Spending = Total Expenses − Recurring Expenses (actual)
```

Use the average of the last 2 cycles if 2 exist, last 3 if 3+ exist.

### 4.4 Example

```
Recurring Expenses:        PKR 40,000
Average Variable Spending: PKR 30,000
Predicted Monthly:         PKR 70,000
Emergency Fund Target:     PKR 210,000 (70,000 × 3)
```

---

## 5. Goal System

### 5.1 Goal Properties

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Goal name (e.g., "Emergency Fund") |
| `targetAmount` | integer (PKR) | Target amount |
| `targetDate` | date | Target completion date |
| `priority` | enum | `EMERGENCY_FUND`, `HIGH`, `MEDIUM`, `LOW` |
| `currentAmount` | integer (PKR) | Derived from savings allocation (not user-edited) |

### 5.2 Emergency Fund Goal

- Automatically created during onboarding
- Target suggested as: `Predicted Monthly Expenses × 3`
- User can edit target amount and date
- Priority is always `EMERGENCY_FUND` (highest)

### 5.3 Goal Allocation (Projected Only)

Goals do **not** lock money. The engine calculates projected allocation:

```
For each goal (in priority order):
    Months Remaining = months between today and targetDate
    Remaining Amount = targetAmount − currentAmount
    Required Monthly Savings = Remaining Amount ÷ Months Remaining
```

**Priority order:**
1. Emergency Fund
2. High Priority
3. Medium Priority
4. Low Priority

### 5.4 Goal Progress

```
Goal Progress (%) = (currentAmount ÷ targetAmount) × 100
```

`currentAmount` is calculated as cumulative savings allocated to the goal based on projected savings rate and priority waterfall. For MVP, track as:

```
currentAmount = min(targetAmount, totalSaved × goalShare)
```

Where `goalShare` is the proportion of required monthly savings this goal represents.

### 5.5 Goal ETA

```
If Required Monthly Savings > 0:
    Months To Complete = Remaining Amount ÷ Required Monthly Savings
    ETA = today + Months To Complete
Else:
    ETA = targetDate (already on track or complete)
```

If savings rate is insufficient, ETA extends beyond target date → reported as "delayed."

### 5.6 Aggregate Savings Rate

```
Required Monthly Savings = Σ(Required Monthly Savings for all active goals)
Savings Rate Target = Required Monthly Savings ÷ Expected Income
```

**Example:**
```
Emergency Fund:  PKR 20,000/month
Laptop:          PKR 10,000/month
Travel:          PKR  5,000/month
Total Required:  PKR 35,000/month
Income:          PKR 175,000/month
Target Rate:     20%
```

---

## 6. Safe To Spend™ (STS)

### 6.1 Definition

Safe To Spend is the maximum amount the user can spend **today** without reducing the probability of reaching their goals or compromising their emergency fund.

STS is **dynamic disposable spending**, not a simple daily allowance.

### 6.2 Formula

**Step 1: Calculate Discretionary Pool**

```
Discretionary Pool =
    Current Cash Available
  − Remaining Fixed Expenses
  − Required Goal Contributions (remaining this cycle)
  − Emergency Fund Protection
```

Where:
- **Remaining Fixed Expenses** = prorated expected fixed expenses for days remaining in cycle
- **Required Goal Contributions** = sum of (Required Monthly Savings × daysRemaining / totalCycleDays) for all active goals
- **Emergency Fund Protection** = if emergency fund is below target, reserve minimum contribution needed to stay on track

**Step 2: Calculate Baseline Daily STS**

```
Days Remaining = cycle end date − today (inclusive of today)
Baseline STS = Discretionary Pool ÷ Days Remaining
```

If `Days Remaining = 0`, Baseline STS = Discretionary Pool (last day of cycle).

If `Discretionary Pool ≤ 0`, Baseline STS = 0.

**Step 3: Apply Trend Adjustment**

```
Trend Multiplier = calculateSpendingTrend(userId, dayOfWeek)
Adjusted STS = Baseline STS × Trend Multiplier
```

Trend adjustment rules:
- Maximum deviation: **±15%** from baseline
- Based on day-of-week spending patterns from historical data
- If insufficient history (< 2 cycles), no adjustment (multiplier = 1.0)

**Step 4: Floor at Zero**

```
Safe To Spend Today = max(0, round(Adjusted STS))
```

### 6.3 Trend Adjustment Detail

```
For each day of week (Mon–Sun):
    avgSpend[day] = average spending on that day over last 2–3 cycles
    overallAvg = average daily spending over last 2–3 cycles

    rawMultiplier[day] = avgSpend[day] / overallAvg
    clampedMultiplier[day] = clamp(rawMultiplier[day], 0.85, 1.15)

Trend Multiplier for today = clampedMultiplier[today.dayOfWeek]
```

**Example:**
```
Baseline STS:     PKR 5,000
Today:            Saturday
Saturday multiplier: 1.10 (user spends 10% more on weekends)
Adjusted STS:     PKR 5,500

Today:            Monday
Monday multiplier: 0.94 (user spends 6% less on Mondays)
Adjusted STS:     PKR 4,700
```

### 6.4 Worked Example

```
Income (logged):              PKR 170,000
Expenses (logged):           −PKR  61,000
Starting Balance:             PKR       0
Current Cash Available:       PKR 109,000

Remaining Fixed Expenses:     PKR  15,000  (prorated)
Required Goal Contributions:  PKR  25,000  (prorated)
Emergency Fund Protection:    PKR  10,000  (minimum to stay on track)
Discretionary Pool:           PKR  59,000

Days Remaining:               10
Baseline STS:                 PKR   5,900
Trend Adjustment (Saturday):  × 1.08
Safe To Spend Today:          PKR   6,372 → PKR 6,370 (rounded)
```

---

## 7. Can I Buy This? — Purchase Simulation

### 7.1 Input

```typescript
{
  itemName: string;
  amount: number; // PKR
  purchaseDate: date; // default: today
}
```

### 7.2 Simulation Process

1. Clone current financial state
2. Apply hypothetical expense of `amount` on `purchaseDate`
3. Recalculate all engine outputs (STS, goals, health score, savings rate)
4. Compare against decision rules
5. Return recommendation + impact details

### 7.3 Decision Rules

Rules are evaluated in order. First matching WAIT rule wins.

| Rule | Condition | Result |
|------|-----------|--------|
| R1 | Emergency fund progress < 3 months of predicted expenses | **WAIT** |
| R2 | Any active goal delay > 30 days beyond target date | **WAIT** |
| R3 | Projected savings rate < savings rate target | **WAIT** |
| R4 | None of the above | **GO AHEAD** |

### 7.4 Rule Details

**R1 — Emergency Fund Check:**
```
monthsOfExpensesCovered = emergencyFund.currentAmount / predictedMonthlyExpenses
If monthsOfExpensesCovered < 3 (after simulated purchase): WAIT
```

**R2 — Goal Delay Check:**
```
For each active goal:
    projectedDelay = projectedETA − targetDate (in days)
    If projectedDelay > 30: WAIT
```

**R3 — Savings Rate Check:**
```
projectedSavingsRate = (income − expenses − purchaseAmount) / income
If projectedSavingsRate < savingsRateTarget: WAIT
```

### 7.5 Output

```typescript
{
  recommendation: "WAIT" | "GO_AHEAD";
  triggeredRule: "R1" | "R2" | "R3" | "R4" | null;
  impacts: {
    emergencyFundDelayDays: number;
    savingsRateBefore: number;
    savingsRateAfter: number;
    goalDelays: Array<{
      goalName: string;
      delayDays: number;
    }>;
  };
  suggestedWaitUntil: date | null; // earliest date purchase would be GO AHEAD
}
```

### 7.6 Worked Example

```
Purchase: iPhone, PKR 320,000

Before:
  Emergency Fund:  PKR 180,000 / PKR 300,000 (60%)
  Savings Rate:    22%
  Travel Goal ETA: March 2026 (on track)

After Simulation:
  Emergency Fund:  Delayed 47 days
  Savings Rate:    16% (below 20% target)
  Travel Goal:     Delayed 2 months

Triggered Rules: R1, R3
Recommendation: WAIT
Suggested Wait Until: November 2025
```

---

## 8. Financial Health Score

### 8.1 Version 1.0 Weights

| Factor | Weight | Sub-score Range |
|--------|--------|-----------------|
| Savings Rate | 30% | 0–100 |
| Emergency Fund | 25% | 0–100 |
| Goal Progress | 20% | 0–100 |
| Spending Consistency | 15% | 0–100 |
| Income Stability | 10% | 0–100 |

```
Health Score = (SavingsRate × 0.30)
             + (EmergencyFund × 0.25)
             + (GoalProgress × 0.20)
             + (SpendingConsistency × 0.15)
             + (IncomeStability × 0.10)
```

Result: integer 0–100.

### 8.2 Sub-Score Calculations

#### Savings Rate (30%)

```
actualSavingsRate = (income − expenses) / income
targetSavingsRate = aggregate savings rate target (Section 5.6)

ratio = actualSavingsRate / targetSavingsRate

≥ 1.0  → 100
0.8–0.99 → 80
0.6–0.79 → 60
0.4–0.59 → 40
< 0.4  → 20
```

#### Emergency Fund (25%)

```
progress = emergencyFund.currentAmount / emergencyFund.targetAmount

≥ 1.0  → 100
0.75–0.99 → 80
0.50–0.74 → 60
0.25–0.49 → 40
< 0.25 → 20
```

#### Goal Progress (20%)

```
averageProgress = average(goal.progress for all active goals)

Same scoring bands as Emergency Fund.
```

#### Spending Consistency (15%)

```
Compare daily spending variance over current cycle vs historical average.

coefficientOfVariation = stdDev(dailySpending) / mean(dailySpending)

CV ≤ 0.3  → 100  (very consistent)
CV ≤ 0.5  → 80
CV ≤ 0.7  → 60
CV ≤ 1.0  → 40
CV > 1.0  → 20  (highly variable)
```

If insufficient history (< 1 completed cycle), default to 70.

#### Income Stability (10%)

```
stabilityRatio = actualIncome / expectedIncome

≥ 1.0   → 100  (Excellent)
0.90–0.99 → 80  (Good)
0.75–0.89 → 60  (Moderate)
< 0.75  → 30  (Needs Attention)
```

Uses current cycle actual vs onboarding expected income.

---

## 9. Variance Analysis

### 9.1 Fixed Expense Variance

For each fixed expense category:

```
expected = FixedExpense.expectedAmount
actual = sum of transactions in that category (current cycle)
variance = expected − actual
variancePercent = (variance / expected) × 100
```

Positive variance = under budget. Negative = over budget.

### 9.2 Income Variance

```
expected = sum of IncomeExpectation.expectedAmount
actual = sum of income transactions (current cycle)
variance = actual − expected
variancePercent = (variance / expected) × 100
```

Positive variance = earned more than expected.

---

## 10. Transaction Parser

### 10.1 Input Format

Natural language: `{description} {amount}` or `{amount} {description}`

### 10.2 Parsing Rules

1. Extract numeric amount (last number or first number in string)
2. Remaining text is description
3. Match description against category dictionary (case-insensitive, fuzzy)
4. If amount is from known income keyword → type = `INCOME`, else `EXPENSE`
5. If no category match → category = `OTHER`

### 10.3 Category Dictionary

| Category | Keywords |
|----------|----------|
| FOOD | food, kfc, mcdonalds, pizza, lunch, dinner, breakfast, grocery, al fatah, metro, imtiaz |
| FUEL | petrol, fuel, diesel, cng, gas station, pso, shell, total parco |
| SHOPPING | shopping, clothes, shoes, mall, daraz, amazon |
| ENTERTAINMENT | netflix, spotify, movie, cinema, game, entertainment |
| UTILITIES | electricity, gas bill, water, k-electric, ssgc, utility |
| HEALTHCARE | doctor, hospital, pharmacy, medicine, medical |
| TRANSPORT | uber, careem, bus, rickshaw, train, flight, toll |
| HOUSING | rent, mortgage, maintenance |
| EDUCATION | tuition, books, course, school, university |
| CHARITY | charity, donation, masjid, mosque, sadqa, zakat |
| INVESTMENT | investment, stocks, mutual fund |
| INCOME | salary, freelance, bonus, payment, income |
| OTHER | (default) |

### 10.4 Output

```typescript
{
  description: string;
  amount: number;
  category: CategoryEnum;
  type: "INCOME" | "EXPENSE";
  confidence: number; // 0–1, how confident the parser is
}
```

---

## 11. Immutable Ledger

### 11.1 Event Types

| Event Type | Description |
|------------|-------------|
| `CREATE` | New transaction |
| `CORRECTION` | Amends a previous transaction (references `originalEventId`) |
| `DELETE` | Soft-deletes a transaction (references `originalEventId`) |

### 11.2 Hash Chaining

Each ledger event includes:

```typescript
{
  id: string;
  userId: string;
  cycleId: string;
  eventType: "CREATE" | "CORRECTION" | "DELETE";
  originalEventId: string | null;
  payload: EncryptedTransactionPayload;
  previousHash: string;
  eventHash: string; // SHA-256(previousHash + serialized payload)
  createdAt: timestamp;
}
```

### 11.3 Effective Transactions

To compute current transactions for a cycle:

```
1. Collect all CREATE events for cycle
2. Apply CORRECTION events (replace referenced transaction)
3. Exclude DELETE events (and their referenced transactions)
4. Result = effective transaction list
```

Never modify or delete ledger rows. All changes are new events.

---

## 12. Engine Output Schema

### 12.1 Full Engine State (Dashboard)

```typescript
interface EngineOutput {
  version: "1.0.0";
  calculatedAt: string; // ISO 8601

  cycle: {
    id: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    status: "ACTIVE" | "PENDING_CONFIRMATION";
  };

  cash: {
    startingBalance: number;
    totalIncome: number;
    totalExpenses: number;
    currentCashAvailable: number;
  };

  safeToSpend: {
    today: number;
    baseline: number;
    trendMultiplier: number;
    discretionaryPool: number;
  };

  healthScore: {
    overall: number; // 0–100
    breakdown: {
      savingsRate: number;
      emergencyFund: number;
      goalProgress: number;
      spendingConsistency: number;
      incomeStability: number;
    };
  };

  savings: {
    actualRate: number;
    targetRate: number;
    projectedSavings: number;
  };

  goals: Array<{
    id: string;
    name: string;
    priority: string;
    targetAmount: number;
    currentAmount: number;
    progress: number; // 0–100
    eta: string; // ISO date
    requiredMonthlySavings: number;
    onTrack: boolean;
    delayDays: number;
  }>;

  expenses: {
    predictedMonthly: number;
    recurring: number;
    variable: number;
    variableSource: "ESTIMATED" | "HISTORICAL";
  };

  variance: {
    income: { expected: number; actual: number; variance: number };
    fixedExpenses: Array<{
      name: string;
      expected: number;
      actual: number;
      variance: number;
    }>;
  };

  charity: {
    thisCycle: number;
    thisYear: number;
  };
}
```

### 12.2 Post-Log Feedback

```typescript
interface PostLogOutput {
  version: "1.0.0";
  transaction: {
    description: string;
    amount: number;
    category: string;
    type: string;
  };
  safeToSpend: {
    before: number;
    after: number;
  };
  healthScore: {
    before: number;
    after: number;
  };
  goalImpact: Array<{
    goalName: string;
    etaBefore: string;
    etaAfter: string;
    stillOnTrack: boolean;
  }>;
  insight: string; // populated by Groq, not engine
}
```

### 12.3 Purchase Simulation Output

See Section 7.5.

---

## 13. AI Integration Contract

### 13.1 Rule

Groq receives engine output JSON. It **never** calculates or invents financial numbers.

### 13.2 Prompt Structure

```
System: You are Nexa's financial assistant. Explain the following
calculated financial data in clear, encouraging language. Never invent
numbers. Only reference values provided in the data.

Data: {EngineOutput JSON}

User question: {user message}

Respond concisely. Be actionable and encouraging.
```

### 13.3 AI Boundaries

**Can:**
- Explain dashboard metrics
- Explain STS
- Explain forecasts and goal progress
- Teach financial concepts
- Suggest general strategies

**Cannot:**
- Create, edit, or delete transactions
- Change goals or settings
- Invent financial numbers
- Perform calculations independently

---

## 14. Test Vectors

### 14.1 STS Calculation

```
Input:
  startingBalance: 0
  incomeLogged: 170000
  expensesLogged: 61000
  remainingFixedExpenses: 15000
  requiredGoalContributions: 25000
  emergencyFundProtection: 10000
  daysRemaining: 10
  trendMultiplier: 1.0

Expected:
  currentCashAvailable: 109000
  discretionaryPool: 59000
  baselineSTS: 5900
  safeToSpendToday: 5900
```

### 14.2 Health Score

```
Input:
  savingsRateScore: 80
  emergencyFundScore: 60
  goalProgressScore: 70
  spendingConsistencyScore: 80
  incomeStabilityScore: 100

Expected:
  healthScore: (80×0.30) + (60×0.25) + (70×0.20) + (80×0.15) + (100×0.10)
             = 24 + 15 + 14 + 12 + 10
             = 75
```

### 14.3 Can I Buy This — WAIT

```
Input:
  purchaseAmount: 320000
  emergencyFundCurrent: 180000
  predictedMonthlyExpenses: 70000
  emergencyFundAfterPurchase: -140000 (negative)
  savingsRateAfter: 0.16
  savingsRateTarget: 0.20

Expected:
  recommendation: "WAIT"
  triggeredRule: "R1"
```

### 14.4 Can I Buy This — GO AHEAD

```
Input:
  purchaseAmount: 5000
  emergencyFundCurrent: 180000
  predictedMonthlyExpenses: 70000
  allGoalsOnTrack: true
  savingsRateAfter: 0.22
  savingsRateTarget: 0.20

Expected:
  recommendation: "GO_AHEAD"
  triggeredRule: "R4"
```

### 14.5 Transaction Parser

```
Input: "Petrol 7550"
Expected: { description: "Petrol", amount: 7550, category: "FUEL", type: "EXPENSE" }

Input: "Salary 120000"
Expected: { description: "Salary", amount: 120000, category: "INCOME", type: "INCOME" }

Input: "XYZ 500"
Expected: { description: "XYZ", amount: 500, category: "OTHER", type: "EXPENSE" }
```

---

## 15. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | June 2025 | Initial engine specification |

### Versioning Policy

- **Patch (1.0.x):** Bug fixes, no formula changes
- **Minor (1.x.0):** Formula tuning, new sub-scores, backward-compatible
- **Major (x.0.0):** Breaking formula changes, requires migration

All version changes require:
1. Updated specification document
2. Updated test vectors
3. Regression test suite pass
4. Changelog entry

---

## 16. Glossary

| Term | Definition |
|------|------------|
| **Baseline STS** | Discretionary pool divided by days remaining (before trend adjustment) |
| **Correction Event** | Ledger entry amending a previous transaction |
| **Discretionary Pool** | Cash available after obligations and goal protection |
| **Effective Transaction** | Transaction after applying corrections and excluding deletes |
| **Envelope Encryption** | KEK encrypts DEK, DEK encrypts data |
| **Prorated** | Amount adjusted proportionally for partial cycle |
| **Trend Multiplier** | Day-of-week spending adjustment factor (0.85–1.15) |
