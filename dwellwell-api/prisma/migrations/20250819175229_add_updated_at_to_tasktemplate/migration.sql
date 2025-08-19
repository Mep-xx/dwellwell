/*
  Warnings:

  - Added the required column `updatedAt` to the `TaskTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TaskTemplate" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "deferLimitDays" SET DEFAULT 7;

-- CreateIndex
CREATE INDEX "TaskTemplate_category_idx" ON "TaskTemplate"("category");

-- CreateIndex
CREATE INDEX "TaskTemplate_recurrenceInterval_idx" ON "TaskTemplate"("recurrenceInterval");

-- CreateIndex
CREATE INDEX "TaskTemplate_criticality_idx" ON "TaskTemplate"("criticality");
