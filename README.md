# Nexa

A personal finance app for one person: track every rupee, see what's safe to spend today, and save towards goals. It is a private, single-owner tool, not a SaaS product: there is no signup, no other users and no analytics.

## What it does

- **Home**: safe-to-spend today, cash on hand, this cycle's income / spending / savings rate, top categories this month, goals and recent transactions.
- **Activity**: month or year view with spending trend, category breakdown and every transaction grouped by day (tap a category icon to recategorise).
- **Add**: type `Lunch 850`, `Salary 150000` or `Lent Ali 5000`; the category and direction are worked out for you.
- **Auto-import**: bank and wallet alerts (Meezan, ABL, NayaPay and generic formats) are logged automatically from iPhone SMS (Shortcuts automation) and Gmail (Apps Script). OTPs, promos and transfers between your own accounts are skipped; the same payment arriving by SMS and email is logged once.
- **Plan**:
  - Budgets per category with push alerts at 80% and 100%
  - Subscriptions detected from repeating charges
  - Lent & borrowed: money to/from people changes cash but never counts as spending or income
  - Goals and emergency fund
  - Zakat (Hanafi) calculated from your balance, loans and daily gold/silver prices
  - Pakistan income tax estimate (salaried, non-salaried, section 154A IT exports) from logged income
- **Push notifications** (home-screen app): each imported transaction, budget alerts, bills due tomorrow, Zakat date, new-tax-year rate warnings.
- **Cycles** run payday to payday and roll over automatically, carrying the ending balance forward.
- Installable as a **PWA** on iPhone (Share → Add to Home Screen).

## How it runs

| Part | Where | Notes |
|---|---|---|
| Web app (Next.js 15) | Vercel, free tier | Projects `web` (web-theta-lyart-46.vercel.app) and `nexa-web` |
| Backend (Convex, self-hosted) | Oracle Cloud Always Free VM | Docker in `/opt/nexa-convex`, behind the VM's Caddy at `nexa-api.51-170-90-86.sslip.io` and `nexa-site.51-170-90-86.sslip.io` |
| Backups | Same VM | Nightly 03:30 PKT, 14 kept in `/opt/nexa-convex/backups` |
| Tax rates | Yearly cloud routine | Adds each new Finance Act's rates to `packages/finance-engine/src/tax.ts` every July |

Login is a single owner using an authenticator app code (TOTP); sessions last 90 days and renew on each visit. Financial amounts are encrypted at rest (AES-256-GCM, key-encryption key held as a Convex env var).

See [docs/architecture.md](docs/architecture.md), [docs/DEPLOY.md](docs/DEPLOY.md) and [docs/ENV.md](docs/ENV.md).

## Repo layout

```
apps/web/                  Next.js app (pages, components) + convex/ (backend functions and schema)
packages/finance-engine/   Pure, tested money maths: safe-to-spend, cycles, bank-message parser,
                           loans, subscriptions, spending pace, Zakat, Pakistan income tax
packages/shared/           Categories, currencies, shared types and schemas
docs/                      Architecture, deploy and env notes, engine specs
```

## Local development

Requires Node 22+ and pnpm 9.

```bash
pnpm install
pnpm --filter @nexa/shared build && pnpm --filter @nexa/finance-engine build
cd apps/web
# .env.local (git-ignored) must point the CLI at the backend, see docs/ENV.md
pnpm dev            # http://localhost:3000
```

Tests: `pnpm --filter @nexa/finance-engine test`

## Deploying changes

- **Frontend**: push to `main`; both Vercel projects rebuild.
- **Backend functions/schema**: `cd apps/web && npx convex deploy` (uses `.env.local`).

Details, VM operations and restore steps are in [docs/DEPLOY.md](docs/DEPLOY.md).
