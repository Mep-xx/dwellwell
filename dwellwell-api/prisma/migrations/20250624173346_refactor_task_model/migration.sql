/*
  Warnings:

  - You are about to drop the column `roomType` on the `TaskTemplate` table. All the data in the column will be lost.
  - You are about to drop the `DisabledTask` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DisabledTask" DROP CONSTRAINT "DisabledTask_taskId_fkey";

-- DropForeignKey
ALTER TABLE "DisabledTask" DROP CONSTRAINT "DisabledTask_userId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_roomId_fkey";

-- AlterTable
ALTER TABLE "TaskTemplate" DROP COLUMN "roomType";

-- DropTable
DROP TABLE "DisabledTask";

-- DropTable
DROP TABLE "Task";

-- CreateTable
CREATE TABLE "DismissedUserTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userTaskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DismissedUserTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DismissedUserTask_userId_userTaskId_key" ON "DismissedUserTask"("userId", "userTaskId");

-- AddForeignKey
ALTER TABLE "DismissedUserTask" ADD CONSTRAINT "DismissedUserTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DismissedUserTask" ADD CONSTRAINT "DismissedUserTask_userTaskId_fkey" FOREIGN KEY ("userTaskId") REFERENCES "UserTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
