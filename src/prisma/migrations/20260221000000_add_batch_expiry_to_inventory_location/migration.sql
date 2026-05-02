-- Add batch/expiry columns to InventoryLocation
ALTER TABLE "InventoryLocation" ADD COLUMN "batchNumber" TEXT NOT NULL DEFAULT '';
ALTER TABLE "InventoryLocation" ADD COLUMN "lotNumber" TEXT;
ALTER TABLE "InventoryLocation" ADD COLUMN "expiryDate" TIMESTAMP(3);

-- Drop old unique constraint
DROP INDEX IF EXISTS "InventoryLocation_productId_locationId_key";

-- Create new unique constraint (product + location + batch)
CREATE UNIQUE INDEX "InventoryLocation_productId_locationId_batchNumber_key" ON "InventoryLocation"("productId", "locationId", "batchNumber");

-- Add indexes for batch/expiry queries
CREATE INDEX "InventoryLocation_batchNumber_idx" ON "InventoryLocation"("batchNumber");
CREATE INDEX "InventoryLocation_expiryDate_idx" ON "InventoryLocation"("expiryDate");

-- Add locationId to PurchaseOrder for store destination
ALTER TABLE "PurchaseOrder" ADD COLUMN "locationId" TEXT;
