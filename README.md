# Lubdiesel Commercial Hub

Internal commercial operations platform for **Lubdiesel** — centralizing leads, contacts, companies, resellers, the sales pipeline, follow-ups, products, inventory, orders and basic commercial metrics.

The goal is to turn an informal network (WhatsApp, Toyocenter, Instagram, Mercado Livre, personal network, resellers) into a structured, measurable commercial process:

```
Acquisition → CRM → Negotiation → Sale → Inventory → Data → Repurchase
```

## Objective

By the end of the MVP the company can quickly answer: how many leads/clients/resellers do we have, which stage is each opportunity in, which follow-ups are due, how many sales were made, from which channel, which product sells most, how much stock is left, and why leads are lost.

## Architecture

A **modular monolith** (no microservices) built as an **npm-workspaces monorepo**:

```
lubdiesel-commercial-hub/
├── apps/
│   ├── api/     NestJS API (modular monolith, Prisma, PostgreSQL)
│   └── web/     Next.js admin frontend (App Router, Tailwind)
├── packages/
│   └── shared/  Shared enums and API contracts (TypeScript)
├── docs/        Architecture, database, API, development, deployment, testing
└── docker-compose.yml
```

See [docs/architecture.md](docs/architecture.md) for details and ADRs.

## Technologies

| Layer      | Stack                                                             |
| ---------- | ---------------------------------------------------------------- |
| Backend    | Node.js 22, TypeScript, NestJS 11, Prisma, PostgreSQL            |
| Frontend   | Next.js 15, React 19, TypeScript, Tailwind CSS                   |
| Validation | class-validator + class-transformer                              |
| Auth       | JWT (access + refresh, rotation), bcryptjs password hashing      |
| Logging    | Pino (nestjs-pino), structured, secrets redacted                 |
| Security   | Helmet, configurable CORS, @nestjs/throttler rate limiting       |
| Docs       | Swagger / OpenAPI at `/api/docs`                                  |
| Tests      | Jest + Supertest (unit + e2e)                                    |
| Quality    | ESLint, Prettier, Husky, lint-staged, commitlint                |
| CI         | GitHub Actions (npm ci → lint → typecheck → test → build → e2e)  |

## Prerequisites

- Node.js `>= 20.11` (repo targets Node 22 — see [.nvmrc](.nvmrc))
- npm 10+
- Docker (for PostgreSQL, or a locally installed PostgreSQL 16)

## Installation

```bash
npm install
npm run build:shared          # build the shared package consumed by both apps
```

## Configuration / Environment variables

Copy the examples and adjust values:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Key API variables (full list in [apps/api/.env.example](apps/api/.env.example)):

| Variable                                     | Description                          |
| -------------------------------------------- | ------------------------------------ |
| `DATABASE_URL`                               | PostgreSQL connection string         |
| `JWT_SECRET` / `JWT_REFRESH_SECRET`          | Token signing secrets (min 16 chars) |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN`  | Token lifetimes                      |
| `FRONTEND_URL`                               | Allowed CORS origin                  |
| `THROTTLE_TTL` / `THROTTLE_LIMIT`            | Rate limiting window/limit           |

Every new variable must be added to the relevant `.env.example`.

## Database, migrations & seeds

```bash
# Start PostgreSQL
docker compose up -d postgres

# From apps/api (or use -w @lubdiesel/api)
npm run prisma:generate -w @lubdiesel/api   # generate Prisma client
npm run prisma:migrate  -w @lubdiesel/api   # create/apply dev migration
npm run db:seed         -w @lubdiesel/api   # admin user + initial products
```

The seed creates the initial **admin user** (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`) and the two initial products `LUB-060` and `LUB-1000`. See [docs/database.md](docs/database.md).

## Running

```bash
npm run dev            # builds shared, then runs API (3001) + web (3000)
# or individually
npm run dev:api        # http://localhost:3001  (docs: /api/docs)
npm run dev:web        # http://localhost:3000
```

Health check: `GET http://localhost:3001/health` → `{ "status": "ok", ... }`.

## Testing

```bash
npm run test                       # unit tests (all workspaces)
npm run test:e2e -w @lubdiesel/api # e2e (requires PostgreSQL + seed)
```

More in [docs/testing.md](docs/testing.md).

## Lint & format

```bash
npm run lint          # ESLint across workspaces
npm run format        # Prettier write
npm run typecheck     # tsc --noEmit across workspaces
```

## Build

```bash
npm run build         # shared → api → web
```

## Deploy

See [docs/deployment.md](docs/deployment.md). Docker images are provided for both apps
(`docker compose --profile apps up --build`).

## Deliveries roadmap

- **Entrega 1 (done):** Monorepo, API foundation (auth, users, health, Swagger), full DB schema, web shell (login + dashboard), Docker, CI, docs.
- **Entrega 2 (done):** Contacts, Companies, Leads, Pipeline, Interactions, Follow-ups — functional CRM API.
- **Entrega 3:** Products, Inventory, Orders, Order Items.
- **Entrega 4:** Dashboard metrics, filters, lead origin & loss analytics.

## License

UNLICENSED — internal Lubdiesel project.
