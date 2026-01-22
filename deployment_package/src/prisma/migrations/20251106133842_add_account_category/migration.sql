-- AlterTable
ALTER TABLE "ChartOfAccounts" ADD COLUMN     "accountCategory" TEXT;

-- CreateIndex
CREATE INDEX "ChartOfAccounts_accountCategory_idx" ON "ChartOfAccounts"("accountCategory");
