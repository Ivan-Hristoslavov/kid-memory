-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "birthdayReminderAt" TIMESTAMP(3),
ADD COLUMN     "childBirthday" TIMESTAMP(3),
ADD COLUMN     "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewRequestAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AccessToken" (
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessToken_pkey" PRIMARY KEY ("token")
);

-- CreateIndex
CREATE INDEX "AccessToken_email_idx" ON "AccessToken"("email");

-- CreateIndex
CREATE INDEX "AccessToken_expiresAt_idx" ON "AccessToken"("expiresAt");
