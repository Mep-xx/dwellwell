/*
  Warnings:

  - A unique constraint covering the columns `[userId,dedupeKey]` on the table `UserTask` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserTaskSourceType" ADD VALUE 'home';
ALTER TYPE "UserTaskSourceType" ADD VALUE 'manual';

-- DropForeignKey
ALTER TABLE "public"."ForumPost" DROP CONSTRAINT "ForumPost_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ForumPost" DROP CONSTRAINT "ForumPost_threadId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ForumPostEdit" DROP CONSTRAINT "ForumPostEdit_editorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ForumPostEdit" DROP CONSTRAINT "ForumPostEdit_postId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ForumTagOnThread" DROP CONSTRAINT "ForumTagOnThread_tagId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ForumTagOnThread" DROP CONSTRAINT "ForumTagOnThread_threadId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ForumThread" DROP CONSTRAINT "ForumThread_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ForumThread" DROP CONSTRAINT "ForumThread_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ForumVote" DROP CONSTRAINT "ForumVote_postId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ForumVote" DROP CONSTRAINT "ForumVote_threadId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ForumVote" DROP CONSTRAINT "ForumVote_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ReputationSnapshot" DROP CONSTRAINT "ReputationSnapshot_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserTask" DROP CONSTRAINT "UserTask_homeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserTask" DROP CONSTRAINT "UserTask_roomId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserTask" DROP CONSTRAINT "UserTask_trackableId_fkey";

-- DropIndex
DROP INDEX "public"."UserTask_dedupeKey_key";

-- AlterTable
ALTER TABLE "UserTask" ALTER COLUMN "dedupeKey" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserTask_userId_dedupeKey_key" ON "UserTask"("userId", "dedupeKey");

-- AddForeignKey
ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_trackableId_fkey" FOREIGN KEY ("trackableId") REFERENCES "Trackable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ForumCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumVote" ADD CONSTRAINT "ForumVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumVote" ADD CONSTRAINT "ForumVote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumVote" ADD CONSTRAINT "ForumVote_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumTagOnThread" ADD CONSTRAINT "ForumTagOnThread_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumTagOnThread" ADD CONSTRAINT "ForumTagOnThread_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ForumTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPostEdit" ADD CONSTRAINT "ForumPostEdit_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPostEdit" ADD CONSTRAINT "ForumPostEdit_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReputationSnapshot" ADD CONSTRAINT "ReputationSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_trackableId_fkey" FOREIGN KEY ("trackableId") REFERENCES "Trackable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
