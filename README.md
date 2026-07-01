# Nexa

**AI Financial Intelligence for Pakistan**

Nexa is a privacy-first financial decision platform built for Pakistanis. It helps you answer one question every day:

> **Can I afford this while staying on track toward my goals?**

Expense logging is how Nexa learns — the product is **intelligent guidance**: Safe To Spend™, purchase simulations, goal tracking, and AI insights grounded in your real numbers.

---

## Vision

Become the first app people open whenever they make a financial decision — not because they enjoy tracking expenses, but because they trust Nexa to guide them.

**Mission:** Help Pakistanis make smarter financial decisions by turning every expense into meaningful, actionable guidance.

---

## What Nexa Is — and Isn't

| Nexa is | Nexa is not |
|---------|-------------|
| A financial **decision** platform | A generic expense tracker |
| Engine-driven guidance (PKR, payday cycles, goals) | A budgeting spreadsheet with charts |
| Privacy-first — encrypted data, no bank linking required | A bank aggregator or wallet |
| AI that **explains** your numbers | AI that guesses or calculates independently |

Most finance apps answer **"What happened?"** Nexa answers **"What should I do next?"**

---

## How Nexa Is Different

**1. Safe To Spend™ — not "remaining budget"**

Instead of showing how much you've spent, Nexa calculates how much you can safely spend *today* without hurting savings, your emergency fund, or goal timelines. Every expense log updates this number instantly.

**2. Finance Engine as single source of truth**

All financial numbers — dashboard, weekly reviews, purchase simulations, AI chat, emails — come from one pure TypeScript engine (`packages/finance-engine`). No duplicated formulas across frontend and backend. No AI hallucinating amounts.

**3. Can I Buy This? — decisions before regret**

Simulate any purchase before you make it. Nexa shows impact on goals, savings rate, and emergency fund — with a clear GO AHEAD or WAIT recommendation and a suggested wait date if needed.

**4. Built for how Pakistan actually works**

PKR-native. Payday-to-payday cycles (salaried or freelancer). Charity tracking. English UI. No dependency on bank APIs or international fintech assumptions.

**5. Privacy by architecture**

Envelope encryption for financial data. Immutable hash-chained ledger. Audit logs. Data export and 30-day grace account deletion. Passkeys, magic links, and session revocation on password reset.

**6. Five-second logging**

Type `Petrol 7550` — preview, confirm, done. Category, amount, and type detected automatically. Immediate feedback on Safe To Spend and health score changes.

---

## What's Built (MVP)

The full MVP is implemented across four phases:

| Capability | Highlights |
|------------|------------|
| **Onboarding** | Income, fixed expenses, variable estimate, goals, emergency fund — under 5 minutes |
| **Dashboard** | Safe To Spend™, Financial Health Score (0–100), goal ETAs, variance analysis, today's AI insight |
| **Transactions** | Natural language parser, immutable ledger, recategorization, post-log STS/health feedback |
| **Goals** | Priority waterfall, emergency fund, encrypted amounts, on-track / delayed status |
| **Can I Buy This?** | Purchase simulation with rules R1–R4 and AI explanation |
| **Financial Chat** | Groq-powered Q&A grounded in engine output — read-only, no invented numbers |
| **Weekly Review** | In-app review + automated email (React Email design system) |
| **Profile & Security** | Passkeys, magic link auth, email verification, export (JSON/CSV), account deletion |
| **Emails** | 36 transactional templates via `@nexa/emails` (React Email + Resend) |
| **Analytics** | PostHog event tracking across core user actions |
| **Deploy** | Docker API image, GitHub Actions CI, Vercel + Render + Neon target stack |

---

## Core Philosophy

Nexa never asks: *"How much did you spend?"*

Nexa asks: *"How does this expense affect your future?"*

Every feature, screen, and email follows this mindset — calm, trustworthy, minimal. No casino energy. No crypto hype.

---

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌─────────────────────┐
│  Next.js 15  │────▶│  NestJS API  │────▶│  Finance Engine     │
│  (Vercel)    │     │  (Render)    │     │  v1.0 — Pure TS     │
└──────────────┘     └──────┬───────┘     └─────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
         PostgreSQL      Redis         Groq
         (Neon)       (cache/rate)   (explains only)
```

**Design principles**

- **Engine-first** — One calculation layer; AI never computes financial numbers
- **Monorepo** — Shared types, Zod schemas, and engine across web and API
- **Security by default** — Encryption, immutable ledger, audit trail, rate limits
- **Production-grade** — API versioning, Swagger, CI/CD, structured email system

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind v4, TanStack Query, Motion |
| Backend | NestJS, Prisma, PostgreSQL (Neon) |
| Auth | Better Auth — email/password, magic link, passkeys |
| AI | Groq (Llama 3.3) — explanation layer only |
| Cache | Redis |
| Email | Resend + `@nexa/emails` (React Email) |
| Analytics | PostHog |
| Monorepo | Turborepo + pnpm |

---

## Project Structure

```
nexa/
├── apps/
│   ├── web/                    # Next.js frontend
│   └── api/                    # NestJS backend + Prisma
├── packages/
│   ├── finance-engine/         # Financial Intelligence Engine v1.0
│   ├── shared/                 # Zod schemas, constants, types
│   └── emails/                 # Transactional email design system
├── docs/                       # PRD, engine spec, architecture
├── docker/                     # Compose + API Dockerfile
└── .github/workflows/          # CI/CD
```

---

## Quick Start

### Prerequisites

- Node.js 22+ (CI uses Node 24)
- pnpm 9+
- Docker (Postgres + Redis)

### Setup

```bash
pnpm install
cp .env.example .env
# Set BETTER_AUTH_SECRET and KEK in .env

docker compose -f docker/docker-compose.yml up -d
pnpm db:push
pnpm dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000/api/v1 |
| Swagger | http://localhost:4000/api/v1/docs |
| Email preview | `pnpm --filter @nexa/emails preview` |

Generate local secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Product Requirements Document](./docs/PRD.md) | Product vision, features, user stories |
| [Finance Engine Specification](./docs/finance-engine-spec.md) | Formulas, rules, engine v1.0.0 |
| [Technical Architecture](./docs/architecture.md) | System design, APIs, schema, security |

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all packages |
| `pnpm test` | Run tests (finance-engine tests are critical) |
| `pnpm db:push` | Push Prisma schema to database |
| `pnpm db:studio` | Open Prisma Studio |

---

## Target Audience

Salaried professionals, freelancers, and young professionals in Pakistan earning PKR 50,000–500,000/month — people who want clarity on spending decisions without connecting their bank account or learning spreadsheet budgeting.

---

## License

Proprietary. All rights reserved.
