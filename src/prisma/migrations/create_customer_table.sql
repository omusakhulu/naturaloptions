CREATE TABLE IF NOT EXISTS "Customer" (
    id TEXT PRIMARY KEY,
    "wooId" INTEGER UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    username TEXT,
    role TEXT,
    "avatarUrl" TEXT,
    "billingAddress" TEXT DEFAULT '{}',
    "shippingAddress" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "syncedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
