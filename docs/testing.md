# Testing

Testing uses **Jest** (unit) and **Jest + Supertest** (e2e). Coverage focuses on domain rules and
critical flows rather than an artificial 100%.

## Strategy

| Level        | Scope                                             | Location                          |
| ------------ | ------------------------------------------------- | --------------------------------- |
| Unit         | Business rules (services), isolated with mocks    | `apps/api/src/**/*.spec.ts`       |
| Integration  | service + repository + database (Entrega 2+)       | `apps/api/src/**/*.spec.ts`       |
| E2E          | Critical HTTP flows against a real app + database  | `apps/api/test/*.e2e-spec.ts`     |

## Running

```bash
npm run test                          # unit (all workspaces)
npm run test:cov  -w @lubdiesel/api   # unit with coverage
npm run test:e2e  -w @lubdiesel/api   # e2e (needs PostgreSQL + seed)
```

E2E prerequisites:

```bash
docker compose up -d postgres
npm run prisma:deploy -w @lubdiesel/api
npm run db:seed       -w @lubdiesel/api
```

## Current coverage (Entrega 1)

- **Unit:** `AuthService` (login success/failure, inactive user, refresh rotation, invalid refresh),
  `UsersService` (create, duplicate email, not-found, soft delete).
- **E2E:** health probe, protected route without token (401), full login → protected route → refresh
  flow, invalid credentials (401).

## Critical flows to cover as modules land

- **Auth:** login, refresh token, protected route. _(covered)_
- **Lead:** create contact → create lead → change stage → create follow-up → convert. _(Entrega 2)_
- **Sale:** create order → add product → complete order → generate inventory movement → validate
  balance. _(Entrega 3)_

## Guidelines

- Target **70%+** on important domain rules; higher on critical flows.
- Prefer testing behavior through the public service/HTTP surface.
- Keep e2e deterministic (seeded data, isolated test database).
