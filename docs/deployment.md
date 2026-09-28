# Deployment

> The MVP targets a simple, single-host deployment. The architecture leaves room for scaling later
> without a rewrite.

## Build artifacts

```bash
npm ci
npm run build         # shared → api → web
```

- API output: `apps/api/dist` (run with `node apps/api/dist/main.js`).
- Web output: `apps/web/.next` (run with `next start`).

## Environment

Provide production environment variables (never commit them). Minimum for the API:

```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/lubdiesel?schema=public
JWT_SECRET=...            # strong, >= 32 chars
JWT_REFRESH_SECRET=...    # strong, >= 32 chars, different from JWT_SECRET
FRONTEND_URL=https://hub.lubdiesel.com.br
LOG_LEVEL=info
```

For the web app: `NEXT_PUBLIC_API_URL=https://api.lubdiesel.com.br/api/v1`.

## Database migrations

Apply migrations as a release step (never manual SQL):

```bash
npm run prisma:deploy -w @lubdiesel/api   # prisma migrate deploy
npm run db:seed       -w @lubdiesel/api   # first deploy only
```

## Docker

PostgreSQL only (recommended: run the apps with a process manager):

```bash
docker compose up -d postgres
```

Full stack in containers:

```bash
docker compose --profile apps up --build
# api → :3001, web → :3000, postgres → :5432
```

Images are multi-stage (`apps/api/Dockerfile`, `apps/web/Dockerfile`). Run `prisma migrate deploy`
against the database before or on first start of the API container.

## Health & observability

- Liveness/readiness: `GET /health` (includes a database ping).
- Structured logs via Pino; ship stdout to your log aggregator.
- Future: add `database`, `redis`, and external-integration checks to the health payload.

## Hardening checklist

- [ ] Strong, unique `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] `FRONTEND_URL` restricted to the real origin (CORS)
- [ ] HTTPS termination in front of the API and web
- [ ] Database backups configured
- [ ] Secrets provided via the platform's secret manager, not files
