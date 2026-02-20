-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT,
    "serviceType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "saleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiceScheme" TEXT,
    "invoiceNo" TEXT,
    "salesOrder" TEXT,
    "discountType" TEXT,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "orderTax" TEXT,
    "sellNote" TEXT,
    "shippingDetails" TEXT,
    "shippingAddress" TEXT,
    "shippingCharges" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "shippingStatus" TEXT,
    "deliveredTo" TEXT,
    "deliveryPerson" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalPayable" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lineItems" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNumber_key" ON "Quotation"("quotationNumber");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");

-- CreateIndex
CREATE INDEX "Quotation_customerId_idx" ON "Quotation"("customerId");

-- CreateIndex
CREATE INDEX "Quotation_createdAt_idx" ON "Quotation"("createdAt");
