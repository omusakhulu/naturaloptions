-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "attributes" TEXT DEFAULT '[]',
ADD COLUMN     "shippingClass" TEXT,
ADD COLUMN     "tags" TEXT DEFAULT '[]';

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "wooId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL,
    "dateModified" TIMESTAMP(3) NOT NULL,
    "discountType" TEXT NOT NULL,
    "description" TEXT,
    "expiryDate" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "individualUse" BOOLEAN NOT NULL DEFAULT false,
    "productIds" TEXT DEFAULT '[]',
    "excludeProductIds" TEXT DEFAULT '[]',
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxRate" (
    "id" TEXT NOT NULL,
    "wooId" INTEGER NOT NULL,
    "country" TEXT,
    "state" TEXT,
    "postcode" TEXT,
    "city" TEXT,
    "rate" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "compound" BOOLEAN NOT NULL DEFAULT false,
    "shipping" BOOLEAN NOT NULL DEFAULT true,
    "class" TEXT NOT NULL DEFAULT 'standard',
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttribute" (
    "id" TEXT NOT NULL,
    "wooId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'select',
    "orderBy" TEXT NOT NULL DEFAULT 'menu_order',
    "hasArchives" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTag" (
    "id" TEXT NOT NULL,
    "wooId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "count" INTEGER NOT NULL DEFAULT 0,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingClass" (
    "id" TEXT NOT NULL,
    "wooId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "count" INTEGER NOT NULL DEFAULT 0,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippingClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderNote" (
    "id" TEXT NOT NULL,
    "wooId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'system',
    "dateCreated" TIMESTAMP(3) NOT NULL,
    "note" TEXT NOT NULL,
    "customerNote" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'general',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParkedSale" (
    "id" TEXT NOT NULL,
    "saleNumber" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "customerId" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "cartItems" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParkedSale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_wooId_key" ON "Coupon"("wooId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_wooId_idx" ON "Coupon"("wooId");

-- CreateIndex
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TaxRate_wooId_key" ON "TaxRate"("wooId");

-- CreateIndex
CREATE INDEX "TaxRate_wooId_idx" ON "TaxRate"("wooId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttribute_wooId_key" ON "ProductAttribute"("wooId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttribute_slug_key" ON "ProductAttribute"("slug");

-- CreateIndex
CREATE INDEX "ProductAttribute_wooId_idx" ON "ProductAttribute"("wooId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTag_wooId_key" ON "ProductTag"("wooId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTag_slug_key" ON "ProductTag"("slug");

-- CreateIndex
CREATE INDEX "ProductTag_wooId_idx" ON "ProductTag"("wooId");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingClass_wooId_key" ON "ShippingClass"("wooId");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingClass_slug_key" ON "ShippingClass"("slug");

-- CreateIndex
CREATE INDEX "ShippingClass_wooId_idx" ON "ShippingClass"("wooId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderNote_wooId_key" ON "OrderNote"("wooId");

-- CreateIndex
CREATE INDEX "OrderNote_wooId_idx" ON "OrderNote"("wooId");

-- CreateIndex
CREATE INDEX "OrderNote_orderId_idx" ON "OrderNote"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreSetting_key_key" ON "StoreSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ParkedSale_saleNumber_key" ON "ParkedSale"("saleNumber");

-- CreateIndex
CREATE INDEX "ParkedSale_terminalId_idx" ON "ParkedSale"("terminalId");

-- CreateIndex
CREATE INDEX "ParkedSale_employeeId_idx" ON "ParkedSale"("employeeId");

-- CreateIndex
CREATE INDEX "ParkedSale_createdAt_idx" ON "ParkedSale"("createdAt");

-- AddForeignKey
ALTER TABLE "ParkedSale" ADD CONSTRAINT "ParkedSale_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "POSTerminal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParkedSale" ADD CONSTRAINT "ParkedSale_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParkedSale" ADD CONSTRAINT "ParkedSale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "POSCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
