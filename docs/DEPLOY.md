# Deploy Nexa (100% free tier)

Target stack (already wired in CI):

| Service | Provider | Free tier | Hosts |
|---------|----------|-----------|--------|
| Web (Next.js + Better Auth) | [Vercel](https://vercel.com) | Hobby | `apps/web` |
| API (NestJS) | [Render](https://render.com) | Free web service | Docker `docker/Dockerfile.api` |
| PostgreSQL | [Neon](https://neon.tech) | Free | `nexa` + `nexa_analytics` DBs |
| Redis | [Upstash](https://upstash.com) | Free | Cache, rate limits, MFA |
| Email | [Resend](https://resend.com) | Free (100/day) | Transactional mail |
| AI | [Groq](https://groq.com) | Free tier | Explanations only |
| Cron | GitHub Actions | Free | `.github/workflows/cron.yml` |

---

## 0. Prerequisites

- GitHub repo pushed to `main`
- Local `.env` secrets generated (`KEK`, `BETTER_AUTH_SECRET`, salts — use `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

---

## 1. Neon (databases)

1. Create a Neon project (region: **Singapore** or closest to users).
2. Create two databases in the same project:
   - `nexa`
   - `nexa_analytics`
3. Copy connection strings → `DATABASE_URL` and `ANALYTICS_DATABASE_URL` (enable SSL).
4. From your machine (once):

```bash
DATABASE_URL="postgresql://..." ANALYTICS_DATABASE_URL="postgresql://..." pnpm db:push
```

---

## 2. Upstash (Redis)

1. Create a Redis database (free).
2. Copy the **Redis URL** → `REDIS_URL` (`rediss://` for TLS).

---

## 3. Render (API)

### Option A — Blueprint (recommended)

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** → connect repo.
2. Render reads `render.yaml` at repo root.
3. Set all `sync: false` env vars in the service dashboard.

### Option B — Manual Docker web service

- **Dockerfile:** `docker/Dockerfile.api`
- **Docker context:** `.` (repo root)
- **Health check path:** `/api/v1/health`
- **Plan:** Free

### Required env vars (Render)

```
DATABASE_URL=
ANALYTICS_DATABASE_URL=
REDIS_URL=
KEK=
BETTER_AUTH_SECRET=          # same value as Vercel
CORS_ORIGIN=https://YOUR-APP.vercel.app
CORS_ALLOW_LOCALHOST=true   # optional — local dev against production API
GROQ_API_KEY=
RESEND_API_KEY=
RESEND_FROM=Nexa <onboarding@yourdomain.com>
ANALYTICS_USER_HASH_SALT=
ANALYTICS_EVENT_SIGNING_SECRET=
CRON_SECRET=
ADMIN_SEED_EMAIL=            # optional
```

Render sets `PORT` automatically — the API listens on it.

Note: Free Render services **spin down after ~15 min idle** (cold starts ~30s).

4. Copy the public URL, e.g. `https://nexa-api.onrender.com`.
5. **Deploy hook:** Settings → Deploy Hook → add URL to GitHub secret `RENDER_DEPLOY_HOOK`.

---

## 4. Vercel (web)

1. [Vercel](https://vercel.com) → **Add New Project** → import GitHub repo.
2. **Root Directory:** `apps/web` (Vercel reads `apps/web/vercel.json` for monorepo install/build).
3. **Environment variables:**

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | Same Neon `nexa` URL (Better Auth) |
| `BETTER_AUTH_SECRET` | Same as Render |
| `BETTER_AUTH_URL` | `https://YOUR-APP.vercel.app` |
| `NEXT_PUBLIC_API_URL` | `https://nexa-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-APP.vercel.app` |
| `NEXT_PUBLIC_APP_VERSION` | `0.0.1` |
| `PASSKEY_RP_ID` | `YOUR-APP.vercel.app` (no `https://`) |
| `RESEND_API_KEY` | If sending auth emails from web |

4. Deploy. Vercel auto-redeploys on push to `main`.

---

## 5. GitHub Actions secrets

Repo → **Settings** → **Secrets** → **Actions**:

| Secret | Value |
|--------|--------|
| `RENDER_DEPLOY_HOOK` | Render deploy hook URL |
| `NEXT_PUBLIC_API_URL` | Production API URL |
| `NEXT_PUBLIC_APP_URL` | Production Vercel URL |
| `CRON_SECRET` | Random string (same as Render) |

Workflows: `ci.yml` (PR checks), `deploy.yml` (build + Render hook on `main`), `cron.yml` (scheduled jobs).

Update `cron.yml` API URL if not using a custom domain.

---

## 6. Post-deploy checklist

- [ ] Sign up at production URL
- [ ] `GET https://YOUR-API.onrender.com/api/v1/health` → `ok`
- [ ] `GET https://YOUR-API.onrender.com/api/v1/currencies` → live rates
- [ ] Login / session persists (cookies + `CORS_ORIGIN` match)
- [ ] Passkeys: `PASSKEY_RP_ID` matches Vercel hostname
- [ ] Resend: verify domain for production `RESEND_FROM`

---

## 7. Custom domain (optional)

- **Vercel:** add `app.yourdomain.com` → update `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `CORS_ORIGIN`, `PASSKEY_RP_ID`
- **Render:** add `api.yourdomain.com` → update `NEXT_PUBLIC_API_URL`

---

## Local vs production

| | Local | Production |
|---|--------|------------|
| Postgres/Redis | Docker Compose | Neon + Upstash |
| Web | `:3000` | Vercel |
| API | `:4000` | Render |
| Env file | Root `.env` only | Platform dashboards |

Do **not** commit `.env`. Use platform secret stores only.
