-- CreateEnum
CREATE TYPE "public"."TaskDetailView" AS ENUM ('drawer', 'card');

-- AlterTable
ALTER TABLE "public"."UserSettings" ADD COLUMN     "taskDetailView" "public"."TaskDetailView" NOT NULL DEFAULT 'drawer';
