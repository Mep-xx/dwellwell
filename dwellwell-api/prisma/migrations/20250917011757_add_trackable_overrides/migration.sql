/*
  Warnings:

  - You are about to drop the column `attributes` on the `Trackable` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Trackable" DROP COLUMN "attributes",
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "model" TEXT;
