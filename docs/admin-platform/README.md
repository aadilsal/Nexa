# Nexa Admin Platform

Privacy-first internal operations platform. Admins operate on **operational data only** in the `nexa_analytics` database — never on encrypted financial records unless a user explicitly shares a temporary support snapshot.

## Architecture

- **Customer app:** `apps/web` — `/about`, `/contact`, `/support`, `/admin/*`
- **Analytics SDK:** `packages/analytics` — replaces PostHog
- **API modules:** `AnalyticsModule`, `SupportModule`, `AdminModule`
- **Databases:** Single Postgres instance, two DBs: `nexa` + `nexa_analytics`

## Admin routes

| Route | Purpose |
|-------|---------|
| `/admin` | Operations dashboard |
| `/admin/users` | User directory (counts only) |
| `/admin/analytics` | Feature usage, pages, funnels |
| `/admin/errors` | Error reports + slow endpoints |
| `/admin/support` | Support inbox + audited snapshots |
| `/admin/audit` | Admin audit logs |
| `/admin/health` | System health probes |

## RBAC

| Role | Admin | Support tickets | Snapshots | Analytics |
|------|-------|-----------------|-----------|-----------|
| USER | No | Own | Own | No |
| SUPPORT | Yes | Yes | Audited | No |
| OPERATIONS | Yes | No | No | Yes |
| ADMIN | Full | Yes | Audited | Yes |
| SUPER_ADMIN | Full | Full | Audited | Yes |

## MFA

- Required for `ADMIN` and `SUPER_ADMIN` by default
- Set `ADMIN_MFA_REQUIRED=true` to require MFA for all admin roles
- TOTP via authenticator app; session verified for 8 hours (Redis)

## Cron jobs

```bash
# Sync user directory from finance DB
curl -X POST http://localhost:4000/api/v1/admin/sync/user-directory \
  -H "x-cron-secret: $CRON_SECRET"

# Aggregate DAU/WAU/MAU
curl -X POST http://localhost:4000/api/v1/admin/aggregate/daily \
  -H "x-cron-secret: $CRON_SECRET"
```

## Privacy rules

Never stored in analytics DB or admin UI:

- Income, salary, expenses, amounts, categories, merchants
- Safe To Spend, Financial Health Score
- Goal names/amounts (only counts like `goalsCreated`)

## Support snapshots

1. User opts in when filing a **Bug** report
2. Encrypted payload stored for 72 hours
3. Admin views require reason + audit log entry
4. User can revoke anytime; user sees access history

## Environment

See root `.env.example` for `ANALYTICS_DATABASE_URL`, `ANALYTICS_USER_HASH_SALT`, `ANALYTICS_EVENT_SIGNING_SECRET`, `ADMIN_SEED_EMAIL`, `ADMIN_MFA_REQUIRED`.
