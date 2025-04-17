-- AlterTable
ALTER TABLE "TaskTemplate" ADD COLUMN     "description" TEXT,
ALTER COLUMN "steps" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "equipmentNeeded" SET DEFAULT ARRAY[]::TEXT[];
