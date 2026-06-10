---
name: database-migrations
description: Database migration best practices for schema changes, data migrations, rollbacks, and zero-downtime deployments across PostgreSQL, MySQL, and common ORMs (Prisma, Drizzle, Kysely, Django, TypeORM, golang-migrate).
mcp: code-review-graph
---

# /supergraph:database-migrations

Safe, reversible database schema changes for production systems.

Announce: "🗄️ /supergraph:database-migrations — checking blast radius and migration safety..."

## When to Activate

- Creating or altering database tables
- Adding/removing columns or indexes
- Running data migrations (backfill, transform)
- Planning zero-downtime schema changes
- Setting up migration tooling for a new project

## Steps

### 1. Check blast radius (MANDATORY before writing any migration)
```
mcp__code-review-graph__get_impact_radius_tool(files=[schema_files, model_files], depth=2)
mcp__code-review-graph__query_graph_tool(query_type="dependents", target=<schema_file>)
```
Schema changes to hub tables (e.g. `users`, `orders`) ripple through repositories, queries, services. If blast radius > 20 files → STOP and discuss with user.

**Serena symbol-level impact (optional):**
```
mcp__serena__find_referencing_symbols(symbol=<column_or_model_name>)
```
Finds ORM field references that graph tools see only at file level — e.g. a Prisma field rename that `query_graph` sees as "file touched" but Serena sees as "12 usages in service layer". Skip if Serena unavailable.

### 2. Choose migration pattern
Select the appropriate pattern from the sections below (PostgreSQL, Prisma, Drizzle, etc.) based on detected project type from `.supergraph-env`.

### 3. Write migration
Follow Migration Safety Checklist before writing SQL/ORM migration code.

### 4. Verify flows
After migration written:
```
mcp__code-review-graph__get_affected_flows_tool(files=[migration_and_related_code])
```
All data flows still intact? Application code updated to match schema?

### 5. Report
```
✅ /supergraph:database-migrations
- Pattern: [expand-contract | add-column | add-index | data-migration | ...]
- Blast radius: N files | Hub tables: [list/none]
- Safety checklist: PASS | BLOCKED (list issues)
- Next: /supergraph:tdd → /supergraph:fix → /supergraph:verify
```

## MCP-Integrated Workflow Reference

Before writing any migration, check graph context to understand blast radius:

1. **`mcp__code-review-graph__get_impact_radius_tool(files=[schema_files, model_files], depth=2)`** — Schema changes to hub tables (e.g. `users`, `orders`) touch repositories, queries, services across the entire codebase
2. **`mcp__code-review-graph__query_graph_tool(query_type="dependents", target=<schema_file>)`** — Find all code that references the table/column being changed. This prevents "migration approved but application code forgot to update" bugs
3. After migration written, **`mcp__code-review-graph__get_affected_flows_tool(files=[migration_and_related_code])`** — Verify all data flows still work
4. **`mcp__serena__find_referencing_symbols(symbol=<column_or_model_name>)`** *(optional — if Serena available)* — Symbol-level ORM impact: finds all TypeScript/Python/Go model fields and query builders that reference the changed column by name. Graph tools detect file-level edges; Serena detects symbol-level usages (e.g. a Prisma field rename that `query_graph` sees as "file touched" but Serena sees as "12 usages in service layer"). Skip if Serena unavailable.

## Core Principles

1. **Every change is a migration** — never alter production databases manually
2. **Migrations are forward-only in production** — rollbacks use new forward migrations
3. **Schema and data migrations are separate** — never mix DDL and DML in one migration
4. **Test migrations against production-sized data** — a migration that works on 100 rows may lock on 10M
5. **Migrations are immutable once deployed** — never edit a migration that has run in production

## Migration Safety Checklist

Before applying any migration:

- [ ] Migration has both UP and DOWN (or is explicitly marked irreversible)
- [ ] No full table locks on large tables (use concurrent operations)
- [ ] New columns have defaults or are nullable (never add NOT NULL without default)
- [ ] Indexes created concurrently (not inline with CREATE TABLE for existing tables)
- [ ] Data backfill is a separate migration from schema change
- [ ] Tested against a copy of production data
- [ ] Rollback plan documented

## PostgreSQL Patterns

### Adding a Column Safely

```sql
-- GOOD: Nullable column, no lock
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- GOOD: Column with default (Postgres 11+ is instant, no rewrite)
ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- BAD: NOT NULL without default on existing table (requires full rewrite)
ALTER TABLE users ADD COLUMN role TEXT NOT NULL;
-- This locks the table and rewrites every row
```

### Adding an Index Without Downtime

```sql
-- BAD: Blocks writes on large tables
CREATE INDEX idx_users_email ON users (email);

-- GOOD: Non-blocking, allows concurrent writes
CREATE INDEX CONCURRENTLY idx_users_email ON users (email);

-- Note: CONCURRENTLY cannot run inside a transaction block
-- Most migration tools need special handling for this
```

### Renaming a Column (Zero-Downtime)

Never rename directly in production. Use the expand-contract pattern:

```sql
-- Step 1: Add new column (migration 001)
ALTER TABLE users ADD COLUMN display_name TEXT;

-- Step 2: Backfill data (migration 002, data migration)
UPDATE users SET display_name = username WHERE display_name IS NULL;

-- Step 3: Update application code to read/write both columns
-- Deploy application changes

-- Step 4: Stop writing to old column, drop it (migration 003)
ALTER TABLE users DROP COLUMN username;
```

### Removing a Column Safely

```sql
-- Step 1: Remove all application references to the column
-- Step 2: Deploy application without the column reference
-- Step 3: Drop column in next migration
ALTER TABLE orders DROP COLUMN legacy_status;

-- For Django: use SeparateDatabaseAndState to remove from model
-- without generating DROP COLUMN (then drop in next migration)
```

### Large Data Migrations

```sql
-- BAD: Updates all rows in one transaction (locks table)
UPDATE users SET normalized_email = LOWER(email);

-- GOOD: Batch update with progress
DO $$
DECLARE
  batch_size INT := 10000;
  rows_updated INT;
BEGIN
  LOOP
    UPDATE users
    SET normalized_email = LOWER(email)
    WHERE id IN (
      SELECT id FROM users
      WHERE normalized_email IS NULL
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED
    );
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % rows', rows_updated;
    EXIT WHEN rows_updated = 0;
    COMMIT;
  END LOOP;
END $$;
```

## Prisma (TypeScript/Node.js)

### Workflow

```bash
# Create migration from schema changes
npx prisma migrate dev --name add_user_avatar

# Apply pending migrations in production
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Generate client after schema changes
npx prisma generate
```

### Schema Example

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatarUrl String?  @map("avatar_url")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  orders    Order[]

  @@map("users")
  @@index([email])
}
```

### Custom SQL Migration

For operations Prisma cannot express (concurrent indexes, data backfills):

```bash
# Create empty migration, then edit the SQL manually
npx prisma migrate dev --create-only --name add_email_index
```

```sql
-- migrations/20240115_add_email_index/migration.sql
-- Prisma cannot generate CONCURRENTLY, so we write it manually
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users (email);
```

## Drizzle (TypeScript/Node.js)

### Workflow

```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

# Push schema directly (dev only, no migration file)
npx drizzle-kit push
```

### Schema Example

```typescript
import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

## Kysely (TypeScript/Node.js)

### Workflow (kysely-ctl)

```bash
# Initialize config file (kysely.config.ts)
kysely init

# Create a new migration file
kysely migrate make add_user_avatar

# Apply all pending migrations
kysely migrate latest

# Rollback last migration
kysely migrate down

# Show migration status
kysely migrate list
```

### Migration File

```typescript
// migrations/2024_01_15_001_create_user_profile.ts
import { type Kysely, sql } from "kysely";

// IMPORTANT: Always use Kysely<any>, not your typed DB interface.
// Migrations are frozen in time and must not depend on current schema types.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("user_profile")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("email", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("avatar_url", "text")
    .addColumn("created_at", "timestamp", (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  await db.schema
    .createIndex("idx_user_profile_avatar")
    .on("user_profile")
    .column("avatar_url")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("user_profile").execute();
}
```

### Programmatic Migrator

```typescript
import { Migrator, FileMigrationProvider } from "kysely";
import { promises as fs } from "fs";
import * as path from "path";
// ESM only — CJS can use __dirname directly
import { fileURLToPath } from "url";
const migrationFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "./migrations",
);

// `db` is your Kysely<any> database instance
const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder,
  }),
  // WARNING: Only enable in development. Disables timestamp-ordering
  // validation, which can cause schema drift between environments.
  // allowUnorderedMigrations: true,
});

const { error, results } = await migrator.migrateToLatest();

results?.forEach((it) => {
  if (it.status === "Success") {
    console.log(`migration "${it.migrationName}" executed successfully`);
  } else if (it.status === "Error") {
    console.error(`failed to execute migration "${it.migrationName}"`);
  }
});

if (error) {
  console.error("migration failed", error);
  process.exit(1);
}
```

## Django (Python)

### Workflow

```bash
# Generate migration from model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations

# Generate empty migration for custom SQL
python manage.py makemigrations --empty app_name -n description
```

### Data Migration

```python
from django.db import migrations

def backfill_display_names(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    batch_size = 5000
    users = User.objects.filter(display_name="")
    while users.exists():
        batch = list(users[:batch_size])
        for user in batch:
            user.display_name = user.username
        User.objects.bulk_update(batch, ["display_name"], batch_size=batch_size)

def reverse_backfill(apps, schema_editor):
    pass  # Data migration, no reverse needed

class Migration(migrations.Migration):
    dependencies = [("accounts", "0015_add_display_name")]

    operations = [
        migrations.RunPython(backfill_display_names, reverse_backfill),
    ]
```

### SeparateDatabaseAndState

Remove a column from the Django model without dropping it from the database immediately:

```python
class Migration(migrations.Migration):
    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.RemoveField(model_name="user", name="legacy_field"),
            ],
            database_operations=[],  # Don't touch the DB yet
        ),
    ]
```

## golang-migrate (Go)

### Workflow

```bash
# Create migration pair
migrate create -ext sql -dir migrations -seq add_user_avatar

# Apply all pending migrations
migrate -path migrations -database "$DATABASE_URL" up

# Rollback last migration
migrate -path migrations -database "$DATABASE_URL" down 1

# Force version (fix dirty state)
migrate -path migrations -database "$DATABASE_URL" force VERSION
```

### Migration Files

```sql
-- migrations/000003_add_user_avatar.up.sql
ALTER TABLE users ADD COLUMN avatar_url TEXT;
CREATE INDEX CONCURRENTLY idx_users_avatar ON users (avatar_url) WHERE avatar_url IS NOT NULL;

-- migrations/000003_add_user_avatar.down.sql
DROP INDEX IF EXISTS idx_users_avatar;
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
```

## Zero-Downtime Migration Strategy

For critical production changes, follow the expand-contract pattern:

```
Phase 1: EXPAND
  - Add new column/table (nullable or with default)
  - Deploy: app writes to BOTH old and new
  - Backfill existing data

Phase 2: MIGRATE
  - Deploy: app reads from NEW, writes to BOTH
  - Verify data consistency

Phase 3: CONTRACT
  - Deploy: app only uses NEW
  - Drop old column/table in separate migration
```

### Timeline Example

```
Day 1: Migration adds new_status column (nullable)
Day 1: Deploy app v2 — writes to both status and new_status
Day 2: Run backfill migration for existing rows
Day 3: Deploy app v3 — reads from new_status only
Day 7: Migration drops old status column
```

## Anti-Patterns

| Anti-Pattern                         | Why It Fails                         | Better Approach                             |
| ------------------------------------ | ------------------------------------ | ------------------------------------------- |
| Manual SQL in production             | No audit trail, unrepeatable         | Always use migration files                  |
| Editing deployed migrations          | Causes drift between environments    | Create new migration instead                |
| NOT NULL without default             | Locks table, rewrites all rows       | Add nullable, backfill, then add constraint |
| Inline index on large table          | Blocks writes during build           | CREATE INDEX CONCURRENTLY                   |
| Schema + data in one migration       | Hard to rollback, long transactions  | Separate migrations                         |
| Dropping column before removing code | Application errors on missing column | Remove code first, drop column next deploy  |

## Rules

- ALWAYS check blast radius before writing any migration — hub table changes need user approval
- NEVER alter production databases manually — every change goes through migration files
- NEVER mix DDL and DML in one migration — separate schema changes from data migrations
- NEVER add NOT NULL column without a default to existing tables — locks and rewrites all rows
- ALWAYS create indexes with CONCURRENTLY on live tables
- ALWAYS test against production-sized data before deploying
- NEVER edit a migration that has already run in production — create a new one
- Use expand-contract pattern for zero-downtime column renames and removals
