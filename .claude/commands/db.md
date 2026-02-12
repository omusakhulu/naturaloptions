# /db - Database Operations

Manage database operations including migrations, seeding, and introspection.

## Instructions

Perform database operations based on the subcommand:

### /db status
Check migration status:
```bash
npx prisma migrate status
```

### /db migrate
Create and apply a new migration:
```bash
pnpm migrate
```

### /db seed
Seed the database with initial data:
```bash
pnpm seed
```

### /db studio
Open Prisma Studio for visual database management:
```bash
npx prisma studio
```

### /db reset
Reset database (DEVELOPMENT ONLY):
```bash
npx prisma migrate reset
```

### /db push
Push schema changes without creating migration (prototyping):
```bash
npx prisma db push
```

## Arguments

```
/db <command>

Commands:
  status    - Check migration status
  migrate   - Run pending migrations
  seed      - Seed database
  studio    - Open Prisma Studio
  reset     - Reset database (dev only)
  push      - Push schema (prototyping)
  generate  - Regenerate Prisma client
```

## Common Workflows

### Adding a New Model

1. Edit `src/prisma/schema.prisma`
2. Generate migration: `pnpm migrate`
3. Regenerate client: `npx prisma generate`

### Updating Existing Model

1. Modify model in schema.prisma
2. Create migration: `pnpm migrate`
3. If data transformation needed, write migration script

### Prototyping Changes

1. Make schema changes
2. Push directly: `npx prisma db push`
3. When ready, create proper migration

## Schema Location

The Prisma schema is located at:
```
src/prisma/schema.prisma
```

## Key Models

| Model | Description |
|-------|-------------|
| User | Application users with authentication |
| Product | Inventory items |
| Customer | Customer records |
| Order | Order management |
| Invoice | Financial invoices |
| POSSale | Point of sale transactions |
| JournalEntry | Accounting entries |

## Safety Guidelines

- NEVER run `reset` in production
- Always backup before destructive operations
- Test migrations in development first
- Review generated SQL before applying

## Troubleshooting

### Migration Failed
```bash
# Check status
npx prisma migrate status

# See what SQL would be generated
npx prisma migrate diff --preview-feature
```

### Schema Drift
```bash
# Compare schema to database
npx prisma migrate diff \
  --from-schema-datasource ./src/prisma/schema.prisma \
  --to-url "$DATABASE_URL"
```

### Regenerate Client
```bash
npx prisma generate
```
