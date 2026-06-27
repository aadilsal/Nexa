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
| **Phase 3** | Pending | AI explanations, Can I Buy This?, weekly reviews |
| **Phase 4** | Pending | Security hardening, CI/CD, deployment |

---

## Phase 2 — Complete

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
- **Auth:** Better Auth (email/password + Google OAuth ready)
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
