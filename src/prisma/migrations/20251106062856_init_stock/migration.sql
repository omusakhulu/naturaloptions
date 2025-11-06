-- CreateTable
CREATE TABLE "StockTransferRecord" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "from" TEXT,
    "to" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockTransferRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAdjustmentRecord" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "location" TEXT,
    "reason" TEXT,
    "items" TEXT NOT NULL DEFAULT '[]',
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockAdjustmentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockTransferRecord_reference_key" ON "StockTransferRecord"("reference");

-- CreateIndex
CREATE INDEX "StockTransferRecord_date_idx" ON "StockTransferRecord"("date");

-- CreateIndex
CREATE INDEX "StockTransferRecord_status_idx" ON "StockTransferRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StockAdjustmentRecord_reference_key" ON "StockAdjustmentRecord"("reference");

-- CreateIndex
CREATE INDEX "StockAdjustmentRecord_date_idx" ON "StockAdjustmentRecord"("date");
