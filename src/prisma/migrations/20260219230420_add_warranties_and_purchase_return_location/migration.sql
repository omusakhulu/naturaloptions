-- AlterTable
ALTER TABLE "PurchaseReturn" ADD COLUMN     "warehouseId" TEXT;

-- CreateTable
CREATE TABLE "Warranty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "durationType" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warranty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductWarranty" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warrantyId" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "batchNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductWarranty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Warranty_name_key" ON "Warranty"("name");

-- CreateIndex
CREATE INDEX "ProductWarranty_productId_idx" ON "ProductWarranty"("productId");

-- CreateIndex
CREATE INDEX "ProductWarranty_warrantyId_idx" ON "ProductWarranty"("warrantyId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductWarranty_productId_warrantyId_batchNumber_key" ON "ProductWarranty"("productId", "warrantyId", "batchNumber");

-- CreateIndex
CREATE INDEX "PurchaseReturn_warehouseId_idx" ON "PurchaseReturn"("warehouseId");

-- AddForeignKey
ALTER TABLE "ProductWarranty" ADD CONSTRAINT "ProductWarranty_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductWarranty" ADD CONSTRAINT "ProductWarranty_warrantyId_fkey" FOREIGN KEY ("warrantyId") REFERENCES "Warranty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
