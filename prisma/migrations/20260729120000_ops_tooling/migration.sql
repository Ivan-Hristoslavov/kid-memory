-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "aiCostEUR" DECIMAL(10,4),
ADD COLUMN     "aiRuns" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "BlockedPhone" (
    "phone" TEXT NOT NULL,
    "reason" TEXT,
    "orderRef" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedPhone_pkey" PRIMARY KEY ("phone")
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "actor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminLog_orderId_createdAt_idx" ON "AdminLog"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminLog_createdAt_idx" ON "AdminLog"("createdAt");
