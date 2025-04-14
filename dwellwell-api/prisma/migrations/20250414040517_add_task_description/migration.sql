/*
  Warnings:

  - The `status` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `canBeOutsourced` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `criticality` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deferLimitDays` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimatedCost` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimatedTimeMinutes` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recurrenceInterval` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `dueDate` on the `Task` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('GENERAL', 'AI_GENERATED', 'USER_DEFINED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED', 'SNOOZED');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "canBeOutsourced" BOOLEAN NOT NULL,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "criticality" TEXT NOT NULL,
ADD COLUMN     "deferLimitDays" INTEGER NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "estimatedCost" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "estimatedTimeMinutes" INTEGER NOT NULL,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "recurrenceInterval" TEXT NOT NULL,
ADD COLUMN     "taskType" "TaskType" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "dueDate",
ADD COLUMN     "dueDate" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "TaskStatus" NOT NULL DEFAULT 'PENDING';
