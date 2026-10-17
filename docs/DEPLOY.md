# Deploy & operations

## Frontend: Vercel

Two Vercel projects build from `main` (root `apps/web`, build command in `apps/web/vercel.json`):

- `web` → https://web-theta-lyart-46.vercel.app
- `nexa-web` → www.nexafin.xyz

Production env vars: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL` (see ENV.md). Changing them needs a redeploy because they are baked in at build time.

## Backend: self-hosted Convex on the Oracle VM

- VM: Oracle Cloud Always Free (x86, 1 GB RAM + 2 GB swap), public IP `51.170.90.86`, user `ubuntu`. It also runs jobkit, Ajaia Docs and Bloom.
- Nexa lives in `/opt/nexa-convex` (`docker-compose.yml`, `.env` with `INSTANCE_SECRET`, `backup.sh`, `README.txt`). Container `nexa-convex`, memory-capped at 512 MB, no host ports published.
- HTTPS is provided by jobkit's Caddy (`~/jobkit/Caddyfile`), which proxies:
  - `nexa-api.51-170-90-86.sslip.io` → `nexa-convex:3210` (client + CLI)
  - `nexa-site.51-170-90-86.sslip.io` → `nexa-convex:3211` (HTTP actions, e.g. `/ingest`)

### Deploy backend changes

```bash
cd apps/web
npx convex deploy          # reads CONVEX_SELF_HOSTED_URL / _ADMIN_KEY from .env.local
npx convex env list        # server env vars (KEK, VAPID_*, ANTHROPIC_API_KEY)
```

New admin key if needed: `ssh ubuntu@51.170.90.86 'sudo docker exec nexa-convex ./generate_admin_key.sh'`.

### On the VM

```bash
cd /opt/nexa-convex
sudo docker logs -f nexa-convex                       # logs
sudo docker compose pull && sudo docker compose up -d # update Convex
```

### Backups & restore

- Nightly at 03:30 PKT (`/etc/cron.d/nexa-backup` → `backup.sh`): stops the backend for a few seconds, archives the data volume to `/opt/nexa-convex/backups/nexa-YYYYMMDD-HHMM.tgz`, keeps 14.
- Restore steps are in `/opt/nexa-convex/README.txt`.
- The archives are useless without `KEK`; keep a copy of it somewhere safe off the VM (password manager). Get it with `npx convex env get KEK`.
- Off-VM copy (recommended now and then): `scp ubuntu@51.170.90.86:/opt/nexa-convex/backups/<file>.tgz .`

## Bank alert import

- Endpoint: `https://nexa-site.51-170-90-86.sslip.io/ingest` with header `Authorization: Bearer <import token>` (token from Settings → Auto-import).
- iPhone Shortcut and Gmail Apps Script setup instructions are on that page.

## Yearly tax rates

A Claude cloud routine ("Nexa: yearly Pakistan tax rates update", runs 2/5 July and 2/5 August) adds the new Finance Act's rates to `packages/finance-engine/src/tax.ts` with tests and commits to `main`. After it runs, redeploy the backend (`npx convex deploy`) so server-side reminders see the new rates.

## CI

GitHub Actions (`.github/workflows/ci.yml`) builds the packages, runs the engine tests and builds the web app on every push to `main`.
