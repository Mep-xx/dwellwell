-- CreateEnum
CREATE TYPE "public"."DetailLevel" AS ENUM ('generic', 'basic', 'detailed', 'verified');

-- CreateEnum
CREATE TYPE "public"."TrackableSource" AS ENUM ('user_manual_entry', 'user_quick_prompt', 'admin_seed', 'import_csv', 'catalog_match');

-- AlterTable
ALTER TABLE "public"."Trackable" ADD COLUMN     "detailLevel" "public"."DetailLevel" NOT NULL DEFAULT 'generic',
ADD COLUMN     "isGeneric" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "source" "public"."TrackableSource" NOT NULL DEFAULT 'user_manual_entry';

-- CreateTable
CREATE TABLE "public"."TrackableKindTaskTemplate" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "category" TEXT,
    "taskTemplateId" TEXT NOT NULL,

    CONSTRAINT "TrackableKindTaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackableKindTaskTemplate_kind_idx" ON "public"."TrackableKindTaskTemplate"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "TrackableKindTaskTemplate_kind_taskTemplateId_key" ON "public"."TrackableKindTaskTemplate"("kind", "taskTemplateId");

-- CreateIndex
CREATE INDEX "Trackable_roomId_kind_status_idx" ON "public"."Trackable"("roomId", "kind", "status");

-- AddForeignKey
ALTER TABLE "public"."TrackableKindTaskTemplate" ADD CONSTRAINT "TrackableKindTaskTemplate_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "public"."TaskTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
