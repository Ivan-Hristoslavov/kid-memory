-- Optional checkout extras (frame, premium photo paper, gift wrap).
ALTER TABLE "Order" ADD COLUMN "addons" TEXT[] DEFAULT ARRAY[]::TEXT[];
