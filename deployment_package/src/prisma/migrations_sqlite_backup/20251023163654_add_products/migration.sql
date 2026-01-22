-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "rating" REAL NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'publish',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_wooId_key" ON "Product"("wooId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_wooId_idx" ON "Product"("wooId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_syncedAt_idx" ON "Product"("syncedAt");
