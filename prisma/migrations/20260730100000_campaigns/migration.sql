-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "startMonth" INTEGER NOT NULL,
    "startDay" INTEGER NOT NULL,
    "endMonth" INTEGER NOT NULL,
    "endDay" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "heroBadge" TEXT,
    "promoText" TEXT,
    "promoSecondary" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "accentColor" TEXT,
    "auraColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Campaign_enabled_idx" ON "Campaign"("enabled");
