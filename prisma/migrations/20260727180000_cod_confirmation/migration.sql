-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "confirmToken" TEXT,
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "recoveryEmailAt" TIMESTAMP(3),
ALTER COLUMN "addons" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_confirmToken_key" ON "Order"("confirmToken");
