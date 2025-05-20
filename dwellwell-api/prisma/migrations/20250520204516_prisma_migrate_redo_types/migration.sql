/*
  Warnings:

  - You are about to drop the column `disabled` on the `Task` table. All the data in the column will be lost.
  - Added the required column `sourceId` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceType` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "disabled",
ADD COLUMN     "sourceId" TEXT NOT NULL,
ADD COLUMN     "sourceType" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "DisabledTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisabledTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DisabledTask_userId_taskId_key" ON "DisabledTask"("userId", "taskId");

-- AddForeignKey
ALTER TABLE "DisabledTask" ADD CONSTRAINT "DisabledTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisabledTask" ADD CONSTRAINT "DisabledTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
