# Environment variables

**Single file:** copy `.env.example` to `.env` at the **repo root** only.

Do not add `.env` under `apps/api`, `apps/web`, or other packages — Prisma, NestJS, and Next.js are configured to read the root file.

Both `apps/api` and `apps/web` load it automatically when you run `pnpm dev`, `pnpm db:push`, etc.

## Required for local development

| Variable | Used by | Description |
|----------|---------|-------------|
| `DATABASE_URL` | API, Web (Better Auth) | PostgreSQL connection for finance DB (`nexa`) |
| `ANALYTICS_DATABASE_URL` | API | PostgreSQL connection for analytics/admin DB (`nexa_analytics`) |
| `REDIS_URL` | API | Redis for cache, rate limits, MFA sessions |
| `KEK` | API | 32-byte hex key-encryption-key for envelope encryption |
| `BETTER_AUTH_SECRET` | Web | Session signing secret (min 32 chars) |
| `BETTER_AUTH_URL` | Web | Public URL of the web app (e.g. `http://localhost:3000`) |

## Auth & security

| Variable | Default | Description |
|----------|---------|-------------|
| `PASSKEY_RP_ID` | `localhost` | WebAuthn relying party ID (use your domain in production) |
| `ADMIN_SEED_EMAIL` | — | Email of user to promote to `SUPER_ADMIN` on API startup |
| `ADMIN_MFA_REQUIRED` | `false` | Set `true` to require TOTP for all admin roles |
| `CRON_SECRET` | — | Shared secret for cron endpoints (`x-cron-secret` header) |

## Analytics (privacy-first, self-hosted)

| Variable | Description |
|----------|-------------|
| `ANALYTICS_USER_HASH_SALT` | Salt for one-way user ID hashing in analytics DB |
| `ANALYTICS_EVENT_SIGNING_SECRET` | HMAC key for signed event batches from the web SDK |
| `NEXT_PUBLIC_APP_VERSION` | App version sent with analytics events |

PostHog is **not** used. Events flow through `@nexa/analytics` → `POST /api/v1/analytics/events/batch`.

## AI & email

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq API key for AI explanations (optional in dev) |
| `GROQ_MODEL` | Model id (default: `llama-3.3-70b-versatile`) |
| `RESEND_API_KEY` | Resend API key for transactional + weekly review emails |
| `RESEND_FROM` | From address for outbound email |

## Server URLs

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | `4000` | NestJS listen port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed browser origin for API cookies |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` | API base URL for the web client |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public web app URL |

## Cron jobs (GitHub Actions)

Scheduled in `.github/workflows/cron.yml` when `CRON_SECRET` is set:

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `POST /api/v1/reviews/weekly/send` | Mon 08:00 UTC | Weekly review emails |
| `POST /api/v1/account/purge-expired` | Daily 03:00 UTC | Soft-deleted account purge |
| `POST /api/v1/admin/sync/user-directory` | Daily 04:00 UTC | Sync user directory to analytics DB |
| `POST /api/v1/admin/aggregate/daily` | Daily 04:30 UTC | DAU/WAU/MAU metrics |

All cron calls require header: `x-cron-secret: $CRON_SECRET`.

## Rate limits

| Endpoint | Limit | Scope |
|----------|-------|-------|
| Auth sign-in/sign-up | 5/min | IP (Next.js middleware) |
| Transactions create | 120/min | User |
| Dashboard reads | 60/min | User |
| AI chat | 30/min | User |
| Simulations | 60/min | User |
| Data export | 5/hour | User |

## Production secrets (GitHub Actions)

| Secret | Purpose |
|--------|---------|
| `RENDER_DEPLOY_HOOK` | Trigger API deploy on Render |
| `NEXT_PUBLIC_API_URL` | Build-time API URL for web |
| `NEXT_PUBLIC_APP_URL` | Build-time app URL for web |
| `CRON_SECRET` | Cron workflow authentication |

## Google OAuth

**Not enabled.** Auth is email/password, magic link, and passkeys only.
