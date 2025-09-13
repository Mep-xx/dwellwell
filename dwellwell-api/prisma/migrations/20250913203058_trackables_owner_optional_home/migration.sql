/*
  Warnings:

  - You are about to drop the column `supersededById` on the `Trackable` table. All the data in the column will be lost.
  - Added the required column `ownerUserId` to the `Trackable` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Trackable" DROP CONSTRAINT "Trackable_supersededById_fkey";

-- DropIndex
DROP INDEX "public"."Trackable_homeId_idx";

-- DropIndex
DROP INDEX "public"."Trackable_roomId_idx";

-- DropIndex
DROP INDEX "public"."Trackable_supersededById_idx";

-- AlterTable
ALTER TABLE "public"."Trackable" DROP COLUMN "supersededById",
ADD COLUMN     "ownerUserId" TEXT NOT NULL,
ADD COLUMN     "supersedesId" TEXT,
ALTER COLUMN "homeId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Trackable_ownerUserId_idx" ON "public"."Trackable"("ownerUserId");

-- CreateIndex
CREATE INDEX "Trackable_supersedesId_idx" ON "public"."Trackable"("supersedesId");

-- AddForeignKey
ALTER TABLE "public"."Trackable" ADD CONSTRAINT "Trackable_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Trackable" ADD CONSTRAINT "Trackable_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "public"."Trackable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
