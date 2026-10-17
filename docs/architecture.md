# Architecture

Nexa is a single-owner personal finance app. Three pieces:

```
iPhone / browser (PWA) ──HTTPS──▶ Vercel: Next.js app (apps/web)
        │                                   │ WebSocket (Convex client)
        │                                   ▼
        │                 Oracle VM: Caddy ──▶ Convex backend (Docker, /opt/nexa-convex)
        │                                         ├─ SQLite data volume (nightly backup)
iPhone Shortcut / Gmail Apps Script ──POST /ingest──┘  ├─ crons (reminders, FX, metal prices)
                                                       └─ web-push → Apple/Google push
```

## Frontend (apps/web)

- Next.js 15 App Router, React 19, Tailwind v4, one light theme, mobile-first with a bottom tab bar (Home, Activity, Add, Plan, Settings).
- Talks to Convex directly with the Convex React client (`lib/convex-client.ts`). There is no other API.
- Session token (from the TOTP login) is kept in `localStorage` and passed to every authenticated Convex function.
- `public/sw.js` handles push notifications only (no offline caching).

## Backend (apps/web/convex)

| Module | Purpose |
|---|---|
| `auth.ts`, `lib/session.ts` | TOTP-only login, recovery codes, rolling 90-day sessions (only token hashes stored) |
| `ledger.ts`, `transactions.ts` | Append-only, hash-chained, encrypted transaction ledger per cycle |
| `cycles.ts` | Payday cycles; expired cycles roll over automatically with the ending balance |
| `engine.ts`, `dashboard.ts`, `reports.ts` | Load data, call `@nexa/finance-engine`, return dashboard and report views |
| `ingest.ts`, `http.ts` | `POST /ingest` for bank alerts (bearer token), dedupe, auto-log, push |
| `planning.ts` | Budgets + alerts, subscriptions, loans, pace, Zakat and tax data, daily reminders |
| `push.ts`, `pushNode.ts` | Web Push subscriptions and delivery (VAPID) |
| `metals.ts`, `currencies.ts` | Daily gold/silver spot prices; FX rates |
| `crons.ts` | Rate-limit cleanup, FX refresh, metal prices, daily 9am PKT reminders |

### Encryption

Amounts and transaction payloads are encrypted with AES-256-GCM using a data key (DEK) stored wrapped by the `KEK` env var. Losing `KEK` makes the data unreadable, so it is backed up alongside the data (see DEPLOY.md).

### AI

`lib/claude.ts` (Anthropic API, cached) exists but nothing in the UI calls it automatically; the app makes no AI calls by default.

## finance-engine (packages/finance-engine)

Pure TypeScript, no I/O, fully unit-tested: safe-to-spend, health score, cycles, goals, bank-message parser, loans, recurring-charge detection, spending pace, Zakat (Hanafi) and Pakistan income tax (one rate table per tax year in `tax.ts`). Specs: [finance-engine-spec.md](finance-engine-spec.md), [algorithms-decision-engine-spec.md](algorithms-decision-engine-spec.md).
