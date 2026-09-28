# Architecture

## Overview

Lubdiesel Commercial Hub is a **modular monolith** delivered as an **npm-workspaces monorepo**.
It favors simplicity and readability over premature abstraction, while keeping clear domain
boundaries so the system can grow (new channels, resellers, fleets, integrations) without a rewrite.

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  apps/web (Next.js)         │  HTTP  │  apps/api (NestJS)           │
│  Admin UI, App Router,      │ ─────► │  REST /api/v1, JWT auth,     │
│  Tailwind design tokens     │        │  Swagger /api/docs           │
└─────────────────────────────┘        └───────────────┬──────────────┘
                                                        │ Prisma
                                                ┌───────▼────────┐
                                                │  PostgreSQL    │
                                                └────────────────┘
        packages/shared — enums + API contracts, consumed by both apps
```

## Backend module layout

```
apps/api/src/
├── config/          Environment validation (class-validator) + typed configuration
├── database/        PrismaModule + PrismaService (global)
├── common/          Cross-cutting concerns
│   ├── decorators/  @Public, @Roles, @CurrentUser, @RawResponse
│   ├── guards/      JwtAuthGuard (global), RolesGuard (global)
│   ├── interceptors/TransformInterceptor ({ data } envelope)
│   ├── filters/     AllExceptionsFilter (consistent error body, Prisma mapping)
│   ├── security/    HashingService (bcrypt), token hashing util
│   ├── dto/         PaginationQueryDto
│   ├── utils/       Pagination helpers
│   └── types/       AuthenticatedUser
└── modules/
    ├── auth/        Login, refresh (rotation), logout, JWT strategy
    ├── users/       User CRUD (admin), /users/me
    └── health/      GET /health probe
```

Each domain module follows: `controllers/ services/ repositories/ dto/ (strategies/ types/ tests)`.

- **Controllers** receive the request, validate (DTOs), call a service, return a response. No business logic.
- **Services** contain business rules.
- **Repositories** encapsulate database access (Prisma).

## Cross-cutting behavior

- **Responses** are wrapped in `{ data }` by `TransformInterceptor`; paginated results keep `{ data, meta }`; monitoring endpoints opt out via `@RawResponse()`.
- **Errors** are normalized by `AllExceptionsFilter` into `{ statusCode, code, message, errors? }`, including Prisma error mapping (P2002 → 409, P2025 → 404, P2003 → 400).
- **Auth** uses global `JwtAuthGuard` (opt out with `@Public()`) and global `RolesGuard` (`@Roles(...)`).
- **Rate limiting** via global `ThrottlerGuard`; auth endpoints tighten limits with `@Throttle`.
- **Logging** via `nestjs-pino`, structured, with `authorization`, `cookie`, `password`, `refreshToken` redacted.

## Frontend

Next.js App Router with a `Sidebar + Topbar + Content` shell. The authenticated area lives under the
`(app)` route group with a client-side guard; `/login` is standalone. Design tokens (dark, premium,
industrial) are defined as CSS variables and Tailwind theme colors.

## Configuration & secrets

Environment variables are validated at bootstrap (`config/env.validation.ts`); the process fails fast
on misconfiguration. Secrets are never committed — only `.env.example` files are versioned.

## Architecture Decision Records (ADRs)

- **ADR-001** — Use a **modular monolith** instead of microservices. Rationale: small team, early stage,
  simpler operations and deployment; module boundaries keep future extraction possible.
- **ADR-002** — **npm workspaces monorepo** (`apps/*`, `packages/*`) rather than separate repos. Rationale:
  shared types/contracts, atomic changes, single CI.
- **ADR-003** — **Prisma + PostgreSQL**. Rationale: strong typing, migrations as the single source of truth,
  good DX. Full schema modeled up front; API surface delivered incrementally.
- **ADR-004** — **Inventory as movements** (`InventoryMovement`) rather than a mutable `quantity` column.
  Balance is derived from movements; an aggregated cache may be added later.
- **ADR-005** — **class-validator** for both request DTOs and environment validation, for consistency.
- **ADR-006** — **JWT access + refresh with rotation**; refresh tokens stored as SHA-256 hashes for
  revocation and reuse detection. OAuth is deferred.

## What is intentionally out of scope (MVP)

Microservices, Kafka, Kubernetes, GraphQL, mobile app, customer/reseller portals, AI/chatbot,
Mercado Livre / WhatsApp integrations, fiscal/ERP, loyalty. The architecture leaves room for these
without anticipating their complexity now.
