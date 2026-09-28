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

## CRM (Entrega 2)

All CRM endpoints require a Bearer token (any authenticated user).

### Companies — `/api/v1/companies`

| Method | Path   | Description                                   |
| ------ | ------ | --------------------------------------------- |
| POST   | `/`    | Create a company                              |
| GET    | `/`    | List (filters: `type`, `city`, `state`, `search`) |
| GET    | `/:id` | Get by id                                     |
| PATCH  | `/:id` | Update                                        |
| DELETE | `/:id` | Soft-delete                                   |

### Contacts — `/api/v1/contacts`

| Method | Path   | Description                                                        |
| ------ | ------ | ----------------------------------------------------------------- |
| POST   | `/`    | Create a contact                                                  |
| GET    | `/`    | List (filters: `type`, `source`, `assignedUserId`, `companyId`, `state`, `search`) |
| GET    | `/:id` | Get by id (includes company + owner)                              |
| PATCH  | `/:id` | Update                                                            |
| DELETE | `/:id` | Soft-delete                                                       |

### Leads — `/api/v1/leads`

| Method | Path          | Description                                                             |
| ------ | ------------- | ---------------------------------------------------------------------- |
| POST   | `/`           | Create a lead (records initial stage history)                          |
| GET    | `/`           | List (filters: `status`, `source`, `assignedUserId`, `contactId`, `search`) |
| GET    | `/:id`        | Get a lead with its stage history                                      |
| PATCH  | `/:id`        | Update (source, value, owner)                                          |
| PATCH  | `/:id/stage`  | Change stage — records history; `WON` sets `convertedAt` and converts the contact to `CUSTOMER`; `LOST` requires `lostReason` |
| DELETE | `/:id`        | Soft-delete                                                            |

### Pipeline — `/api/v1/pipeline`

| Method | Path                | Description                                            |
| ------ | ------------------- | ------------------------------------------------------ |
| GET    | `/`                 | Kanban board grouped by stage (filters: `source`, `assignedUserId`) |
| PATCH  | `/leads/:id/move`   | Move a lead to another stage (same rules as stage change) |

### Interactions — `/api/v1/interactions`

| Method | Path | Description                                              |
| ------ | ---- | -------------------------------------------------------- |
| POST   | `/`  | Record an interaction (must reference a contact or lead) |
| GET    | `/`  | Timeline (filters: `contactId`, `leadId`, `type`)        |

### Follow-ups — `/api/v1/follow-ups`

| Method | Path            | Description                                                     |
| ------ | --------------- | -------------------------------------------------------------- |
| POST   | `/`             | Schedule a follow-up (owner defaults to current user)          |
| GET    | `/`             | List (filters: `status`, `type`, `scope`, `assignedUserId`, `leadId`, `contactId`) |
| GET    | `/summary`      | Counts of `today` / `overdue` / `upcoming` (optional `assignedUserId`) |
| GET    | `/:id`          | Get by id                                                      |
| PATCH  | `/:id`          | Update                                                         |
| PATCH  | `/:id/complete` | Mark as completed                                             |
| PATCH  | `/:id/cancel`   | Cancel                                                        |

`scope` is a convenience filter over `PENDING` follow-ups by scheduled date: `today`, `overdue`, `upcoming`.

## Planned endpoints (Entrega 3+)

`/api/v1/products`, `/api/v1/inventory`, `/api/v1/orders`, `/api/v1/dashboard`.

