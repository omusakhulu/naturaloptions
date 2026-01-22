/*
  Warnings:

  - The values [FAILED] on the enum `RefundStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProductStockMovementType" AS ENUM ('SALE', 'PURCHASE', 'ADJUSTMENT', 'TRANSFER', 'SYNC', 'RETURN', 'DAMAGE', 'RECOUNT');

-- AlterEnum
BEGIN;
CREATE TYPE "RefundStatus_new" AS ENUM ('PENDING', 'COMPLETED');
ALTER TABLE "Refund" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Refund" ALTER COLUMN "status" TYPE "RefundStatus_new" USING ("status"::text::"RefundStatus_new");
ALTER TYPE "RefundStatus" RENAME TO "RefundStatus_old";
ALTER TYPE "RefundStatus_new" RENAME TO "RefundStatus";
DROP TYPE "RefundStatus_old";
ALTER TABLE "Refund" ALTER COLUMN "status" SET DEFAULT 'COMPLETED';
COMMIT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "actualStock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "autoSyncStock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastStockSync" TIMESTAMP(3),
ADD COLUMN     "lowStockAlert" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "reservedStock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "websiteStock" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ProductStockMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "ProductStockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "beforeActual" INTEGER NOT NULL,
    "afterActual" INTEGER NOT NULL,
    "beforeWebsite" INTEGER,
    "afterWebsite" INTEGER,
    "reference" TEXT,
    "locationId" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "userId" TEXT,
    "userName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductStockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductStockMovement_productId_idx" ON "ProductStockMovement"("productId");

-- CreateIndex
CREATE INDEX "ProductStockMovement_type_idx" ON "ProductStockMovement"("type");

-- CreateIndex
CREATE INDEX "ProductStockMovement_createdAt_idx" ON "ProductStockMovement"("createdAt");

-- CreateIndex
CREATE INDEX "ProductStockMovement_reference_idx" ON "ProductStockMovement"("reference");

-- CreateIndex
CREATE INDEX "Product_actualStock_idx" ON "Product"("actualStock");

-- CreateIndex
CREATE INDEX "Product_websiteStock_idx" ON "Product"("websiteStock");

-- AddForeignKey
ALTER TABLE "ProductStockMovement" ADD CONSTRAINT "ProductStockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
