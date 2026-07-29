-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "children" JSONB NOT NULL DEFAULT '[]';
