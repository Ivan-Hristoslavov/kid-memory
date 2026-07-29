-- Rename price column to EUR (preserves existing values; amounts re-priced in catalog).
ALTER TABLE "Order" RENAME COLUMN "priceBGN" TO "priceEUR";
