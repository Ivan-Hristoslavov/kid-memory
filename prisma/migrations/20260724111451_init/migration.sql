-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'GENERATING', 'PREVIEW_READY', 'CONFIRMED', 'PRINTING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('DIGITAL', 'POSTER_A4', 'POSTER_A3', 'PREMIUM');

-- CreateEnum
CREATE TYPE "Courier" AS ENUM ('ECONT', 'SPEEDY');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('OFFICE', 'ADDRESS', 'LOCKER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('BOY', 'GIRL');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'STRIPE', 'REVOLUT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" SERIAL NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'CREATED',
    "childName" TEXT NOT NULL,
    "childAge" INTEGER NOT NULL,
    "childGender" "Gender" NOT NULL,
    "photoKey" TEXT,
    "words" JSONB NOT NULL,
    "animals" TEXT[],
    "style" TEXT NOT NULL,
    "productType" "ProductType",
    "priceBGN" DECIMAL(10,2),
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COD',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "customerName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "city" TEXT,
    "address" TEXT,
    "courier" "Courier",
    "deliveryMethod" "DeliveryMethod",
    "courierOffice" TEXT,
    "trackingNumber" TEXT,
    "previewImage" TEXT,
    "finalImage" TEXT,
    "finalPdf" TEXT,
    "emailsSent" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_email_idx" ON "Order"("email");
