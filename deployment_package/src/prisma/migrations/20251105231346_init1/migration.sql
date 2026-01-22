-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'USER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'sent', 'partially_paid', 'paid');

-- CreateEnum
CREATE TYPE "PackingSlipStatus" AS ENUM ('awaiting_collection', 'en_route', 'delivered', 'collected');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('draft', 'submitted', 'approved', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('loading_offloading', 'buttoning_up_during_event', 'standby', 'build', 'takedown_return', 'roof_floor_walls', 'carpeting_general_cleaning');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "WarehouseStatus" AS ENUM ('active', 'inactive', 'maintenance');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('inbound', 'outbound', 'transfer', 'adjustment', 'return');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('USER', 'INVOICE', 'ORDER', 'PRODUCT', 'CUSTOMER', 'PACKING_SLIP', 'WAREHOUSE', 'INVENTORY', 'PROJECT', 'BOQ', 'QUOTE');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('AVAILABLE', 'ON_DELIVERY', 'OFF_DUTY', 'ON_LEAVE');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('TRUCK', 'VAN', 'PICKUP', 'MOTORCYCLE', 'OTHER');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED');

-- CreateEnum
CREATE TYPE "DeliveryPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "wooId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "price" TEXT,
    "regularPrice" TEXT,
    "salePrice" TEXT,
    "stockStatus" TEXT NOT NULL DEFAULT 'instock',
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "image" TEXT,
    "images" TEXT DEFAULT '[]',
    "categories" TEXT DEFAULT '[]',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'publish',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "wooId" INTEGER NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" INTEGER,
    "status" TEXT NOT NULL,
    "total" TEXT,
    "subtotal" TEXT,
    "shippingTotal" TEXT,
    "taxTotal" TEXT,
    "discountTotal" TEXT,
    "paymentMethod" TEXT,
    "paymentMethodTitle" TEXT,
    "customerNote" TEXT,
    "dateCreated" TIMESTAMP(3),
    "datePaid" TIMESTAMP(3),
    "dateCompleted" TIMESTAMP(3),
    "shippingAddress" TEXT DEFAULT '{}',
    "billingAddress" TEXT DEFAULT '{}',
    "lineItems" TEXT DEFAULT '[]',
    "customer" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "wooId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "username" TEXT,
    "role" TEXT,
    "avatarUrl" TEXT,
    "billingAddress" TEXT DEFAULT '{}',
    "shippingAddress" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "wooOrderId" INTEGER NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "customerId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "orderStatus" TEXT,
    "invoiceStatus" "InvoiceStatus" NOT NULL DEFAULT 'draft',
    "amount" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "customerName" TEXT,
    "customerEmail" TEXT,
    "billingAddress" TEXT NOT NULL DEFAULT '{}',
    "lineItems" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingSlip" (
    "id" TEXT NOT NULL,
    "wooOrderId" INTEGER NOT NULL,
    "packingSlipNumber" TEXT NOT NULL,
    "status" "PackingSlipStatus" NOT NULL DEFAULT 'awaiting_collection',
    "boothNumber" TEXT,
    "assignedUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackingSlip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orderId" INTEGER,
    "status" "ProjectStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewDetail" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "workType" "WorkType" NOT NULL,
    "numberOfCrew" INTEGER NOT NULL,
    "shiftsNeeded" INTEGER NOT NULL,
    "fare" DOUBLE PRECISION NOT NULL,
    "accommodation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transport" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "numberOfTrips" INTEGER NOT NULL,
    "pricePerTrip" DOUBLE PRECISION NOT NULL,
    "contingency" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTentQuote" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "eventType" TEXT NOT NULL,
    "eventStartDate" TIMESTAMP(3),
    "eventEndDate" TIMESTAMP(3),
    "eventVenue" TEXT,
    "numberOfGuests" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 1,
    "tentType" TEXT NOT NULL,
    "structureSummary" TEXT,
    "lineItems" TEXT NOT NULL DEFAULT '[]',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "vat" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventTentQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "managerName" TEXT,
    "capacity" DOUBLE PRECISION,
    "status" "WarehouseStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseLocation" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "aisle" TEXT,
    "rack" TEXT,
    "shelf" TEXT,
    "bin" TEXT,
    "locationCode" TEXT NOT NULL,
    "capacity" DOUBLE PRECISION,
    "occupied" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "locationId" TEXT,
    "sku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER DEFAULT 10,
    "unit" TEXT DEFAULT 'pcs',
    "costPrice" DOUBLE PRECISION,
    "sellingPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "fromLocation" TEXT,
    "toLocation" TEXT,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BOQ" (
    "id" SERIAL NOT NULL,
    "boqNumber" TEXT NOT NULL,
    "quoteId" TEXT,
    "projectId" TEXT,
    "projectName" TEXT NOT NULL,
    "projectLocation" TEXT,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientPhone" TEXT,
    "eventDate" TIMESTAMP(3),
    "duration" INTEGER NOT NULL DEFAULT 1,
    "sections" TEXT NOT NULL,
    "subtotal" TEXT NOT NULL,
    "vat" TEXT NOT NULL,
    "total" TEXT NOT NULL,
    "internalCost" TEXT,
    "profitAmount" TEXT,
    "profitMargin" TEXT,
    "discount" TEXT,
    "paymentTerms" TEXT,
    "validityDays" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BOQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectCostReport" (
    "id" SERIAL NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "estimatedCost" TEXT NOT NULL,
    "actualCost" TEXT NOT NULL,
    "variance" TEXT NOT NULL,
    "variancePercent" TEXT NOT NULL,
    "revenue" TEXT NOT NULL,
    "profit" TEXT NOT NULL,
    "profitMargin" TEXT NOT NULL,
    "laborCosts" TEXT,
    "materialCosts" TEXT,
    "equipmentCosts" TEXT,
    "transportCosts" TEXT,
    "overheadCosts" TEXT,
    "otherCosts" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "remarks" TEXT,
    "generatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectCostReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "relatedUserId" TEXT,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "licenseNumber" TEXT,
    "licenseExpiry" TIMESTAMP(3),
    "status" "DriverStatus" NOT NULL DEFAULT 'AVAILABLE',
    "vehicleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "type" "VehicleType" NOT NULL DEFAULT 'TRUCK',
    "capacity" DOUBLE PRECISION,
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "mileage" DOUBLE PRECISION DEFAULT 0,
    "lastService" TIMESTAMP(3),
    "nextService" TIMESTAMP(3),
    "fuelType" TEXT,
    "engineCapacity" DOUBLE PRECISION,
    "fuelConsumption" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryAssignment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledTime" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'SCHEDULED',
    "priority" "DeliveryPriority" NOT NULL DEFAULT 'NORMAL',
    "route" TEXT,
    "notes" TEXT,
    "startTime" TIMESTAMP(3),
    "completedTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Product_wooId_key" ON "Product"("wooId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_wooId_idx" ON "Product"("wooId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_syncedAt_idx" ON "Product"("syncedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_wooId_key" ON "Order"("wooId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_wooId_idx" ON "Order"("wooId");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_syncedAt_idx" ON "Order"("syncedAt");

-- CreateIndex
CREATE INDEX "Order_dateCreated_idx" ON "Order"("dateCreated");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_wooId_key" ON "Customer"("wooId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_wooId_idx" ON "Customer"("wooId");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_syncedAt_idx" ON "Customer"("syncedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_wooOrderId_key" ON "Invoice"("wooOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_wooOrderId_idx" ON "Invoice"("wooOrderId");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_orderStatus_idx" ON "Invoice"("orderStatus");

-- CreateIndex
CREATE INDEX "Invoice_invoiceStatus_idx" ON "Invoice"("invoiceStatus");

-- CreateIndex
CREATE INDEX "Invoice_date_idx" ON "Invoice"("date");

-- CreateIndex
CREATE UNIQUE INDEX "PackingSlip_wooOrderId_key" ON "PackingSlip"("wooOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "PackingSlip_packingSlipNumber_key" ON "PackingSlip"("packingSlipNumber");

-- CreateIndex
CREATE INDEX "PackingSlip_wooOrderId_idx" ON "PackingSlip"("wooOrderId");

-- CreateIndex
CREATE INDEX "PackingSlip_status_idx" ON "PackingSlip"("status");

-- CreateIndex
CREATE INDEX "PackingSlip_assignedUserId_idx" ON "PackingSlip"("assignedUserId");

-- CreateIndex
CREATE INDEX "PackingSlip_createdAt_idx" ON "PackingSlip"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Project_orderId_key" ON "Project"("orderId");

-- CreateIndex
CREATE INDEX "Project_orderId_idx" ON "Project"("orderId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");

-- CreateIndex
CREATE INDEX "CrewDetail_projectId_idx" ON "CrewDetail"("projectId");

-- CreateIndex
CREATE INDEX "CrewDetail_workType_idx" ON "CrewDetail"("workType");

-- CreateIndex
CREATE INDEX "Transport_projectId_idx" ON "Transport"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "EventTentQuote_quoteNumber_key" ON "EventTentQuote"("quoteNumber");

-- CreateIndex
CREATE INDEX "EventTentQuote_quoteNumber_idx" ON "EventTentQuote"("quoteNumber");

-- CreateIndex
CREATE INDEX "EventTentQuote_status_idx" ON "EventTentQuote"("status");

-- CreateIndex
CREATE INDEX "EventTentQuote_contactEmail_idx" ON "EventTentQuote"("contactEmail");

-- CreateIndex
CREATE INDEX "EventTentQuote_createdAt_idx" ON "EventTentQuote"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");

-- CreateIndex
CREATE INDEX "Warehouse_code_idx" ON "Warehouse"("code");

-- CreateIndex
CREATE INDEX "Warehouse_status_idx" ON "Warehouse"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseLocation_locationCode_key" ON "WarehouseLocation"("locationCode");

-- CreateIndex
CREATE INDEX "WarehouseLocation_warehouseId_idx" ON "WarehouseLocation"("warehouseId");

-- CreateIndex
CREATE INDEX "WarehouseLocation_locationCode_idx" ON "WarehouseLocation"("locationCode");

-- CreateIndex
CREATE INDEX "InventoryItem_warehouseId_idx" ON "InventoryItem"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryItem_locationId_idx" ON "InventoryItem"("locationId");

-- CreateIndex
CREATE INDEX "InventoryItem_sku_idx" ON "InventoryItem"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_warehouseId_sku_locationId_key" ON "InventoryItem"("warehouseId", "sku", "locationId");

-- CreateIndex
CREATE INDEX "StockMovement_warehouseId_idx" ON "StockMovement"("warehouseId");

-- CreateIndex
CREATE INDEX "StockMovement_inventoryId_idx" ON "StockMovement"("inventoryId");

-- CreateIndex
CREATE INDEX "StockMovement_type_idx" ON "StockMovement"("type");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BOQ_boqNumber_key" ON "BOQ"("boqNumber");

-- CreateIndex
CREATE INDEX "BOQ_quoteId_idx" ON "BOQ"("quoteId");

-- CreateIndex
CREATE INDEX "BOQ_projectId_idx" ON "BOQ"("projectId");

-- CreateIndex
CREATE INDEX "BOQ_status_idx" ON "BOQ"("status");

-- CreateIndex
CREATE INDEX "BOQ_createdAt_idx" ON "BOQ"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCostReport_reportNumber_key" ON "ProjectCostReport"("reportNumber");

-- CreateIndex
CREATE INDEX "ProjectCostReport_projectId_idx" ON "ProjectCostReport"("projectId");

-- CreateIndex
CREATE INDEX "ProjectCostReport_status_idx" ON "ProjectCostReport"("status");

-- CreateIndex
CREATE INDEX "ProjectCostReport_createdAt_idx" ON "ProjectCostReport"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_performedById_idx" ON "ActivityLog"("performedById");

-- CreateIndex
CREATE INDEX "ActivityLog_relatedUserId_idx" ON "ActivityLog"("relatedUserId");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_idx" ON "ActivityLog"("entityType");

-- CreateIndex
CREATE INDEX "ActivityLog_entityId_idx" ON "ActivityLog"("entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_userId_key" ON "Driver"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_email_key" ON "Driver"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_licenseNumber_key" ON "Driver"("licenseNumber");

-- CreateIndex
CREATE INDEX "Driver_status_idx" ON "Driver"("status");

-- CreateIndex
CREATE INDEX "Driver_vehicleId_idx" ON "Driver"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_registrationNo_key" ON "Vehicle"("registrationNo");

-- CreateIndex
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");

-- CreateIndex
CREATE INDEX "Vehicle_type_idx" ON "Vehicle"("type");

-- CreateIndex
CREATE INDEX "DeliveryAssignment_orderId_idx" ON "DeliveryAssignment"("orderId");

-- CreateIndex
CREATE INDEX "DeliveryAssignment_driverId_idx" ON "DeliveryAssignment"("driverId");

-- CreateIndex
CREATE INDEX "DeliveryAssignment_vehicleId_idx" ON "DeliveryAssignment"("vehicleId");

-- CreateIndex
CREATE INDEX "DeliveryAssignment_scheduledDate_idx" ON "DeliveryAssignment"("scheduledDate");

-- CreateIndex
CREATE INDEX "DeliveryAssignment_status_idx" ON "DeliveryAssignment"("status");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingSlip" ADD CONSTRAINT "PackingSlip_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewDetail" ADD CONSTRAINT "CrewDetail_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transport" ADD CONSTRAINT "Transport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseLocation" ADD CONSTRAINT "WarehouseLocation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WarehouseLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_relatedUserId_fkey" FOREIGN KEY ("relatedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryAssignment" ADD CONSTRAINT "DeliveryAssignment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryAssignment" ADD CONSTRAINT "DeliveryAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryAssignment" ADD CONSTRAINT "DeliveryAssignment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
