-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('DRAFT', 'GENERATING', 'READY', 'ORDERED', 'PRINTING', 'SHIPPED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "BookPageKind" AS ENUM ('COVER', 'DEDICATION', 'STORY', 'BACK_COVER');

-- CreateEnum
CREATE TYPE "BookPageStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "BookAgeGroup" AS ENUM ('AGE_3_5', 'AGE_5_7', 'AGE_7_9');

-- CreateEnum
CREATE TYPE "BookMood" AS ENUM ('FUNNY', 'MAGICAL', 'ADVENTUROUS', 'CALM', 'EDUCATIONAL');

-- CreateEnum
CREATE TYPE "BookJobKind" AS ENUM ('STORY', 'ILLUSTRATIONS', 'PAGE', 'PDF');

-- CreateEnum
CREATE TYPE "BookJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'DONE', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductType" ADD VALUE 'BOOK_PDF';
ALTER TYPE "ProductType" ADD VALUE 'BOOK_PRINTED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "bookId" TEXT;

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "bookNumber" SERIAL NOT NULL,
    "status" "BookStatus" NOT NULL DEFAULT 'DRAFT',
    "adventure" TEXT NOT NULL,
    "customIdea" TEXT,
    "ageGroup" "BookAgeGroup" NOT NULL DEFAULT 'AGE_5_7',
    "mood" "BookMood" NOT NULL DEFAULT 'MAGICAL',
    "mustInclude" TEXT[],
    "artStyle" TEXT NOT NULL,
    "relationships" TEXT,
    "dedication" TEXT,
    "title" TEXT,
    "subtitle" TEXT,
    "story" JSONB,
    "coverImage" TEXT,
    "finalPdf" TEXT,
    "leadEmail" TEXT,
    "aiCostEUR" DECIMAL(10,4),
    "aiRuns" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookCharacter" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "age" DOUBLE PRECISION,
    "gender" "Gender",
    "description" TEXT,
    "interests" TEXT,
    "favouriteToy" TEXT,
    "favouriteAnimal" TEXT,
    "photoKey" TEXT,
    "referenceSheet" JSONB,
    "referenceImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookPage" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "kind" "BookPageKind" NOT NULL DEFAULT 'STORY',
    "status" "BookPageStatus" NOT NULL DEFAULT 'PENDING',
    "text" TEXT,
    "imagePrompt" TEXT,
    "imageKey" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookGeneration" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "kind" "BookJobKind" NOT NULL,
    "status" "BookJobStatus" NOT NULL DEFAULT 'QUEUED',
    "pageNumber" INTEGER,
    "done" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "claimedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceEUR" DECIMAL(10,2) NOT NULL,
    "variants" JSONB NOT NULL DEFAULT '{}',
    "photoKey" TEXT,
    "text" TEXT,
    "giftWrap" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Book_bookNumber_key" ON "Book"("bookNumber");

-- CreateIndex
CREATE INDEX "Book_status_createdAt_idx" ON "Book"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Book_leadEmail_idx" ON "Book"("leadEmail");

-- CreateIndex
CREATE INDEX "BookCharacter_bookId_idx" ON "BookCharacter"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "BookCharacter_bookId_ordinal_key" ON "BookCharacter"("bookId", "ordinal");

-- CreateIndex
CREATE INDEX "BookPage_bookId_pageNumber_idx" ON "BookPage"("bookId", "pageNumber");

-- CreateIndex
CREATE INDEX "BookPage_status_idx" ON "BookPage"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BookPage_bookId_pageNumber_key" ON "BookPage"("bookId", "pageNumber");

-- CreateIndex
CREATE INDEX "BookGeneration_status_createdAt_idx" ON "BookGeneration"("status", "createdAt");

-- CreateIndex
CREATE INDEX "BookGeneration_bookId_kind_idx" ON "BookGeneration"("bookId", "kind");

-- CreateIndex
CREATE INDEX "OrderLine_orderId_idx" ON "OrderLine"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_bookId_key" ON "Order"("bookId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookCharacter" ADD CONSTRAINT "BookCharacter_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookPage" ADD CONSTRAINT "BookPage_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookGeneration" ADD CONSTRAINT "BookGeneration_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
