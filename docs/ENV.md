# Environment variables

## Web app (Vercel project env, and `apps/web/.env.local` for local dev)

| Name | Example | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | `https://nexa-api.51-170-90-86.sslip.io` | Convex client/API URL (no trailing slash). Build fails without it. |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | `https://nexa-site.51-170-90-86.sslip.io` | Convex HTTP actions URL, used to show the auto-import endpoint |

## Convex CLI (`apps/web/.env.local`, git-ignored)

| Name | Purpose |
|---|---|
| `CONVEX_SELF_HOSTED_URL` | `https://nexa-api.51-170-90-86.sslip.io` |
| `CONVEX_SELF_HOSTED_ADMIN_KEY` | Admin key from `generate_admin_key.sh` on the VM. Secret. |

## Convex server env (`npx convex env set NAME value`)

| Name | Purpose |
|---|---|
| `KEK` | 64-hex key-encryption key that unlocks all stored amounts. Secret; back it up off the VM. |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push keys. Changing them invalidates existing device subscriptions. |
| `ANTHROPIC_API_KEY` | Optional; only used if AI features are called. |

## VM (`/opt/nexa-convex/.env`)

| Name | Purpose |
|---|---|
| `INSTANCE_SECRET` | Convex instance secret (admin keys are derived from it). Generated on first setup. |
