-- Customer reviews (moderated) + editable site settings.
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "city" TEXT,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "orderNumber" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Review_status_createdAt_idx" ON "Review"("status", "createdAt");

CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);
