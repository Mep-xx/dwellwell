-- AlterTable
ALTER TABLE "public"."UserTask" ADD COLUMN     "homeId" TEXT;

-- CreateIndex
CREATE INDEX "UserTask_homeId_idx" ON "public"."UserTask"("homeId");

-- CreateIndex
CREATE INDEX "UserTask_userId_homeId_status_dueDate_idx" ON "public"."UserTask"("userId", "homeId", "status", "dueDate");

-- AddForeignKey
ALTER TABLE "public"."UserTask" ADD CONSTRAINT "UserTask_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "public"."Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;
