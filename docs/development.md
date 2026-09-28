# Development

## Prerequisites

- Node.js 22 (`nvm use` reads [.nvmrc](../.nvmrc))
- npm 10+
- Docker (for PostgreSQL)

## First-time setup

```bash
npm install
npm run build:shared

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

docker compose up -d postgres
npm run prisma:generate -w @lubdiesel/api
npm run prisma:migrate  -w @lubdiesel/api
npm run db:seed         -w @lubdiesel/api
```

## Running

```bash
npm run dev        # API (3001) + web (3000)
npm run dev:api
npm run dev:web
```

> The API consumes `@lubdiesel/shared` from its built output. After changing files in
> `packages/shared`, rebuild it (`npm run build:shared`) or run `npm run dev -w @lubdiesel/shared`
> in watch mode.

## Project scripts (root)

| Script                | Description                                  |
| --------------------- | -------------------------------------------- |
| `npm run dev`         | Build shared, then run API + web concurrently |
| `npm run build`       | Build shared → api → web                      |
| `npm run lint`        | ESLint across workspaces                      |
| `npm run typecheck`   | `tsc --noEmit` across workspaces              |
| `npm run test`        | Unit tests                                    |
| `npm run format`      | Prettier write                                |

## Code standards

- **Naming:** Classes `PascalCase`, functions/variables `camelCase`, files `kebab-case`,
  database `snake_case`.
- **TypeScript:** `strict: true`. Avoid `any`.
- **Principles:** SOLID, KISS, DRY (without premature abstraction), separation of concerns,
  dependency injection, fail fast. Keep controllers free of business logic.
- **Validation:** class-validator DTOs at the boundary.

## Git workflow

Short-lived branches: `feature/...`, `fix/...`. Conventional commits enforced by commitlint:

```
feat: add reseller pipeline
fix: correct inventory balance
```

Husky runs `lint-staged` (Prettier) on staged files and validates the commit message.

## Adding an environment variable

1. Add it to `config/env.validation.ts` (with a validator).
2. Expose it via `config/configuration.ts`.
3. Document it in the relevant `.env.example`.

## Adding a new module (Entrega 2+)

```
src/modules/<domain>/
├── controllers/  <domain>.controller.ts
├── services/     <domain>.service.ts
├── repositories/ <domain>.repository.ts
├── dto/          create/update/query DTOs
├── tests/        unit tests
└── <domain>.module.ts
```

Register the module in `app.module.ts`, add validation, authorization (`@Roles`), a migration if the
schema changes, tests, and update docs. See the Definition of Done in the project spec.
