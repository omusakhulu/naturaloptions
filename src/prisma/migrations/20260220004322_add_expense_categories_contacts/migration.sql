-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseContact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpenseCategory_parentId_idx" ON "ExpenseCategory"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_name_parentId_key" ON "ExpenseCategory"("name", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseContact_name_key" ON "ExpenseContact"("name");

-- AddForeignKey
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
