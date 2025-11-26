-- AlterTable
ALTER TABLE "Warehouse" ADD COLUMN     "locationId" TEXT;

-- CreateIndex
CREATE INDEX "Warehouse_locationId_idx" ON "Warehouse"("locationId");

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
