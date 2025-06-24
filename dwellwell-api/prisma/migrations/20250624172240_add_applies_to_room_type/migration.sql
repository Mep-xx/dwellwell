/*
  Warnings:

  - Added the required column `appliesToRoomType` to the `TaskTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TaskTemplate" ADD COLUMN     "appliesToRoomType" TEXT NOT NULL,
ADD COLUMN     "roomType" TEXT;
