# Nexa

Pakistan's AI-Powered Financial Decision Platform.

## Documentation

| Document | Description |
|----------|-------------|
| [Product Requirements Document](./docs/PRD.md) | What the product does |
| [Finance Engine Specification](./docs/finance-engine-spec.md) | Formulas, rules, v1.0.0 |
| [Technical Architecture](./docs/architecture.md) | System design, APIs, schema, security |

## Phase 1 — Complete

Monorepo scaffold with authentication, onboarding, financial cycles, transaction logging (immutable ledger), goals, and basic dashboard.

### What's included

- **Monorepo:** Turborepo + pnpm (`apps/web`, `apps/api`, `packages/shared`, `packages/finance-engine`)
- **Auth:** Better Auth (email/password + Google OAuth ready)
- **Onboarding:** Income, expenses, variable spending, emergency fund auto-creation
- **Financial cycles:** Payday-to-payday with automatic rollover
- **Transactions:** Natural language parser (`Petrol 7550`), immutable hash-chained ledger
- **Goals:** CRUD with encrypted amounts, emergency fund support
- **Dashboard:** Cash position, goals progress, transaction list, quick logging
- **Encryption:** Envelope encryption (KEK → DEK) for financial data
- **Engine:** Parser + cash position (STS & health score in Phase 2)

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local Postgres + Redis)

### Setup

```bash
# Clone and install
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env — set BETTER_AUTH_SECRET and KEK (see .env.example)

# Start database
docker compose -f docker/docker-compose.yml up -d

# Run migrations
pnpm db:push

# Start dev servers
pnpm dev
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:4000/api/v1
- **Swagger:** http://localhost:4000/api/v1/docs

### Generate secrets (local dev)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use output for both `KEK` and `BETTER_AUTH_SECRET` in `.env`.

## Project Structure

```
nexa/
├── apps/
│   ├── web/          # Next.js 15 frontend
│   └── api/          # NestJS backend
├── packages/
│   ├── shared/       # Zod schemas, constants, types
│   └── finance-engine/  # Pure TS financial calculations
├── docs/             # PRD, engine spec, architecture
└── docker/           # Local Postgres + Redis
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all packages |
| `pnpm test` | Run tests |
| `pnpm db:push` | Push Prisma schema to database |
| `pnpm db:studio` | Open Prisma Studio |

## Build Phases

- [x] **Phase 0:** Documentation
- [x] **Phase 1:** Auth, onboarding, cycles, transactions, goals, dashboard
- [ ] **Phase 2:** Safe To Spend, Financial Health Score, forecasting engine
- [ ] **Phase 3:** AI explanations, Can I Buy This?, weekly reviews
- [ ] **Phase 4:** Security hardening, CI/CD, deployment

## License

Proprietary. All rights reserved.
