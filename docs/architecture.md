# Nexa — Technical Architecture Document

**Version:** 1.0  
**Status:** Pre-Development  
**Last Updated:** June 2025

---

## 1. Overview

This document defines the system architecture, technology stack, API design, database schema, security model, and deployment strategy for Nexa MVP.

### Design Principles

1. **Engine-first** — The Financial Intelligence Engine is the single source of truth for all financial calculations
2. **Monorepo** — Shared types, validation, and tooling across frontend and backend
3. **Production-grade from day one** — Modular architecture, API versioning, automated testing, CI/CD
4. **Security by default** — Encryption, immutable ledger, audit logs, rate limiting
5. **AI as explainer** — Groq never calculates; it only explains engine output

---

## 2. System Architecture

### 2.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Next.js 19 (React 19) — Vercel                     │   │
│  │  Tailwind v4 · shadcn/ui · TanStack Query           │   │
│  └──────────────────────┬──────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  NestJS — Render                                    │   │
│  │  /api/v1/* · Swagger/OpenAPI · Rate Limiting        │   │
│  │  Better Auth · Argon2id · Audit Middleware          │   │
│  └──────┬──────────────┬──────────────┬────────────────┘   │
└─────────┼──────────────┼──────────────┼─────────────────────┘
          │              │              │
          ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Finance    │  │   Groq AI   │  │   Upstash   │
│  Engine     │  │   (Explain  │  │   Redis     │
│  v1.0.0     │  │    Only)    │  │   (Cache)   │
│  (Pure TS)  │  └─────────────┘  └─────────────┘
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
│  ┌──────────────────────┐  ┌──────────────────────────┐  │
│  │  Neon PostgreSQL     │  │  Envelope Encryption     │  │
│  │  Prisma ORM          │  │  KEK → DEK → Data         │  │
│  │  Immutable Ledger    │  │  (Server-managed keys)     │  │
│  └──────────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Request Flow — Expense Logging

```
1. User types "Petrol 7550" in Next.js client
2. Client POST /api/v1/transactions/parse → preview category/amount
3. User confirms → POST /api/v1/transactions
4. NestJS:
   a. Parse input
   b. Encrypt transaction payload with user DEK
   c. Append CREATE event to immutable ledger (with hash chain)
   d. Call Finance Engine v1.0 with updated cycle data
   e. Call Groq with engine output → generate insight text
   f. Return PostLogOutput + insight to client
5. Client displays immediate feedback (STS change, health score, insight)
6. PostHog tracks expense_logged event
```

### 2.3 Request Flow — Dashboard

```
1. Client GET /api/v1/dashboard
2. NestJS:
   a. Load user cycle, transactions (decrypt), goals, fixed expenses
   b. Call Finance Engine v1.0 → full EngineOutput
   c. Optionally call Groq → today's insight text
   d. Cache EngineOutput in Redis (TTL: 5 min, invalidate on new transaction)
3. Client renders dashboard from EngineOutput (no client-side calculations)
```

---

## 3. Monorepo Structure

```
nexa/
├── apps/
│   ├── web/                    # Next.js 19 frontend
│   │   ├── app/                # App Router pages
│   │   ├── components/         # UI components (shadcn/ui)
│   │   ├── hooks/              # TanStack Query hooks
│   │   ├── lib/                # Client utilities
│   │   └── package.json
│   │
│   └── api/                    # NestJS backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── cycles/
│       │   │   ├── transactions/
│       │   │   ├── goals/
│       │   │   ├── dashboard/
│       │   │   ├── simulations/
│       │   │   ├── insights/
│       │   │   ├── reviews/
│       │   │   └── export/
│       │   ├── common/
│       │   │   ├── encryption/
│       │   │   ├── audit/
│       │   │   └── rate-limit/
│       │   └── main.ts
│       └── package.json
│
├── packages/
│   ├── finance-engine/         # Pure TypeScript — no dependencies
│   │   ├── src/
│   │   │   ├── cycle.ts
│   │   │   ├── cash.ts
│   │   │   ├── safe-to-spend.ts
│   │   │   ├── health-score.ts
│   │   │   ├── goals.ts
│   │   │   ├── purchase-simulation.ts
│   │   │   ├── parser.ts
│   │   │   ├── variance.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── shared/                 # Shared types and validation
│   │   ├── src/
│   │   │   ├── schemas/        # Zod schemas
│   │   │   ├── types/          # TypeScript types
│   │   │   ├── constants/      # Categories, priorities, etc.
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── eslint-config/          # Shared ESLint config
│
├── docs/
│   ├── PRD.md
│   ├── finance-engine-spec.md
│   └── architecture.md         # This document
│
├── docker/
│   ├── docker-compose.yml      # Local dev: Postgres, Redis
│   └── Dockerfile.api
│
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint, test, build
│       └── deploy.yml          # Deploy to Vercel + Render
│
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## 4. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Monorepo** | Turborepo + pnpm | Workspace management, build caching |
| **Frontend** | Next.js 19, React 19 | App Router, SSR, API routes |
| **UI** | Tailwind CSS v4, shadcn/ui | Component library, styling |
| **Client State** | TanStack Query | Server state, caching, mutations |
| **Forms** | React Hook Form + Zod | Form validation |
| **Backend** | NestJS | Modular API, dependency injection |
| **ORM** | Prisma | Type-safe database access, migrations |
| **Database** | Neon PostgreSQL | Serverless Postgres |
| **Cache** | Upstash Redis | Engine output cache, rate limiting |
| **Auth** | Better Auth | Email + Google OAuth, sessions |
| **AI** | Groq API | Explanations only |
| **Analytics** | PostHog | Product analytics |
| **Email** | Resend (or similar) | Weekly review emails |
| **Frontend Deploy** | Vercel | Next.js hosting |
| **Backend Deploy** | Render | NestJS hosting |
| **CI/CD** | GitHub Actions | Lint, test, build, deploy |
| **Local Dev** | Docker Compose | Postgres + Redis |

---

## 5. API Design

### 5.1 Conventions

- Base path: `/api/v1`
- Authentication: HTTP-only session cookies (Better Auth)
- Content-Type: `application/json`
- Error format: `{ statusCode, message, error }`
- Pagination: `{ data, meta: { page, limit, total } }`
- All financial numbers returned as integers (PKR, no decimals)
- Swagger/OpenAPI docs at `/api/v1/docs`

### 5.2 Endpoints

#### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/sign-up` | Email registration |
| POST | `/auth/sign-in` | Email login |
| POST | `/auth/sign-out` | Logout |
| GET | `/auth/session` | Current session |
| POST | `/auth/google` | Google OAuth |
| POST | `/auth/forgot-password` | Password reset request |
| POST | `/auth/reset-password` | Password reset confirm |

#### Onboarding

| Method | Path | Description |
|--------|------|-------------|
| POST | `/onboarding/complete` | Submit all onboarding data |
| GET | `/onboarding/status` | Check if onboarding complete |

#### Financial Cycles

| Method | Path | Description |
|--------|------|-------------|
| GET | `/cycles/current` | Get active cycle |
| POST | `/cycles/confirm-rollover` | Confirm starting balance |
| POST | `/cycles/adjust-rollover` | Adjust starting balance |
| GET | `/cycles/history` | List past cycles |

#### Transactions

| Method | Path | Description |
|--------|------|-------------|
| POST | `/transactions/parse` | Parse natural language input (preview) |
| POST | `/transactions` | Create transaction |
| GET | `/transactions` | List transactions (current cycle) |
| POST | `/transactions/:id/correct` | Create correction event |
| POST | `/transactions/:id/delete` | Create delete event |
| PATCH | `/transactions/:id/category` | Recategorize transaction |

#### Goals

| Method | Path | Description |
|--------|------|-------------|
| GET | `/goals` | List all goals with progress |
| POST | `/goals` | Create goal |
| PATCH | `/goals/:id` | Update goal |
| DELETE | `/goals/:id` | Delete goal |

#### Dashboard & Engine

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Full engine output + insight |
| GET | `/dashboard/safe-to-spend` | STS only (lightweight) |
| GET | `/dashboard/health-score` | Health score only |

#### Simulations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/simulations/purchase` | Can I Buy This? simulation |

#### AI

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ai/chat` | Financial chat (engine-grounded) |
| GET | `/ai/insight` | Today's insight |

#### Reviews

| Method | Path | Description |
|--------|------|-------------|
| GET | `/reviews/weekly` | Current weekly review |
| GET | `/reviews/weekly/history` | Past weekly reviews |

#### User Data

| Method | Path | Description |
|--------|------|-------------|
| GET | `/export/csv` | Export data as CSV |
| GET | `/export/json` | Export data as JSON |
| DELETE | `/account` | Request account deletion |
| POST | `/account/cancel-deletion` | Cancel pending deletion |
| GET | `/audit-logs` | User audit log |

#### Fixed Expenses & Income

| Method | Path | Description |
|--------|------|-------------|
| GET | `/fixed-expenses` | List fixed expenses |
| PATCH | `/fixed-expenses/:id` | Update expected amount |
| GET | `/income-expectations` | List income expectations |
| PATCH | `/income-expectations/:id` | Update expected amount |

---

## 6. Database Schema

### 6.1 Entity Relationship Overview

```
User ──┬── FinancialCycle ──── TransactionEvent (ledger)
       │                  └── EngineSnapshot (cache)
       ├── Goal
       ├── FixedExpense
       ├── IncomeExpectation
       ├── UserSettings
       ├── EncryptionKey (DEK)
       ├── AuditLog
       └── AccountDeletion
```

### 6.2 Prisma Schema

```prisma
// ─── Enums ───────────────────────────────────────────────

enum CycleStatus {
  ACTIVE
  COMPLETED
  PENDING_CONFIRMATION
}

enum TransactionEventType {
  CREATE
  CORRECTION
  DELETE
}

enum TransactionType {
  INCOME
  EXPENSE
}

enum Category {
  FOOD
  FUEL
  SHOPPING
  ENTERTAINMENT
  UTILITIES
  HEALTHCARE
  TRANSPORT
  HOUSING
  EDUCATION
  CHARITY
  INVESTMENT
  INCOME
  OTHER
}

enum GoalPriority {
  EMERGENCY_FUND
  HIGH
  MEDIUM
  LOW
}

enum AuditAction {
  LOGIN
  LOGOUT
  PASSWORD_CHANGE
  EXPORT_CSV
  EXPORT_JSON
  TRANSACTION_CREATE
  TRANSACTION_CORRECT
  TRANSACTION_DELETE
  TRANSACTION_RECATEGORIZE
  GOAL_CREATE
  GOAL_UPDATE
  GOAL_DELETE
  CYCLE_ROLLOVER_CONFIRM
  CYCLE_ROLLOVER_ADJUST
  ACCOUNT_DELETE_REQUEST
  ACCOUNT_DELETE_CANCEL
}

// ─── Models ──────────────────────────────────────────────

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  name              String?
  emailVerified     Boolean   @default(false)
  image             String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Onboarding
  onboardingComplete Boolean  @default(false)
  primaryPayday      Int?     // Day of month (1–31)
  preferredCycleStart Int?    // For freelancers: day of month

  // Encrypted fields (stored as base64 ciphertext)
  encryptedStartingBalance  String?
  encryptedVariableEstimate String?

  // Relations
  cycles            FinancialCycle[]
  goals             Goal[]
  fixedExpenses     FixedExpense[]
  incomeExpectations IncomeExpectation[]
  encryptionKey     EncryptionKey?
  auditLogs         AuditLog[]
  accountDeletion   AccountDeletion?
  settings          UserSettings?

  @@map("users")
}

model EncryptionKey {
  id              String   @id @default(cuid())
  userId          String   @unique
  encryptedDek    String   // DEK encrypted with KEK (base64)
  dekVersion      Int      @default(1)
  createdAt       DateTime @default(now())
  rotatedAt       DateTime?

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("encryption_keys")
}

model FinancialCycle {
  id              String       @id @default(cuid())
  userId          String
  startDate       DateTime
  endDate         DateTime
  status          CycleStatus  @default(ACTIVE)

  // Encrypted
  encryptedStartingBalance String?
  encryptedEndingBalance   String?

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactionEvents TransactionEvent[]
  engineSnapshots EngineSnapshot[]

  @@index([userId, status])
  @@index([userId, startDate])
  @@map("financial_cycles")
}

model TransactionEvent {
  id                String               @id @default(cuid())
  userId            String
  cycleId           String
  eventType         TransactionEventType
  originalEventId   String?              // References event being corrected/deleted

  // Encrypted payload (contains description, amount, category, type, notes)
  encryptedPayload  String

  // Hash chain
  previousHash      String
  eventHash         String

  createdAt         DateTime             @default(now())

  cycle             FinancialCycle       @relation(fields: [cycleId], references: [id])
  originalEvent     TransactionEvent?    @relation("EventCorrections", fields: [originalEventId], references: [id])
  corrections       TransactionEvent[]   @relation("EventCorrections")

  @@index([cycleId, createdAt])
  @@index([userId, createdAt])
  @@map("transaction_events")
}

model Goal {
  id              String       @id @default(cuid())
  userId          String
  name            String
  priority        GoalPriority
  targetDate      DateTime

  // Encrypted
  encryptedTargetAmount  String
  encryptedCurrentAmount String?

  isEmergencyFund Boolean      @default(false)
  isActive        Boolean      @default(true)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isActive])
  @@map("goals")
}

model FixedExpense {
  id              String   @id @default(cuid())
  userId          String
  name            String
  category        Category

  // Encrypted
  encryptedExpectedAmount String

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("fixed_expenses")
}

model IncomeExpectation {
  id              String   @id @default(cuid())
  userId          String
  name            String   // e.g., "Salary", "Freelancing"

  // Encrypted
  encryptedExpectedAmount String

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("income_expectations")
}

model EngineSnapshot {
  id              String   @id @default(cuid())
  cycleId         String
  engineVersion   String   // e.g., "1.0.0"
  output          Json     // Full EngineOutput JSON
  calculatedAt    DateTime @default(now())

  cycle           FinancialCycle @relation(fields: [cycleId], references: [id])

  @@index([cycleId, calculatedAt])
  @@map("engine_snapshots")
}

model AuditLog {
  id              String      @id @default(cuid())
  userId          String
  action          AuditAction
  metadata        Json?       // Additional context (IP, user agent, etc.)
  ipAddress       String?
  createdAt       DateTime    @default(now())

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@map("audit_logs")
}

model AccountDeletion {
  id              String   @id @default(cuid())
  userId          String   @unique
  requestedAt     DateTime @default(now())
  scheduledFor    DateTime // requestedAt + 30 days
  cancelledAt     DateTime?
  completedAt     DateTime?

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("account_deletions")
}

model UserSettings {
  id              String   @id @default(cuid())
  userId          String   @unique
  weeklyReviewEmail Boolean @default(true)
  timezone        String   @default("Asia/Karachi")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}
```

---

## 7. Security Architecture

### 7.1 Authentication

| Component | Implementation |
|-----------|---------------|
| Provider | Better Auth |
| Methods | Email/password + Google OAuth |
| Password hashing | Argon2id |
| Sessions | HTTP-only secure cookies |
| CSRF | Better Auth built-in protection |
| 2FA | Not in MVP (v2) |

### 7.2 Envelope Encryption

```
┌─────────────────────────────────────────────┐
│  Environment / Secrets Manager              │
│  ┌─────────────────────────────────────┐   │
│  │  KEK (Key Encryption Key)         │   │
│  │  256-bit AES key                    │   │
│  │  Never stored in database           │   │
│  └──────────────┬──────────────────────┘   │
└─────────────────┼───────────────────────────┘
                  │ encrypts
                  ▼
┌─────────────────────────────────────────────┐
│  Database (encryption_keys table)           │
│  ┌─────────────────────────────────────┐   │
│  │  Per-User DEK (Data Encryption Key) │   │
│  │  Stored encrypted with KEK          │   │
│  └──────────────┬──────────────────────┘   │
└─────────────────┼───────────────────────────┘
                  │ encrypts
                  ▼
┌─────────────────────────────────────────────┐
│  Encrypted Financial Data                   │
│  • Transaction payloads                     │
│  • Goal amounts                             │
│  • Fixed expense amounts                    │
│  • Income expectations                      │
│  • Starting/ending balances                 │
│  • Variable spending estimates              │
│  • Notes                                    │
└─────────────────────────────────────────────┘
```

**Why server-managed keys (not password-derived):**
- Works with Google OAuth (no password)
- Password reset doesn't lose data access
- Supports future key rotation
- Industry standard (envelope encryption)

**Algorithm:** AES-256-GCM for data encryption, AES-256-KW for key wrapping.

### 7.3 Immutable Ledger

Each transaction event includes a cryptographic hash chain:

```
Event 1: { payload, previousHash: "genesis", eventHash: SHA256("genesis" + payload) }
Event 2: { payload, previousHash: Event1.eventHash, eventHash: SHA256(Event1.hash + payload) }
Event 3: { payload, previousHash: Event2.eventHash, eventHash: SHA256(Event2.hash + payload) }
```

Properties:
- Tamper-evident: modifying any event breaks the chain
- Append-only: edits create CORRECTION events, deletes create DELETE events
- Auditable: full history preserved
- Not marketed as "blockchain" — internal engineering decision

### 7.4 Rate Limiting

Implemented via Upstash Redis sliding window counters.

| Endpoint Group | Limit | Window | Key |
|---------------|-------|--------|-----|
| Auth (login, signup) | 5 | 1 min | IP + email |
| AI (chat, insights) | 30 | 1 min | User ID |
| Transactions | 120 | 1 min | User ID |
| Dashboard | 60 | 1 min | User ID |
| Export | 3 | 1 hour | User ID |
| General API | 100 | 1 min | IP |

### 7.5 Audit Logging

**User-visible audit log:**
- Login / logout
- Password change
- Data export (CSV / JSON)
- Transaction create / correct / delete / recategorize
- Goal create / update / delete
- Cycle rollover confirm / adjust
- Account deletion request / cancel

**Admin-only log (internal):**
- System errors
- Rate limit violations
- Suspicious activity patterns
- Encryption key rotation events

### 7.6 Account Deletion

```
User requests deletion
        ↓
Soft delete: account marked inactive
        ↓
30-day grace period (user can cancel)
        ↓
Permanent deletion:
  • All encrypted data destroyed
  • DEK destroyed
  • User record anonymized for audit compliance
  • Ledger events purged
```

### 7.7 OWASP Compliance

| Category | Mitigation |
|----------|------------|
| Injection | Prisma parameterized queries, Zod input validation |
| Broken Auth | Better Auth, Argon2id, secure cookies |
| Sensitive Data Exposure | Envelope encryption, HTTPS, no PII in logs |
| XXE | JSON-only API, no XML parsing |
| Broken Access Control | User-scoped queries, middleware guards |
| Security Misconfiguration | Environment-based config, no secrets in code |
| XSS | React auto-escaping, CSP headers |
| Insecure Deserialization | Zod validation on all inputs |
| Insufficient Logging | Structured logging, audit trail |
| SSRF | No user-controlled URLs in server requests |

---

## 8. AI Integration

### 8.1 Groq Configuration

| Setting | Value |
|---------|-------|
| Provider | Groq API |
| Model | llama-3.x (or latest available) |
| Max tokens | 500 (insights), 1000 (chat) |
| Temperature | 0.3 (low creativity, high consistency) |

### 8.2 Integration Pattern

```typescript
// NEVER do this:
const aiResponse = await groq.chat("How much can I spend today?");

// ALWAYS do this:
const engineOutput = financeEngine.calculate(userData);
const aiResponse = await groq.chat({
  system: EXPLAINER_SYSTEM_PROMPT,
  data: engineOutput,
  userQuestion: userMessage,
});
```

### 8.3 AI Use Cases in MVP

| Feature | Engine Output Used | AI Role |
|---------|-------------------|---------|
| Dashboard insight | Full EngineOutput | Generate today's insight text |
| Post-log feedback | PostLogOutput | Explain transaction impact |
| Can I Buy This? | PurchaseSimulationOutput | Explain WAIT/GO AHEAD reasoning |
| Weekly review | WeeklyReviewOutput | Generate summary narrative |
| Financial chat | Full EngineOutput | Answer questions about user's finances |

### 8.4 AI Guardrails

- Structured JSON input only — no free-form financial data to the model
- System prompt explicitly forbids inventing numbers
- Response validated: if AI response contains numbers not in engine output, strip them
- Rate limited: 30 requests/minute per user
- Logged: all AI interactions tracked in PostHog

---

## 9. Caching Strategy

### 9.1 Redis Cache (Upstash)

| Key Pattern | TTL | Invalidation |
|-------------|-----|--------------|
| `engine:{userId}:{cycleId}` | 5 min | New transaction, goal change |
| `sts:{userId}` | 5 min | New transaction |
| `ratelimit:{key}:{window}` | Window duration | Automatic expiry |

### 9.2 Client Cache (TanStack Query)

| Query Key | Stale Time | Refetch Trigger |
|-----------|-----------|-----------------|
| `dashboard` | 2 min | Mutation on transaction/goal |
| `safe-to-spend` | 1 min | Mutation on transaction |
| `goals` | 5 min | Mutation on goal |
| `transactions` | 1 min | Mutation on transaction |
| `weekly-review` | 1 hour | Weekly cron |

---

## 10. Deployment

### 10.1 Environments

| Environment | Frontend | Backend | Database |
|-------------|----------|---------|----------|
| Local | localhost:3000 | localhost:4000 | Docker Postgres |
| Staging | staging.nexa.app | staging-api.nexa.app | Neon (staging branch) |
| Production | app.nexa.app | api.nexa.app | Neon (production) |

### 10.2 Environment Variables

```bash
# ─── Shared ───────────────────────────────
NODE_ENV=production

# ─── Frontend (Vercel) ───────────────────
NEXT_PUBLIC_API_URL=https://api.nexa.app
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# ─── Backend (Render) ─────────────────────
DATABASE_URL=postgresql://...@neon.tech/nexa
REDIS_URL=rediss://...@upstash.io
KEK=<256-bit hex key>
GROQ_API_KEY=gsk_...
BETTER_AUTH_SECRET=<random 32+ chars>
BETTER_AUTH_URL=https://api.nexa.app
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
RESEND_API_KEY=re_...
CORS_ORIGIN=https://app.nexa.app

# ─── Local (Docker) ──────────────────────
DATABASE_URL=postgresql://nexa:nexa@localhost:5432/nexa
REDIS_URL=redis://localhost:6379
KEK=<local dev key>
```

### 10.3 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]

jobs:
  lint:
    - pnpm lint

  test:
    - pnpm test
    - finance-engine tests (critical path)
    - API integration tests

  build:
    - pnpm build

  deploy (on main only):
    - Frontend → Vercel (automatic)
    - Backend → Render (automatic)
    - Database migrations → Neon (via Prisma)
```

### 10.4 Docker (Local Development)

```yaml
# docker/docker-compose.yml
services:
  postgres:
    image: postgres:16
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: nexa
      POSTGRES_PASSWORD: nexa
      POSTGRES_DB: nexa
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

---

## 11. Testing Strategy

### 11.1 Test Pyramid

```
         ┌─────────┐
         │  E2E    │  Playwright (critical user flows)
         ├─────────┤
         │  API    │  NestJS integration tests
         ├─────────┤
         │ Engine  │  Finance Engine unit tests (MOST CRITICAL)
         ├─────────┤
         │  Unit   │  Component + utility tests
         └─────────┘
```

### 11.2 Finance Engine Tests (Priority)

Every formula in `finance-engine-spec.md` Section 14 must have corresponding tests:

- STS calculation (including trend adjustment)
- Health score (all sub-scores and weighting)
- Can I Buy This? (all four rules)
- Goal allocation and ETA
- Transaction parser
- Cycle rollover
- Variance analysis
- Cash position

### 11.3 API Integration Tests

- Auth flows (signup, login, Google OAuth)
- Transaction CRUD with ledger integrity
- Encryption/decryption round-trip
- Rate limiting enforcement
- Dashboard endpoint returns valid EngineOutput

### 11.4 E2E Tests (Critical Paths)

- Complete onboarding flow
- Log expense → see immediate feedback
- Can I Buy This? simulation
- Cycle rollover confirmation
- Data export

---

## 12. Observability

### 12.1 Logging

Structured JSON logging (Pino):

```json
{
  "level": "info",
  "time": "2025-06-27T10:00:00Z",
  "requestId": "abc-123",
  "userId": "user_456",
  "action": "transaction.create",
  "duration": 45,
  "engineVersion": "1.0.0"
}
```

**Never log:** decrypted financial data, passwords, encryption keys, session tokens.

### 12.2 Error Tracking

- Unhandled exceptions logged with stack traces
- Engine calculation errors logged with input snapshot (encrypted)
- Groq API failures logged with retry count

### 12.3 Product Analytics (PostHog)

Events defined in PRD Section 10. No financial amounts in analytics events — only action metadata.

---

## 13. Module Architecture (NestJS)

Each domain module follows this structure:

```
modules/transactions/
├── transactions.module.ts
├── transactions.controller.ts
├── transactions.service.ts
├── ledger.service.ts          # Immutable ledger operations
├── parser.service.ts
├── dto/
│   ├── create-transaction.dto.ts
│   ├── parse-transaction.dto.ts
│   └── transaction-response.dto.ts
└── tests/
    ├── transactions.service.spec.ts
    └── ledger.service.spec.ts
```

### Module Dependencies

```
auth → (standalone)
users → auth
cycles → users, encryption
transactions → cycles, encryption, ledger
goals → users, encryption
dashboard → cycles, transactions, goals, finance-engine
simulations → dashboard, finance-engine
insights → dashboard, groq
reviews → dashboard, groq
export → users, transactions, goals, encryption
```

---

## 14. Shared Package Design

### 14.1 Zod Schemas (`packages/shared`)

All API request/response validation schemas live here, shared between frontend and backend:

```typescript
// packages/shared/src/schemas/transaction.schema.ts
export const CreateTransactionSchema = z.object({
  rawInput: z.string().min(1).max(200),
});

export const ParsedTransactionSchema = z.object({
  description: z.string(),
  amount: z.number().int().positive(),
  category: CategoryEnum,
  type: z.enum(["INCOME", "EXPENSE"]),
  confidence: z.number().min(0).max(1),
});
```

### 14.2 Constants

```typescript
// packages/shared/src/constants/categories.ts
export const CATEGORIES = [
  "FOOD", "FUEL", "SHOPPING", "ENTERTAINMENT",
  "UTILITIES", "HEALTHCARE", "TRANSPORT", "HOUSING",
  "EDUCATION", "CHARITY", "INVESTMENT", "INCOME", "OTHER",
] as const;

export const CATEGORY_KEYWORDS: Record<Category, string[]> = { ... };
```

---

## 15. Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | June 2025 | Initial architecture document |

---

## 16. Glossary

| Term | Definition |
|------|------------|
| **DEK** | Data Encryption Key — per-user key that encrypts financial data |
| **KEK** | Key Encryption Key — master key that encrypts DEKs |
| **Envelope Encryption** | Pattern where KEK encrypts DEK, DEK encrypts data |
| **Engine Snapshot** | Cached EngineOutput stored for historical reference |
| **Effective Transaction** | Transaction after applying corrections and excluding deletes |
| **Hash Chain** | Linked list of SHA-256 hashes ensuring ledger integrity |
