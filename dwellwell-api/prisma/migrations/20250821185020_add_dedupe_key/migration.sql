/*
  Warnings:

  - A unique constraint covering the columns `[dedupeKey]` on the table `UserTask` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dedupeKey` to the `UserTask` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserTask" ADD COLUMN     "dedupeKey" TEXT NOT NULL,
ALTER COLUMN "estimatedTimeMinutes" SET DEFAULT 0,
ALTER COLUMN "estimatedCost" SET DEFAULT 0,
ALTER COLUMN "criticality" SET DEFAULT 'medium',
ALTER COLUMN "deferLimitDays" SET DEFAULT 0,
ALTER COLUMN "canBeOutsourced" SET DEFAULT false,
ALTER COLUMN "canDefer" SET DEFAULT true,
ALTER COLUMN "recurrenceInterval" SET DEFAULT '',
ALTER COLUMN "taskType" SET DEFAULT 'GENERAL';

-- CreateIndex
CREATE UNIQUE INDEX "UserTask_dedupeKey_key" ON "UserTask"("dedupeKey");

-- CreateIndex
CREATE INDEX "idx_usertask_user_status_due" ON "UserTask"("userId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "idx_usertask_room" ON "UserTask"("roomId");

-- CreateIndex
CREATE INDEX "idx_usertask_trackable" ON "UserTask"("trackableId");

-- CreateIndex
CREATE INDEX "idx_usertask_template" ON "UserTask"("taskTemplateId");
