/*
  Warnings:

  - Added the required column `sourceType` to the `UserTask` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserTaskSourceType" AS ENUM ('room', 'trackable');

-- AlterTable
ALTER TABLE "UserTask" ADD COLUMN     "roomId" TEXT,
ADD COLUMN     "sourceType" "UserTaskSourceType" NOT NULL;
