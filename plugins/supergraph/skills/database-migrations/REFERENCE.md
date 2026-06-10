# Database Migrations — ORM Reference

Full ORM examples for `/supergraph:database-migrations`. Reference during Step 2 (choose migration pattern).

---

## PostgreSQL Patterns

### Adding a Column Safely

```sql
-- GOOD: Nullable column, no lock
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- GOOD: Column with default (Postgres 11+ is instant)
ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- BAD: NOT NULL without default on existing table (locks + rewrites every row)
ALTER TABLE users ADD COLUMN role TEXT NOT NULL;
```

### Adding an Index Without Downtime

```sql
-- BAD: Blocks writes on large tables
CREATE INDEX idx_users_email ON users (email);

-- GOOD: Non-blocking
CREATE INDEX CONCURRENTLY idx_users_email ON users (email);
-- Note: CONCURRENTLY cannot run inside a transaction block
```

### Renaming a Column (Zero-Downtime — expand-contract)

```sql
-- Step 1: Add new column (migration 001)
ALTER TABLE users ADD COLUMN display_name TEXT;

-- Step 2: Backfill data (migration 002)
UPDATE users SET display_name = username WHERE display_name IS NULL;

-- Step 3: Update app to read/write both columns, deploy

-- Step 4: Drop old column (migration 003)
ALTER TABLE users DROP COLUMN username;
```

### Large Data Migrations (Batched)

```sql
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
    EXIT WHEN rows_updated = 0;
    COMMIT;
  END LOOP;
END $$;
```

---

## Prisma (TypeScript/Node.js)

```bash
npx prisma migrate dev --name add_user_avatar   # create from schema changes
npx prisma migrate deploy                        # apply in production
npx prisma generate                              # regenerate client
```

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatarUrl String?  @map("avatar_url")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
  @@index([email])
}
```

**Custom SQL** (for operations Prisma can't express, e.g. CONCURRENTLY):
```bash
npx prisma migrate dev --create-only --name add_email_index
```
```sql
-- Edit the generated migration.sql manually:
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users (email);
```

---

## Drizzle (TypeScript/Node.js)

```bash
npx drizzle-kit generate   # generate migration from schema
npx drizzle-kit migrate    # apply migrations
npx drizzle-kit push       # push schema directly (dev only)
```

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

---

## Kysely (TypeScript/Node.js)

```bash
kysely init                               # create kysely.config.ts
kysely migrate make add_user_avatar       # create migration file
kysely migrate latest                     # apply all pending
kysely migrate down                       # rollback last
```

```typescript
// migrations/2024_01_15_001_create_user_profile.ts
import { type Kysely, sql } from "kysely";

// IMPORTANT: Always use Kysely<any> — migrations must not depend on current schema types
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
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("user_profile").execute();
}
```

**Programmatic migrator:**
```typescript
import { Migrator, FileMigrationProvider } from "kysely";
import { promises as fs } from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.join(path.dirname(fileURLToPath(import.meta.url)), "./migrations"),
  }),
});

const { error, results } = await migrator.migrateToLatest();
results?.forEach((it) => {
  if (it.status === "Success") console.log(`✅ ${it.migrationName}`);
  else if (it.status === "Error") console.error(`❌ ${it.migrationName}`);
});
if (error) { console.error("migration failed", error); process.exit(1); }
```

---

## Django (Python)

```bash
python manage.py makemigrations              # generate from model changes
python manage.py migrate                     # apply
python manage.py showmigrations              # status
python manage.py makemigrations --empty app_name -n description  # custom SQL
```

**Data migration:**
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

class Migration(migrations.Migration):
    dependencies = [("accounts", "0015_add_display_name")]
    operations = [migrations.RunPython(backfill_display_names, migrations.RunPython.noop)]
```

**SeparateDatabaseAndState** (remove column from model without dropping from DB yet):
```python
class Migration(migrations.Migration):
    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[migrations.RemoveField(model_name="user", name="legacy_field")],
            database_operations=[],  # drop in next migration after app is deployed
        ),
    ]
```

---

## golang-migrate (Go)

```bash
migrate create -ext sql -dir migrations -seq add_user_avatar   # create pair
migrate -path migrations -database "$DATABASE_URL" up          # apply all
migrate -path migrations -database "$DATABASE_URL" down 1      # rollback last
migrate -path migrations -database "$DATABASE_URL" force VERSION  # fix dirty state
```

```sql
-- migrations/000003_add_user_avatar.up.sql
ALTER TABLE users ADD COLUMN avatar_url TEXT;
CREATE INDEX CONCURRENTLY idx_users_avatar ON users (avatar_url) WHERE avatar_url IS NOT NULL;

-- migrations/000003_add_user_avatar.down.sql
DROP INDEX IF EXISTS idx_users_avatar;
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
```

---

## Zero-Downtime Strategy (Expand-Contract)

```
Phase 1 — EXPAND
  Add new column/table (nullable or with default)
  Deploy: app writes to BOTH old and new
  Backfill existing data

Phase 2 — MIGRATE
  Deploy: app reads from NEW, writes to BOTH
  Verify data consistency

Phase 3 — CONTRACT
  Deploy: app only uses NEW
  Drop old column/table in separate migration
```

**Example timeline:**
```
Day 1: Add new_status column (nullable)
Day 1: Deploy app v2 — writes to both status and new_status
Day 2: Backfill migration for existing rows
Day 3: Deploy app v3 — reads from new_status only
Day 7: Drop old status column
```
