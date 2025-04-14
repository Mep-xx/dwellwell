/*
  Warnings:

  - Added the required column `canDefer` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "canDefer" BOOLEAN NOT NULL;
