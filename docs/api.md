# API

REST, versioned under `/api/v1`. Interactive documentation (Swagger / OpenAPI) is available at
`/api/docs` when the API is running.

Base URL (dev): `http://localhost:3001`

## Response format

Single resource:

```json
{ "data": {} }
```

List (paginated):

```json
{
  "data": [],
  "meta": { "page": 1, "pageSize": 20, "total": 100, "totalPages": 5 }
}
```

Error:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": [{ "field": "", "message": "email must be an email" }]
}
```

## Authentication

JWT with access + refresh tokens. Send the access token as `Authorization: Bearer <token>`.
Refresh tokens are single-use (rotation) and stored hashed server-side.

| Method | Path                | Auth   | Description                              |
| ------ | ------------------- | ------ | ---------------------------------------- |
| POST   | `/api/v1/auth/login`   | Public | Authenticate, returns tokens + user   |
| POST   | `/api/v1/auth/refresh` | Public | Exchange a refresh token for a new pair |
| POST   | `/api/v1/auth/logout`  | Bearer | Revoke all refresh tokens for the user  |

Rate limiting: `login` is limited to 5 requests/60s, `refresh` to 10/60s.

## Users

| Method | Path                | Auth        | Description                 |
| ------ | ------------------- | ----------- | --------------------------- |
| GET    | `/api/v1/users/me`  | Bearer      | Current authenticated user  |
| POST   | `/api/v1/users`     | Bearer ADMIN| Create a user               |
| GET    | `/api/v1/users`     | Bearer ADMIN| List users (paginated)      |
| GET    | `/api/v1/users/:id` | Bearer ADMIN| Get a user by id            |
| PATCH  | `/api/v1/users/:id` | Bearer ADMIN| Update a user               |
| DELETE | `/api/v1/users/:id` | Bearer ADMIN| Soft-delete a user          |

## Health

| Method | Path      | Auth   | Description                              |
| ------ | --------- | ------ | ---------------------------------------- |
| GET    | `/health` | Public | Liveness/readiness — `{ "status": "ok" }` |

`/health` is intentionally outside the `/api/v1` prefix and the `{ data }` envelope.

## Pagination, sorting & search

List endpoints accept: `page`, `pageSize` (max 100), `search`, `sortBy`, `sortOrder` (`asc`/`desc`).

## Planned endpoints (Entrega 2+)

`/api/v1/contacts`, `/api/v1/companies`, `/api/v1/leads`, `/api/v1/follow-ups`, `/api/v1/products`,
`/api/v1/inventory`, `/api/v1/orders`, `/api/v1/dashboard`.
