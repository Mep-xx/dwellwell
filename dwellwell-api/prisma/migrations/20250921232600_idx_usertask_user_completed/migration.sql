-- CreateIndex
CREATE INDEX "UserTask_userId_completedDate_idx" ON "public"."UserTask"("userId", "completedDate");
