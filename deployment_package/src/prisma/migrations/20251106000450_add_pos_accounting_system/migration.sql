-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'CHECK', 'GIFT_CARD', 'STORE_CREDIT', 'DIGITAL_WALLET');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PENDING', 'COMPLETED', 'VOIDED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "DrawerStatus" AS ENUM ('OPEN', 'CLOSED', 'RECONCILED');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('DRAFT', 'POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOIDED');

-- CreateEnum
CREATE TYPE "TimeClockStatus" AS ENUM ('CLOCKED_IN', 'CLOCKED_OUT', 'ON_BREAK');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'ACCOUNTANT';
ALTER TYPE "UserRole" ADD VALUE 'CASHIER';

-- CreateTable
CREATE TABLE "POSTerminal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "POSTerminal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POSSale" (
    "id" TEXT NOT NULL,
    "saleNumber" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "customerId" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
    "receiptPrinted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "saleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "POSSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POSSaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "POSSaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashDrawer" (
    "id" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "openingAmount" DECIMAL(10,2) NOT NULL,
    "closingAmount" DECIMAL(10,2),
    "expectedAmount" DECIMAL(10,2),
    "discrepancy" DECIMAL(10,2),
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "status" "DrawerStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,

    CONSTRAINT "CashDrawer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChartOfAccounts" (
    "id" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChartOfAccounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "entryNumber" TEXT NOT NULL,
    "reference" TEXT,
    "description" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "totalDebit" DECIMAL(15,2) NOT NULL,
    "totalCredit" DECIMAL(15,2) NOT NULL,
    "status" "JournalStatus" NOT NULL DEFAULT 'POSTED',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chartOfAccountsId" TEXT,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalLineItem" (
    "id" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "description" TEXT,
    "debitAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "creditAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "JournalLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTerm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "paymentTermId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "billDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "amount" DECIMAL(15,2) NOT NULL,
    "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "BillStatus" NOT NULL DEFAULT 'UNPAID',
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POSCustomer" (
    "id" TEXT NOT NULL,
    "customerNumber" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paymentTermId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "POSCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMainLocation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLocation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minQuantity" INTEGER NOT NULL DEFAULT 0,
    "maxQuantity" INTEGER,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeLocation" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "EmployeeLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeClockEntry" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "clockIn" TIMESTAMP(3) NOT NULL,
    "clockOut" TIMESTAMP(3),
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "hoursWorked" DECIMAL(5,2),
    "status" "TimeClockStatus" NOT NULL DEFAULT 'CLOCKED_IN',
    "locationId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeClockEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "saleId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cardLast4" TEXT,
    "cardType" TEXT,
    "cardToken" TEXT,
    "checkNumber" TEXT,
    "cashTendered" DECIMAL(10,2),
    "changeGiven" DECIMAL(10,2),
    "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "refundMethod" "PaymentMethod" NOT NULL,
    "processedBy" TEXT NOT NULL,
    "refundDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "RefundStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "POSTerminal_locationId_idx" ON "POSTerminal"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "POSSale_saleNumber_key" ON "POSSale"("saleNumber");

-- CreateIndex
CREATE INDEX "POSSale_terminalId_idx" ON "POSSale"("terminalId");

-- CreateIndex
CREATE INDEX "POSSale_employeeId_idx" ON "POSSale"("employeeId");

-- CreateIndex
CREATE INDEX "POSSale_saleDate_idx" ON "POSSale"("saleDate");

-- CreateIndex
CREATE INDEX "POSSaleItem_saleId_idx" ON "POSSaleItem"("saleId");

-- CreateIndex
CREATE INDEX "POSSaleItem_productId_idx" ON "POSSaleItem"("productId");

-- CreateIndex
CREATE INDEX "CashDrawer_terminalId_idx" ON "CashDrawer"("terminalId");

-- CreateIndex
CREATE INDEX "CashDrawer_employeeId_idx" ON "CashDrawer"("employeeId");

-- CreateIndex
CREATE INDEX "CashDrawer_openedAt_idx" ON "CashDrawer"("openedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChartOfAccounts_accountCode_key" ON "ChartOfAccounts"("accountCode");

-- CreateIndex
CREATE INDEX "ChartOfAccounts_accountType_idx" ON "ChartOfAccounts"("accountType");

-- CreateIndex
CREATE INDEX "ChartOfAccounts_parentId_idx" ON "ChartOfAccounts"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_entryNumber_key" ON "JournalEntry"("entryNumber");

-- CreateIndex
CREATE INDEX "JournalEntry_entryDate_idx" ON "JournalEntry"("entryDate");

-- CreateIndex
CREATE INDEX "JournalEntry_createdBy_idx" ON "JournalEntry"("createdBy");

-- CreateIndex
CREATE INDEX "JournalEntry_status_idx" ON "JournalEntry"("status");

-- CreateIndex
CREATE INDEX "JournalLineItem_journalId_idx" ON "JournalLineItem"("journalId");

-- CreateIndex
CREATE INDEX "JournalLineItem_accountId_idx" ON "JournalLineItem"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTerm_name_key" ON "PaymentTerm"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_email_key" ON "Vendor"("email");

-- CreateIndex
CREATE INDEX "Vendor_email_idx" ON "Vendor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_billNumber_key" ON "Bill"("billNumber");

-- CreateIndex
CREATE INDEX "Bill_vendorId_idx" ON "Bill"("vendorId");

-- CreateIndex
CREATE INDEX "Bill_billDate_idx" ON "Bill"("billDate");

-- CreateIndex
CREATE INDEX "Bill_dueDate_idx" ON "Bill"("dueDate");

-- CreateIndex
CREATE INDEX "Bill_status_idx" ON "Bill"("status");

-- CreateIndex
CREATE UNIQUE INDEX "POSCustomer_customerNumber_key" ON "POSCustomer"("customerNumber");

-- CreateIndex
CREATE UNIQUE INDEX "POSCustomer_email_key" ON "POSCustomer"("email");

-- CreateIndex
CREATE INDEX "POSCustomer_email_idx" ON "POSCustomer"("email");

-- CreateIndex
CREATE INDEX "POSCustomer_phone_idx" ON "POSCustomer"("phone");

-- CreateIndex
CREATE INDEX "POSCustomer_customerNumber_idx" ON "POSCustomer"("customerNumber");

-- CreateIndex
CREATE INDEX "Location_isActive_idx" ON "Location"("isActive");

-- CreateIndex
CREATE INDEX "InventoryLocation_productId_idx" ON "InventoryLocation"("productId");

-- CreateIndex
CREATE INDEX "InventoryLocation_locationId_idx" ON "InventoryLocation"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLocation_productId_locationId_key" ON "InventoryLocation"("productId", "locationId");

-- CreateIndex
CREATE INDEX "EmployeeLocation_employeeId_idx" ON "EmployeeLocation"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeLocation_locationId_idx" ON "EmployeeLocation"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeLocation_employeeId_locationId_key" ON "EmployeeLocation"("employeeId", "locationId");

-- CreateIndex
CREATE INDEX "TimeClockEntry_employeeId_idx" ON "TimeClockEntry"("employeeId");

-- CreateIndex
CREATE INDEX "TimeClockEntry_clockIn_idx" ON "TimeClockEntry"("clockIn");

-- CreateIndex
CREATE INDEX "TimeClockEntry_status_idx" ON "TimeClockEntry"("status");

-- CreateIndex
CREATE INDEX "Payment_saleId_idx" ON "Payment"("saleId");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "Payment"("paymentDate");

-- CreateIndex
CREATE INDEX "Payment_paymentMethod_idx" ON "Payment"("paymentMethod");

-- CreateIndex
CREATE INDEX "Refund_saleId_idx" ON "Refund"("saleId");

-- CreateIndex
CREATE INDEX "Refund_refundDate_idx" ON "Refund"("refundDate");

-- AddForeignKey
ALTER TABLE "POSTerminal" ADD CONSTRAINT "POSTerminal_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSSale" ADD CONSTRAINT "POSSale_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "POSTerminal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSSale" ADD CONSTRAINT "POSSale_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSSale" ADD CONSTRAINT "POSSale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "POSCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSSaleItem" ADD CONSTRAINT "POSSaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "POSSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSSaleItem" ADD CONSTRAINT "POSSaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashDrawer" ADD CONSTRAINT "CashDrawer_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "POSTerminal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashDrawer" ADD CONSTRAINT "CashDrawer_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartOfAccounts" ADD CONSTRAINT "ChartOfAccounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ChartOfAccounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_chartOfAccountsId_fkey" FOREIGN KEY ("chartOfAccountsId") REFERENCES "ChartOfAccounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLineItem" ADD CONSTRAINT "JournalLineItem_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLineItem" ADD CONSTRAINT "JournalLineItem_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartOfAccounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "PaymentTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSCustomer" ADD CONSTRAINT "POSCustomer_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "PaymentTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLocation" ADD CONSTRAINT "InventoryLocation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLocation" ADD CONSTRAINT "InventoryLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLocation" ADD CONSTRAINT "EmployeeLocation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLocation" ADD CONSTRAINT "EmployeeLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeClockEntry" ADD CONSTRAINT "TimeClockEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "POSSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "POSSale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
