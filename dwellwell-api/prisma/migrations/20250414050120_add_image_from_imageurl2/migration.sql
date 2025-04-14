/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Trackable` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Trackable" DROP COLUMN "imageUrl",
ADD COLUMN     "image" TEXT;
