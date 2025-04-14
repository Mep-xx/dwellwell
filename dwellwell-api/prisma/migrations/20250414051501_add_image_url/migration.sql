/*
  Warnings:

  - You are about to drop the column `image` on the `Trackable` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Trackable" DROP COLUMN "image",
ADD COLUMN     "imageUrl" TEXT;
