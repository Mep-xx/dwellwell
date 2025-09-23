/*
  Warnings:

  - A unique constraint covering the columns `[userId,kind,refType,refId]` on the table `GamificationEvent` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."GamificationEvent_kind_refType_refId_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "GamificationEvent_userId_kind_refType_refId_key" ON "public"."GamificationEvent"("userId", "kind", "refType", "refId");
