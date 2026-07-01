# Nexa Financial Intelligence Engine

## Algorithms & Decision Engine Specification (v1.0)

**Document Version:** 1.0 (MVP)

**Purpose:** Define every deterministic financial algorithm used by Nexa. The AI layer never performs calculations—it only explains the output of these algorithms.

---

## Core Principle

The architecture follows a strict rule:

```
User Data
      ↓
Financial Intelligence Engine
      ↓
Deterministic Calculations
      ↓
Structured JSON Output
      ↓
Groq AI
      ↓
Human-readable Explanation
```

The engine is the single source of truth. Every number shown in the app must originate here.

---

## Inputs

Every algorithm operates on a shared financial state:

```
FinancialState {
    currentCycle
    currentCash
    incomes[]
    transactions[]
    recurringExpenses[]
    goals[]
    emergencyFund
    settings
}
```

---

## 1. Current Cash Available (CCA)

### Purpose

Represents the user's available money during the active financial cycle.

### Formula

```
CCA = Starting Balance + Income Logged - Expenses Logged
```

### Example

| | |
|---|---|
| Starting Balance | 20,000 |
| + Salary | 120,000 |
| + Freelancing | 40,000 |
| - Expenses | 55,000 |
| **=** | **125,000** |

---

## 2. Predicted Monthly Expenses (PME)

### Purpose

Estimate what the user is likely to spend this cycle.

### Cold Start

```
PME = Recurring Expenses + Estimated Variable Spending
```

Estimated Variable Spending is collected during onboarding.

### Mature Users

After 3 completed cycles:

```
PME = Recurring Expenses + Average Variable Spending (last 3 cycles)
```

---

## 3. Emergency Fund Target

### Purpose

Determine the recommended emergency fund.

### Formula

```
Emergency Fund Target = Predicted Monthly Expenses × Emergency Months
```

**Default:** 3 months

### Example

| | |
|---|---|
| PME | 70,000 |
| **↓** | |
| Emergency Fund | 210,000 |

---

## 4. Required Monthly Goal Savings

Each goal calculates:

```
Remaining Amount = Goal Target - Current Saved
```

Then:

```
Monthly Requirement = Remaining Amount ÷ Months Remaining
```

### Example

| | |
|---|---|
| Laptop Target | 300,000 |
| Saved | 60,000 |
| Remaining | 240,000 |
| 8 Months | |
| **↓** | **30,000/month** |

---

## 5. Aggregate Savings Target

Combine all active goals.

```
Aggregate Monthly Savings = Σ Goal Monthly Requirements
```

### Example

| Goal | Amount |
|---|---|
| Emergency Fund | 20k |
| Laptop | 15k |
| Travel | 5k |
| **Total** | **40k/month** |

---

## 6. Savings Rate

### Formula

```
Savings Rate = Required Monthly Savings ÷ Monthly Income
```

### Example

| | |
|---|---|
| Savings Required | 40k |
| Income | 200k |
| **↓** | **20%** |

---

## 7. Goal Allocation Engine

The engine doesn't lock funds. Instead it simulates allocation.

### Priority

```
Emergency Fund
      ↓
High Priority
      ↓
Medium Priority
      ↓
Low Priority
```

### Algorithm

```
Expected Savings
      ↓
Allocate → Highest Priority
      ↓
Remaining Savings
      ↓
Next Goal
      ↓
Repeat
```

---

## 8. Safe To Spend™ (STS)

This is Nexa's flagship algorithm.

### Definition

Maximum amount that can be spent today without reducing the probability of reaching financial goals.

### Step 1

Calculate Current Cash → **CCA**

### Step 2

Estimate Remaining Fixed Expenses → Recurring Expenses not yet paid

### Step 3

Reserve Goal Contributions → Aggregate Monthly Savings × Remaining Days Ratio

### Step 4

Compute Discretionary Pool:

```
Current Cash - Remaining Fixed Expenses - Reserved Goal Savings
```

### Step 5

Convert to Daily Safe Spending:

```
Discretionary Pool ÷ Remaining Days
```

### Step 6

Behavior Adjustment — Maximum ±15% using:

- Spending trend
- Weekend adjustment
- Seasonality (future)

Never exceed 15%.

### Output

```
Safe To Spend: PKR 4,250
```

---

## 9. Financial Health Score

**Scale:** 0–100

### Weights

| Factor | Weight |
|---|---|
| Savings Rate | 30% |
| Emergency Fund Progress | 25% |
| Goal Progress | 20% |
| Spending Consistency | 15% |
| Income Stability | 10% |

### Savings Rate

Higher achievement → Higher score

### Emergency Fund

Current ÷ Target

### Goal Progress

Average progress across active goals

### Spending Consistency

Compare Actual vs Predicted. Smaller variance → Higher score

### Income Stability

Actual Income ÷ Expected Income

---

## 10. Purchase Simulation ("Can I Buy This?")

### Input

Purchase Price

### Simulation

```
CCA
  ↓
Subtract Purchase
  ↓
Recalculate
  ↓
Goals → STS → Emergency Fund → Health Score
```

Nothing is actually saved. Everything is simulated.

### Decision Rules

**WAIT** if:

- Emergency Fund delayed, OR
- Goal delayed >30 days, OR
- Savings Rate below target, OR
- STS becomes negative

**Otherwise:** GO AHEAD

---

## 11. Goal ETA Forecast

```
Remaining Amount ÷ Projected Monthly Savings = Months Remaining
```

```
ETA = Today + Months Remaining
```

---

## 12. Spending Trend Detection

For every category:

```
Average Spend → Compare → Current Cycle
```

### Output

Higher | Lower | Normal

### Example

| | |
|---|---|
| Food Average | 15k |
| Current | 18k |
| **↓** | **20% higher** |

---

## 13. Category Variance

Compare Expected vs Actual

| | |
|---|---|
| Fuel Expected | 12k |
| Actual | 10k |
| **↓** | **Under Budget 2k** |

---

## 14. Weekly Summary

Compute:

- Income
- Expenses
- Savings
- Highest Category
- Lowest Category
- Average Daily Spend
- STS Trend
- Goal Progress
- Health Score Change

---

## 15. Monthly Review

Generate:

- Income
- Expenses
- Savings
- Net Cash Flow
- Goal Progress
- Emergency Fund Progress
- Financial Health
- Largest Expense
- Category Breakdown
- Recommendations

---

## 16. Cash Flow Forecast

Project:

```
Income
  ↓
Recurring Expenses
  ↓
Average Variable Spending
  ↓
Goal Contributions
  ↓
Projected Ending Balance
```

---

## 17. Goal Risk Detection

Every goal receives a **Risk Score**.

### Factors

- Behind schedule
- Insufficient savings
- Reduced income
- Increased spending

### Risk Levels

Low | Medium | High

---

## 18. Expense Parser

### Input

```
Petrol 2500
```

### Output

```json
{
  "type": "expense",
  "category": "Fuel",
  "amount": 2500,
  "merchant": "Petrol"
}
```

If confidence is low: User confirms

---

## 19. Financial Cycle Engine

Automatically:

- Creates
- Starts
- Ends
- Rolls over
- Carries balance

Calculates:

- Starting Balance
- Ending Balance
- Current Balance

---

## 20. Goal Projection Engine

Every new transaction triggers:

```
Transaction
  ↓
Cash Available
  ↓
STS
  ↓
Health Score
  ↓
Goal ETA
  ↓
Purchase Simulation Cache
  ↓
Dashboard Refresh
```

Everything updates in real time.

---

## 21. Immutable Ledger Engine

Every financial event is append-only.

### Events include

- Transaction Created
- Transaction Corrected
- Transaction Deleted (logical delete)
- Goal Created
- Goal Updated
- Goal Closed

### Each event contains

- Previous Hash
- Current Hash
- Timestamp
- Event Payload
- Actor

This creates a tamper-evident audit trail without introducing blockchain infrastructure.

---

## 22. AI Explanation Engine

The AI never performs calculations.

### Input

```json
{
  "safeToSpend": 4250,
  "healthScore": 86,
  "goalDelay": 0,
  "fuelVariance": -1300
}
```

### Output

> "You're on track this month. Your fuel spending is below your usual average, and spending up to PKR 4,250 today should not affect your active financial goals."

The AI is restricted to explaining engine outputs and general financial education.

---

## Design Principles

Every algorithm in the Financial Intelligence Engine should satisfy these principles:

| Principle | Description |
|---|---|
| **Deterministic** | Same input always produces the same output. |
| **Pure where possible** | Avoid side effects; calculations should be testable in isolation. |
| **Versioned** | Financial rules are versioned (v1.0, v1.1, etc.) to support future improvements without breaking historical behavior. |
| **Auditable** | Every important calculation can be traced back to its inputs. |
| **Composable** | Small algorithms (cash flow, savings, forecasting) combine to power higher-level features like Safe To Spend™ and Purchase Simulation. |

---

This engine is the core intellectual property of Nexa. The web application, dashboard, APIs, and AI layer are interfaces around it; the engine itself is what delivers consistent, explainable financial decisions.
