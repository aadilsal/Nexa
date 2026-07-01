# Nexa

Pakistan's AI-Powered Financial Decision Platform.

## Documentation

| Document | Description |
|----------|-------------|
| [Product Requirements Document](./docs/PRD.md) | What the product does |
| [Finance Engine Specification](./docs/finance-engine-spec.md) | Formulas, rules, v1.0.0 |
| [Technical Architecture](./docs/architecture.md) | System design, APIs, schema, security |

## Build Phases

| Phase | Status | Scope |
|-------|--------|-------|
| **Phase 0** | ✅ Complete | PRD, engine spec, architecture docs |
| **Phase 1** | ✅ Complete | Auth, onboarding, cycles, transactions, goals, dashboard shell |
| **Phase 2** | ✅ Complete | Finance Engine v1.0 — STS, health score, forecasting, variance |
| **Phase 3** | ✅ Complete | AI (Groq), Can I Buy This?, financial chat, weekly reviews + email, Redis |
| **Phase 4** | ✅ Complete | Auth hardening, profile, export/delete, PostHog, CI/CD, deployment |

---

---

## Phase 4 — Complete

Production hardening: auth upgrades, profile management, data export/deletion, analytics, and deploy pipeline.

### Auth (`apps/web`)

- Email/password with **email verification** on signup
- **Magic link** on login and signup (URLs logged to Next.js console in dev)
- **Passkeys** via `@better-auth/passkey`; dismissible prompt after first login
- Forgot/reset password with **session revocation** on reset
- Resend for transactional email

### Profile (`/profile`)

- Account name, email verification status, timezone, weekly email toggle
- **Security** — passkeys, password reset
- **Data & privacy** — JSON/CSV export (3/hour rate limit), 30-day account deletion grace
- **Activity** — audit log viewer

### API

- `GET/PATCH /users/me`, `PATCH /users/settings`
- `GET /export/json`, `GET /export/csv`
- `DELETE /account`, `POST /account/cancel-deletion`, `POST /account/purge-expired` (cron)
- `GET /audit-logs`
- Transaction recategorization (`PATCH /transactions/:id/category`)

### Frontend

- PostHog analytics (PRD events)
- Dashboard transaction recategorization
- Passkey prompt modal on first visit

### Deploy

- `docker/Dockerfile.api` for Render
- `.github/workflows/deploy.yml` — build + test on push to `main`

### Local email testing

With `RESEND_API_KEY` set, emails are sent to your inbox. In development, every auth URL is also printed in the **Next.js server terminal** — copy/paste into the browser on localhost.

---

## Phase 3 — Complete

AI layer, purchase simulation, financial chat, and weekly reviews.

### Engine (`packages/finance-engine`)

| Module | Responsibility |
|--------|----------------|
| `purchase-simulation.ts` | Can I Buy This? rules R1–R4 + `suggestedWaitUntil` |
| `weekly-review.ts` | Calendar week stats (Mon–Sun) |
| `goal-persistence.ts` | Cycle-end goal surplus waterfall |

### API

- `POST /simulations/purchase` — purchase simulation + AI explanation
- `GET /ai/insight` — dashboard insight
- `POST /ai/chat` — financial chat (engine-grounded)
- `GET /reviews/weekly` — in-app weekly review
- `POST /reviews/weekly/send` — cron endpoint for Resend emails
- Redis caching (engine output, rate limits)

### Frontend

- Parse preview → confirm → log flow
- Can I Buy This?, Weekly Review, Financial Chat pages
- Today's Insight on dashboard
- Motion animations + Sonner toasts
- Freelancer `preferredCycleStart` in onboarding

---

Full **Finance Engine v1.0** — the single source of truth for all financial numbers.

### Engine modules (`packages/finance-engine`)

| Module | Responsibility |
|--------|----------------|
| `parser.ts` | Natural language transaction parsing |
| `expenses.ts` | Cash position, predicted monthly expenses |
| `cycle.ts` | Cycle dates, days remaining |
| `goals.ts` | Priority waterfall, allocation, ETAs |
| `safe-to-spend.ts` | STS formula with ±15% trend adjustment |
| `health-score.ts` | Weighted 0–100 health score (5 factors) |
| `variance.ts` | Expected vs actual income and fixed expenses |
| `engine.ts` | `calculateEngineOutput()` — orchestrates everything |

### API

- `GET /dashboard` — full `EngineOutput` JSON
- `GET /dashboard/safe-to-spend` — STS only
- `GET /dashboard/health-score` — health score only
- `POST /transactions` — returns STS and health score diff on every log

### Dashboard UI

- **Safe To Spend Today** (flagship metric)
- **Financial Health Score** (0–100)
- Income, spent, projected savings with actual vs target rate
- Emergency fund progress with ETA
- Goal tracking with on-track / delayed status
- Variance analysis (expected vs actual fixed expenses)
- Post-log feedback with STS and health score changes

---

## Phase 1 — Complete

Monorepo scaffold with authentication, onboarding, financial cycles, transaction logging (immutable ledger), goals, and basic dashboard.

- **Monorepo:** Turborepo + pnpm (`apps/web`, `apps/api`, `packages/shared`, `packages/finance-engine`)
- **Auth:** Better Auth (email/password, magic link, passkeys — no Google OAuth)
- **Onboarding:** Income, expenses, variable spending, emergency fund auto-creation
- **Financial cycles:** Payday-to-payday with automatic rollover
- **Transactions:** Natural language parser (`Petrol 7550`), immutable hash-chained ledger
- **Goals:** CRUD with encrypted amounts, emergency fund support
- **Encryption:** Envelope encryption (KEK → DEK) for financial data

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local Postgres + Redis)

### Setup

```bash
pnpm install
cp .env.example .env
# Set BETTER_AUTH_SECRET and KEK in .env

docker compose -f docker/docker-compose.yml up -d
pnpm db:push
pnpm dev
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:4000/api/v1
- **Swagger:** http://localhost:4000/api/v1/docs

### Generate secrets (local dev)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Project Structure

```
nexa/
├── apps/
│   ├── web/                 # Next.js 15 frontend
│   └── api/                 # NestJS backend
├── packages/
│   ├── shared/              # Zod schemas, constants, types
│   └── finance-engine/      # Pure TS — Financial Intelligence Engine v1.0
├── docs/
└── docker/
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all packages |
| `pnpm test` | Run tests (engine tests are critical) |
| `pnpm db:push` | Push Prisma schema to database |
| `pnpm db:studio` | Open Prisma Studio |

## License

Proprietary. All rights reserved.
