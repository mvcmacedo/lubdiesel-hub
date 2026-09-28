# Database

PostgreSQL, accessed through Prisma. Models use PascalCase; tables and columns are mapped to
`snake_case`. All commercially relevant entities use soft delete (`deleted_at`) and audit timestamps
(`created_at`, `updated_at`). The schema lives in
[apps/api/prisma/schema.prisma](../apps/api/prisma/schema.prisma).

## Entity–relationship (simplified)

```
User 1───* RefreshToken
User 1───* Contact (assigned)      User 1───* Lead (assigned)
User 1───* FollowUp (assigned)     User 1───* Interaction (createdBy)
User 1───* InventoryMovement (createdBy)   User 1───* Order (createdBy)

Company 1───* Contact              Company 1───* Order
Contact 1───* Lead                 Contact 1───* FollowUp
Contact 1───* Interaction          Contact 1───* Order

Lead 1───* LeadStageHistory        Lead 1───* FollowUp        Lead 1───* Interaction

Product 1───* InventoryMovement    Product 1───* OrderItem
Order 1───* OrderItem
```

## Tables

| Table                  | Purpose                                                                |
| ---------------------- | ---------------------------------------------------------------------- |
| `users`                | System users (auth). Roles: `ADMIN`, `USER`.                           |
| `refresh_tokens`       | Hashed refresh tokens (SHA-256) for rotation/revocation.               |
| `contacts`             | Any known person (lead, customer, reseller, workshop, fleet…).         |
| `companies`            | Organizations (workshop, reseller, distributor, fleet, supplier).      |
| `leads`                | Commercial opportunities tied to a contact.                            |
| `lead_stage_history`   | Pipeline stage-change history per lead.                                |
| `interactions`         | Timeline of relationship touchpoints (call, WhatsApp, note…).          |
| `follow_ups`           | Scheduled follow-ups (today / overdue / upcoming).                     |
| `products`             | Catalog / SKUs (e.g. `LUB-060`, `LUB-1000`).                           |
| `inventory_movements`  | Stock movements — the source of truth for balance.                     |
| `orders`               | Orders/sales with subtotal, discount, total.                           |
| `order_items`          | Order line items; stores `cost_price` at sale time for margin history. |
| `audit_logs`           | Lightweight audit trail for important operations.                      |

## Enums

`UserRole`, `ContactType`, `CompanyType`, `CustomerType`, `LeadStatus`, `LeadSource`, `LostReason`,
`FollowUpType`, `FollowUpStatus`, `InteractionType`, `InventoryMovementType`, `OrderStatus`, `OrderSource`.

Enums are mirrored in [packages/shared/src/enums.ts](../packages/shared/src/enums.ts) for the frontend
and API request layer. **Keep both in sync** and generate a migration when changing them.

## Indexes

Indexes are defined for the fields most used in filters and lookups:
`email`, `phone`, `whatsapp`, `created_at`, `status`, `source`, `assigned_user_id`, `sku`, `document`,
plus foreign keys. This supports the search/filter requirements and avoids common N+1 hotspots.

## Integrity rules

- Deleting a `User` sets related assignable references to `NULL` (`onDelete: SetNull`) — history is preserved.
- Deleting a `Contact`/`Lead` cascades to its dependent records (leads, follow-ups, interactions, stage history).
- `OrderItem → Product` uses `Restrict` to prevent deleting a product referenced by sales.
- Inventory balance is **calculated from `inventory_movements`**; a cached aggregate may be added later.

## Migrations & seeds

- Every schema change requires a migration (`npm run prisma:migrate -w @lubdiesel/api`). Never rely on
  manual database changes.
- The seed ([apps/api/prisma/seed.ts](../apps/api/prisma/seed.ts)) is idempotent and creates the initial
  admin user and the products `LUB-060` (60 ml) and `LUB-1000` (1 L). Prices default to `0` (placeholder)
  because they are still subject to change.
