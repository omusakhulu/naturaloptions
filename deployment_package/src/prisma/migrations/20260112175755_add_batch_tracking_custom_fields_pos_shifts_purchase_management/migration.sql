-- CreateEnum
CREATE TYPE "CustomFieldEntity" AS ENUM ('VENDOR', 'CUSTOMER', 'POS_CUSTOMER', 'PRODUCT', 'ORDER');

-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'DECIMAL', 'DATE', 'DATETIME', 'BOOLEAN', 'SELECT', 'MULTISELECT', 'EMAIL', 'PHONE', 'URL', 'FILE');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('OPEN', 'CLOSING', 'CLOSED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CashMovementType" AS ENUM ('SALE', 'REFUND', 'PAY_IN', 'PAY_OUT', 'FLOAT', 'DROP');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "RequisitionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequisitionPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "batchNumber" TEXT,
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "lotNumber" TEXT;

-- CreateTable
CREATE TABLE "CustomFieldDefinition" (
    "id" TEXT NOT NULL,
    "entityType" "CustomFieldEntity" NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "fieldType" "CustomFieldType" NOT NULL DEFAULT 'TEXT',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "options" TEXT,
    "placeholder" TEXT,
    "helpText" TEXT,
    "defaultValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldValue" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POSShift" (
    "id" TEXT NOT NULL,
    "shiftNumber" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "status" "ShiftStatus" NOT NULL DEFAULT 'OPEN',
    "openingCash" DECIMAL(10,2) NOT NULL,
    "closingCash" DECIMAL(10,2),
    "expectedCash" DECIMAL(10,2),
    "cashDiscrepancy" DECIMAL(10,2),
    "totalSales" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalRefunds" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalVoids" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "paymentBreakdown" TEXT NOT NULL DEFAULT '{}',
    "cashIn" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cashOut" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "closedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "POSShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashMovement" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "type" "CashMovementType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "reference" TEXT,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(15,2) NOT NULL,
    "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "shippingCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "warehouseId" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "terms" TEXT,
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requisitionId" TEXT,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "receivedQty" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "batchNumber" TEXT,
    "lotNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequisition" (
    "id" TEXT NOT NULL,
    "requisitionNumber" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestedFor" TEXT,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requiredDate" TIMESTAMP(3),
    "status" "RequisitionStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "RequisitionPriority" NOT NULL DEFAULT 'NORMAL',
    "reason" TEXT,
    "notes" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequisitionItem" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "sku" TEXT,
    "productName" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "estimatedPrice" DECIMAL(10,2),
    "preferredVendor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseRequisitionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomFieldDefinition_entityType_idx" ON "CustomFieldDefinition"("entityType");

-- CreateIndex
CREATE INDEX "CustomFieldDefinition_isActive_idx" ON "CustomFieldDefinition"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldDefinition_entityType_fieldName_key" ON "CustomFieldDefinition"("entityType", "fieldName");

-- CreateIndex
CREATE INDEX "CustomFieldValue_fieldId_idx" ON "CustomFieldValue"("fieldId");

-- CreateIndex
CREATE INDEX "CustomFieldValue_entityId_idx" ON "CustomFieldValue"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldValue_fieldId_entityId_key" ON "CustomFieldValue"("fieldId", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "POSShift_shiftNumber_key" ON "POSShift"("shiftNumber");

-- CreateIndex
CREATE INDEX "POSShift_terminalId_idx" ON "POSShift"("terminalId");

-- CreateIndex
CREATE INDEX "POSShift_employeeId_idx" ON "POSShift"("employeeId");

-- CreateIndex
CREATE INDEX "POSShift_status_idx" ON "POSShift"("status");

-- CreateIndex
CREATE INDEX "POSShift_startTime_idx" ON "POSShift"("startTime");

-- CreateIndex
CREATE INDEX "CashMovement_shiftId_idx" ON "CashMovement"("shiftId");

-- CreateIndex
CREATE INDEX "CashMovement_type_idx" ON "CashMovement"("type");

-- CreateIndex
CREATE INDEX "CashMovement_performedAt_idx" ON "CashMovement"("performedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_orderNumber_key" ON "PurchaseOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_vendorId_idx" ON "PurchaseOrder"("vendorId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_orderDate_idx" ON "PurchaseOrder"("orderDate");

-- CreateIndex
CREATE INDEX "PurchaseOrder_requisitionId_idx" ON "PurchaseOrder"("requisitionId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_sku_idx" ON "PurchaseOrderItem"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequisition_requisitionNumber_key" ON "PurchaseRequisition"("requisitionNumber");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_status_idx" ON "PurchaseRequisition"("status");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_requestedBy_idx" ON "PurchaseRequisition"("requestedBy");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_requestDate_idx" ON "PurchaseRequisition"("requestDate");

-- CreateIndex
CREATE INDEX "PurchaseRequisitionItem_requisitionId_idx" ON "PurchaseRequisitionItem"("requisitionId");

-- CreateIndex
CREATE INDEX "InventoryItem_batchNumber_idx" ON "InventoryItem"("batchNumber");

-- CreateIndex
CREATE INDEX "InventoryItem_lotNumber_idx" ON "InventoryItem"("lotNumber");

-- CreateIndex
CREATE INDEX "InventoryItem_expiryDate_idx" ON "InventoryItem"("expiryDate");

-- AddForeignKey
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "CustomFieldDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSShift" ADD CONSTRAINT "POSShift_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "POSTerminal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSShift" ADD CONSTRAINT "POSShift_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "POSShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "PurchaseRequisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisitionItem" ADD CONSTRAINT "PurchaseRequisitionItem_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "PurchaseRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
