# /generate:migration - Create Prisma Migration

Safely create and apply a Prisma database migration.

## Instructions

1. Review the requested schema changes

2. Edit the Prisma schema file at `src/prisma/schema.prisma`:
   - Add new models, fields, or relations
   - Update existing models
   - Add indexes for performance

3. Generate and apply migration:
```bash
pnpm migrate
```
   This runs: `prisma migrate dev`

4. If migration fails, report the error and suggest fixes

5. Update TypeScript types by regenerating Prisma client:
```bash
npx prisma generate
```

## Arguments

```
/generate:migration <description>

Examples:
/generate:migration add-customer-loyalty-points
/generate:migration add-product-categories-relation
/generate:migration add-audit-log-table
```

## Migration Guidelines

### Adding a New Model
```prisma
model LoyaltyPoints {
  id          Int      @id @default(autoincrement())
  customerId  Int
  points      Int      @default(0)
  expiresAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  customer    Customer @relation(fields: [customerId], references: [id])

  @@index([customerId])
  @@index([expiresAt])
}
```

### Adding Fields to Existing Model
```prisma
model Customer {
  // ... existing fields ...

  // New fields
  loyaltyTier     String?   @default("bronze")
  totalLifetimeSpend Decimal? @default(0) @db.Decimal(10, 2)
}
```

### Adding Relations
```prisma
model Product {
  // ... existing fields ...

  categoryId  Int?
  category    ProductCategory? @relation(fields: [categoryId], references: [id])
}

model ProductCategory {
  id        Int       @id @default(autoincrement())
  name      String
  products  Product[]
}
```

## Safety Checks

Before applying migration:

1. **Backup Production Data** (if applicable)
2. **Check for Data Loss**:
   - Removing columns/tables loses data
   - Changing types may fail if data doesn't convert
3. **Review Migration SQL**:
```bash
npx prisma migrate diff --preview-feature
```

## Rollback

If migration fails or causes issues:

1. Check migration status:
```bash
npx prisma migrate status
```

2. Reset database (DEVELOPMENT ONLY):
```bash
npx prisma migrate reset
```

3. For production, create a new migration to reverse changes

## Post-Migration

After successful migration:

1. Regenerate Prisma client
2. Update affected API routes
3. Update TypeScript types if needed
4. Run tests to verify nothing broke
