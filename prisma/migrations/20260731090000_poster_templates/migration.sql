-- CreateEnum
CREATE TYPE "PosterTemplate" AS ENUM ('KID_WORDS', 'PORTRAIT_LINES', 'COUPLE', 'PET', 'BABY_STATS');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "template" "PosterTemplate";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "subjects" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "template" "PosterTemplate" NOT NULL DEFAULT 'KID_WORDS',
ALTER COLUMN "childAge" DROP NOT NULL,
ALTER COLUMN "childGender" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Order_template_createdAt_idx" ON "Order"("template", "createdAt");
