/*
  Warnings:

  - You are about to drop the column `image` on the `TaskTemplate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TaskTemplate" DROP COLUMN "image",
ADD COLUMN     "imageUrl" TEXT;
