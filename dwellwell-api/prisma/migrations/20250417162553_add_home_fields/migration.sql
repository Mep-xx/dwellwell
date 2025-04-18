/*
  Warnings:

  - Added the required column `city` to the `Home` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `Home` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Home" ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "numberOfRooms" INTEGER,
ADD COLUMN     "state" TEXT NOT NULL;
