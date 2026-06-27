# Nexa

Pakistan's AI-Powered Financial Decision Platform.

## Documentation

All product and engineering decisions are documented before code:

| Document | Description |
|----------|-------------|
| [Product Requirements Document](./docs/PRD.md) | What the product does — features, user journeys, success metrics |
| [Finance Engine Specification](./docs/finance-engine-spec.md) | Every formula, rule, and decision — v1.0.0 |
| [Technical Architecture](./docs/architecture.md) | System design, APIs, database schema, security, deployment |

## Build Order

1. **Phase 0:** Documentation ✅
2. **Phase 1:** Monorepo scaffold, auth, onboarding, cycles, transactions, goals
3. **Phase 2:** Finance Engine v1.0, dashboard, STS, health score
4. **Phase 3:** AI explanations, Can I Buy This?, weekly reviews
5. **Phase 4:** Security hardening, encryption, CI/CD, deployment

## Tech Stack

- **Frontend:** Next.js 19, React 19, Tailwind v4, shadcn/ui
- **Backend:** NestJS, Prisma, Better Auth
- **Database:** Neon PostgreSQL
- **Cache:** Upstash Redis
- **AI:** Groq (explanations only)
- **Monorepo:** Turborepo + pnpm

## License

Proprietary. All rights reserved.
