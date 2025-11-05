CREATE TABLE IF NOT EXISTS "Invoice" (
    id TEXT PRIMARY KEY,
    "wooOrderId" INTEGER UNIQUE NOT NULL,
    "invoiceNumber" TEXT UNIQUE NOT NULL,
    "customerId" INTEGER,
    status TEXT NOT NULL DEFAULT 'draft',
    amount TEXT,
    date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMPTZ,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "billingAddress" TEXT DEFAULT '{}',
    "lineItems" TEXT DEFAULT '[]',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL
);
