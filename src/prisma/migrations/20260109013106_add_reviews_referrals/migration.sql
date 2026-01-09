-- CreateTable
CREATE TABLE "ProductReview" (
    "id" TEXT NOT NULL,
    "wooId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "productImage" TEXT,
    "reviewer" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar" TEXT,
    "rating" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "content" TEXT NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar" TEXT,
    "referredUser" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "value" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductReview_wooId_key" ON "ProductReview"("wooId");

-- CreateIndex
CREATE INDEX "ProductReview_productId_idx" ON "ProductReview"("productId");

-- CreateIndex
CREATE INDEX "ProductReview_status_idx" ON "ProductReview"("status");

-- CreateIndex
CREATE INDEX "Referral_email_idx" ON "Referral"("email");
