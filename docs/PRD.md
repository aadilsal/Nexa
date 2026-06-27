# Nexa — Product Requirements Document

**Project Codename:** Nexa  
**Version:** 1.0  
**Status:** Pre-Development  
**Last Updated:** June 2025

---

## 1. Executive Summary

Nexa is a privacy-first, AI-powered financial decision platform designed for the Pakistani market. It is **not** an expense tracker, budgeting app, or banking application.

Nexa helps users answer one question every day:

> **"Can I afford this while staying on track toward my financial goals?"**

Expense logging is the data collection mechanism. The product is **intelligent financial guidance** — Safe To Spend™, purchase simulations, goal tracking, and actionable insights.

**One-sentence pitch:** Nexa transforms simple expense logging into personalized financial guidance, helping Pakistanis make confident money decisions without bank integrations or complex setup.

---

## 2. Problem Statement

The biggest financial problem in Pakistan is not that people don't know how much they spend. It's that they don't know:

- Can I afford this purchase?
- Am I still on track this month?
- Will this expense delay my goals?
- Am I actually saving enough?
- Where is my money taking me?

Current finance apps answer **"What happened?"** Nexa answers **"What should I do next?"**

---

## 3. Mission & Vision

**Mission:** Help Pakistanis make smarter financial decisions by turning every expense into meaningful financial guidance.

**Vision:** Become the first app people think of whenever they make a financial decision — not because they enjoy tracking expenses, but because they trust Nexa to guide them.

---

## 4. Target Audience

### Primary Users

- Salaried professionals
- Software engineers
- Freelancers and remote workers
- Newly married couples
- Young professionals
- Small business owners

### Income Range

PKR 50,000 – 500,000 per month

### Geographic Focus

Pakistan (PKR only, English UI for MVP)

---

## 5. Core Philosophy

Nexa never asks: *"How much did you spend?"*

Nexa asks: *"How does this expense affect your future?"*

Every feature, screen, and interaction is driven by this mindset.

---

## 6. User Journey

### 6.1 Onboarding (< 5 Minutes)

The user provides:

**Income Sources**
- Salary
- Freelancing
- Side income
- Other recurring income

**Monthly Fixed Expenses**
- Rent, fuel, internet, mobile, gym, subscriptions, utilities, loan payments, etc.

**Variable Spending Estimate**
- "On average, how much do you spend on variable expenses every month?"
- Covers food, shopping, entertainment, dining, miscellaneous

**Financial Goals**
- Emergency Fund (auto-created with suggested target)
- Custom goals: car, house, laptop, wedding, Hajj, Umrah, vacation, parents, investments, etc.

Each goal includes:
- Name
- Target amount
- Target date
- Priority (High / Medium / Low)

**Cycle Configuration**
- Primary payday (e.g., 5th of every month)
- Freelancers without regular payday: preferred cycle start date
- Optional starting balance

**Emergency Fund**
- Automatically created during onboarding
- Target suggested as: Predicted Monthly Expenses × 3
- User can edit the target

### 6.2 Dashboard

The dashboard answers questions — it does not display charts for the sake of charts.

**Example:**

```
Good Evening 👋

Financial Health          86 / 100

Income This Month         PKR 170,000
Spent                     PKR 61,000
Projected Savings         PKR 48,500

Emergency Fund            73% Complete

Safe To Spend Today       PKR 4,350

Today's Insight
You're comfortably on track. Your recent fuel expenses are
slightly higher than average, but they won't affect your savings goal.
```

### 6.3 Expense Logging (< 5 Seconds)

Logging must take less than 5 seconds. No dropdown-heavy forms.

**Input examples:**
```
Petrol 7550
KFC 1450
Coffee 650
Gym 10000
Salary 120000
Charity 1000
```

The app automatically:
1. Detects category
2. Detects amount
3. Detects transaction type (income vs expense)
4. Saves transaction to immutable ledger
5. Recalculates forecasts, goals, health score, and Safe To Spend

Unknown categories default to **Other** with one-click recategorization.

### 6.4 Immediate Post-Log Feedback

Every expense instantly provides value:

```
Petrol 7550
        ↓
Fuel spending is within your monthly average.
Your Safe To Spend is now PKR 8,950.
You'll still reach your emergency fund by September.

Financial Health: 86 → 86
```

### 6.5 Safe To Spend™

Flagship feature. Instead of "How much have I spent?" users ask "How much can I safely spend?"

```
Safe To Spend Today       PKR 4,200

You can spend this amount today without affecting:
✓ Savings
✓ Emergency Fund
✓ Travel Goal
```

### 6.6 Can I Buy This?

User enters an item and amount. Nexa simulates the purchase impact:

```
iPhone — PKR 320,000

If purchased today:
  Emergency Fund     Delayed 47 Days
  Savings Rate       Drops to 16%
  Travel Goal        Delayed 2 Months

Recommendation: Wait until November.
```

Or:

```
Recommendation: Go Ahead
This purchase won't negatively affect your financial goals.
```

Recommendations come from **rules**, not AI. AI only explains why.

### 6.7 Goal Tracking

Goals update automatically. Users never manually update progress.

```
Emergency Fund
  73% Complete
  Target: PKR 300,000
  ETA: September
```

### 6.8 Financial Health Score

Single score (0–100) instead of overwhelming metrics. Gives users a quick snapshot of financial health.

### 6.9 AI Insights

AI explains engine results — it does not replace financial logic.

Examples:
- "You spent 12% less on food this week compared to last week."
- "Great progress. You're ahead of schedule for your emergency fund."
- "Buying this laptop today would delay your travel goal by approximately three weeks."

Insights are concise, actionable, and encouraging.

### 6.10 Weekly Review

Delivered in-app and via email:

```
This Week
  Income        PKR 42,000
  Spent         PKR 28,500
  Saved         PKR 13,500

Highest Spending    Food
Lowest Spending     Shopping

Overall             Excellent Week

Recommendation
Continue this pace to reach your emergency fund one week early.
```

### 6.11 Financial Chat

Read-only AI assistant grounded in engine data. Can explain metrics, teach concepts, suggest strategies. Cannot create/edit transactions, change goals, or invent numbers.

### 6.12 Cycle Rollover

At the end of every financial cycle:
- Ending cash automatically becomes the next cycle's starting balance
- On first login of a new cycle, user sees confirmation prompt:

```
New financial cycle started.
Starting balance: PKR 34,250
Is this correct?
[Confirm]  [Adjust]
```

---

## 7. Feature Requirements

### 7.1 Must Have (MVP)

| ID | Feature | Description |
|----|---------|-------------|
| F-01 | Authentication | Email/password + Google OAuth |
| F-02 | Onboarding | Income, fixed expenses, variable estimate, goals, payday |
| F-03 | Financial Cycles | Payday-to-payday cycle management with rollover |
| F-04 | Fast Expense Logging | Natural language input, auto-categorization, < 5 sec |
| F-05 | Income Logging | Log actual income each cycle |
| F-06 | Immutable Ledger | Append-only transaction history with correction/delete events |
| F-07 | Dashboard | Financial health, STS, goals, insights |
| F-08 | Safe To Spend™ | Dynamic disposable spending calculation |
| F-09 | Can I Buy This? | Rule-based purchase simulation |
| F-10 | Goal Tracking | Auto-updated progress and ETAs |
| F-11 | Financial Health Score | Weighted composite score (0–100) |
| F-12 | AI Insights | Groq-powered explanations of engine output |
| F-13 | Financial Chat | Read-only AI assistant |
| F-14 | Weekly Review | In-app summary + email notification |
| F-15 | Variance Analysis | Expected vs actual for fixed expenses and income |
| F-16 | Charity Tracking | Charity category with yearly aggregate |
| F-17 | Data Export | CSV and JSON |
| F-18 | Account Deletion | Soft delete (30 days) then permanent |
| F-19 | Audit Logs | User-visible security events |
| F-20 | Analytics | PostHog event tracking |

### 7.2 Should Have (MVP Polish)

| ID | Feature | Description |
|----|---------|-------------|
| F-21 | One-click recategorization | Fix misclassified transactions |
| F-22 | Cycle confirmation UX | Confirm/adjust starting balance on new cycle |
| F-23 | Emergency Fund auto-suggestion | Pre-fill target from predicted expenses × 3 |

### 7.3 Will Not Have (MVP)

| Feature | Reason |
|---------|--------|
| Bank integrations | Validates core without complexity |
| Easypaisa/JazzCash | Post-MVP |
| Receipt OCR | Post-MVP |
| Investment tracking | Post-MVP |
| Family/shared accounts | Post-MVP |
| Expense splitting | Post-MVP |
| Hard budget limits | Conflicts with STS philosophy |
| Bill payments | Post-MVP |
| Tax calculations | Post-MVP |
| Zakat calculator | Post-MVP (Phase 2) |
| Native mobile apps | Web-first MVP |
| Social features | Post-MVP |
| Multi-currency | PKR only |
| Urdu language | English first |
| 2FA | Version 2 |
| Daily notifications | Post-MVP |

---

## 8. Privacy & Trust Requirements

Trust is a product feature, not an afterthought.

### 8.1 Privacy

- Users own their data
- No selling user data
- No advertising based on financial behavior
- Data export available (CSV + JSON)
- Account deletion available (soft 30 days → permanent)

### 8.2 Security

- HTTPS/TLS everywhere
- Argon2id password hashing
- Application-level encryption for sensitive financial data (envelope encryption)
- Rate limiting (per IP and per user)
- Audit logs
- Secure authentication (Better Auth)
- OWASP best practices

### 8.3 Data Integrity

- Immutable ledger with cryptographic hash chaining
- Edits create correction events; deletes create delete events
- Full history preserved for auditability

---

## 9. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Expense logging time | < 5 seconds |
| Onboarding time | < 5 minutes |
| Dashboard load time | < 2 seconds |
| API response time (engine) | < 500ms |
| Uptime | 99.5% |
| Concurrent users (MVP) | 1,000 |
| Data retention after deletion | 30 days soft, then permanent |
| Browser support | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| Mobile | Responsive web (phone browser) |

---

## 10. Success Metrics

Measure product value, not vanity downloads:

| Metric | Description |
|--------|-------------|
| 7-day retention | Users returning within first week |
| 30-day retention | Users returning within first month |
| Weekly active users | Users active at least once per week |
| Time to log expense | Average time from open to save |
| Post-spend logging rate | % of expenses logged within 24 hours of spending |
| Can I Buy This? usage | Number of purchase simulations per user |
| STS views | How often users check Safe To Spend |
| Goal completion rate | % of users reaching at least one goal |
| Weekly review open rate | % of users opening weekly review |
| AI interaction rate | Chat and insight engagement |
| AI recommendation satisfaction | User feedback on AI explanations |

### Analytics Events (PostHog)

- `signup_completed`
- `onboarding_completed`
- `expense_logged`
- `income_logged`
- `safe_to_spend_viewed`
- `can_i_buy_simulated`
- `goal_created`
- `weekly_review_opened`
- `ai_chat_message_sent`
- `ai_insight_viewed`
- `cycle_rollover_confirmed`
- `cycle_rollover_adjusted`
- `data_exported`
- `account_deleted`

---

## 11. User Stories

### Onboarding

- As a new user, I want to set up my finances in under 5 minutes so I can start getting guidance immediately.
- As a salaried professional, I want to enter my payday so the app aligns with how I think about money.
- As a freelancer, I want to log variable income so forecasts reflect my actual earnings.

### Daily Use

- As a user, I want to log "Petrol 7550" in one step so tracking doesn't feel like bookkeeping.
- As a user, I want instant feedback after logging so I understand the impact of every expense.
- As a user, I want to see Safe To Spend so I know how much I can spend today without guilt.

### Decision Making

- As a user, I want to simulate buying a PKR 320,000 phone so I know if it will delay my goals.
- As a user, I want a clear WAIT or GO AHEAD recommendation so I can decide confidently.

### Goals

- As a user, I want my emergency fund progress tracked automatically so I stay motivated.
- As a user, I want to see when I'll reach each goal so I can plan ahead.

### Trust

- As a user, I want to export all my data so I own my financial records.
- As a user, I want to delete my account and know my data is gone.
- As a user, I want to know my financial data is encrypted and never sold.

---

## 12. Development Phases

### Phase 1 (2–3 weeks)
Authentication, onboarding, financial cycles, transaction logging, immutable ledger, goals, basic dashboard.

### Phase 2 (2–3 weeks)
Finance Engine v1.0: Safe To Spend, Financial Health Score, forecasting, variance analysis, goal ETAs.

### Phase 3 (1–2 weeks)
AI explanations (Groq), Can I Buy This?, financial chat, weekly reviews (in-app + email).

### Phase 4 (1 week)
Security hardening, envelope encryption, audit logs, export/delete, PostHog, testing, Docker, CI/CD, deployment.

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Users don't log expenses | Immediate post-log value (STS update, insights) |
| STS feels unpredictable | Conservative ±15% trend adjustment; transparent formula |
| AI hallucinates numbers | Engine-only calculations; Groq receives structured JSON |
| Google OAuth + encryption conflict | Server-managed DEKs, not password-derived |
| Freelancer income volatility | Variable income logging; income stability in health score |
| Cold start inaccurate forecasts | Onboarding variable estimate; replaced by history after 2–3 cycles |
| Scope creep | Explicit "Will Not Have" list; phase-gated development |

---

## 14. Glossary

| Term | Definition |
|------|------------|
| **Safe To Spend (STS)** | Maximum amount user can spend today without compromising goals or emergency fund |
| **Financial Cycle** | Period from one payday to the day before the next payday |
| **Financial Health Score** | Composite 0–100 score of overall financial wellness |
| **Immutable Ledger** | Append-only transaction log with hash chaining |
| **Correction Event** | Ledger entry that reverses/amends a previous transaction without deleting history |
| **Discretionary Pool** | Cash available after fixed expenses, goal contributions, and emergency fund protection |
| **Predicted Monthly Expenses** | Recurring expenses + variable spending (estimated or historical average) |

---

## 15. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | June 2025 | Nexa Team | Initial PRD |
