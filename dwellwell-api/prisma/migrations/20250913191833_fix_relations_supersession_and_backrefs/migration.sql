/*
  Warnings:

  - Added the required column `updatedAt` to the `Trackable` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."TrackableStatus" AS ENUM ('IN_USE', 'PAUSED', 'RETIRED');

-- CreateEnum
CREATE TYPE "public"."RetiredReason" AS ENUM ('BROKEN', 'SOLD', 'REPLACED', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."TemplateState" AS ENUM ('DRAFT', 'VERIFIED');

-- AlterTable
ALTER TABLE "public"."TaskTemplate" ADD COLUMN     "changelog" TEXT,
ADD COLUMN     "state" "public"."TemplateState" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "updatedBy" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."Trackable" ADD COLUMN     "retiredAt" TIMESTAMP(3),
ADD COLUMN     "retiredReason" "public"."RetiredReason",
ADD COLUMN     "status" "public"."TrackableStatus" NOT NULL DEFAULT 'IN_USE',
ADD COLUMN     "supersededById" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."UserTask" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "overriddenFields" JSONB,
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "sourceTemplateVersion" INTEGER;

-- CreateTable
CREATE TABLE "public"."TrackableAssignment" (
    "id" TEXT NOT NULL,
    "trackableId" TEXT NOT NULL,
    "homeId" TEXT,
    "roomId" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" TIMESTAMP(3),

    CONSTRAINT "TrackableAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LifecycleEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LifecycleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskSnapshotHistory" (
    "id" TEXT NOT NULL,
    "userTaskId" TEXT NOT NULL,
    "fromVersion" INTEGER,
    "toVersion" INTEGER,
    "fieldsChanged" JSONB,
    "snapshotBefore" JSONB,
    "snapshotAfter" JSONB,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskSnapshotHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackableAssignment_trackableId_endAt_idx" ON "public"."TrackableAssignment"("trackableId", "endAt");

-- CreateIndex
CREATE INDEX "TrackableAssignment_homeId_idx" ON "public"."TrackableAssignment"("homeId");

-- CreateIndex
CREATE INDEX "TrackableAssignment_roomId_idx" ON "public"."TrackableAssignment"("roomId");

-- CreateIndex
CREATE INDEX "LifecycleEvent_userId_entity_action_createdAt_idx" ON "public"."LifecycleEvent"("userId", "entity", "action", "createdAt");

-- CreateIndex
CREATE INDEX "TaskSnapshotHistory_userTaskId_appliedAt_idx" ON "public"."TaskSnapshotHistory"("userTaskId", "appliedAt");

-- CreateIndex
CREATE INDEX "Trackable_homeId_idx" ON "public"."Trackable"("homeId");

-- CreateIndex
CREATE INDEX "Trackable_roomId_idx" ON "public"."Trackable"("roomId");

-- CreateIndex
CREATE INDEX "Trackable_status_idx" ON "public"."Trackable"("status");

-- CreateIndex
CREATE INDEX "Trackable_applianceCatalogId_idx" ON "public"."Trackable"("applianceCatalogId");

-- CreateIndex
CREATE INDEX "Trackable_supersededById_idx" ON "public"."Trackable"("supersededById");

-- CreateIndex
CREATE INDEX "UserTask_pausedAt_archivedAt_idx" ON "public"."UserTask"("pausedAt", "archivedAt");

-- AddForeignKey
ALTER TABLE "public"."Trackable" ADD CONSTRAINT "Trackable_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "public"."Trackable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrackableAssignment" ADD CONSTRAINT "TrackableAssignment_trackableId_fkey" FOREIGN KEY ("trackableId") REFERENCES "public"."Trackable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrackableAssignment" ADD CONSTRAINT "TrackableAssignment_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "public"."Home"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrackableAssignment" ADD CONSTRAINT "TrackableAssignment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LifecycleEvent" ADD CONSTRAINT "LifecycleEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskSnapshotHistory" ADD CONSTRAINT "TaskSnapshotHistory_userTaskId_fkey" FOREIGN KEY ("userTaskId") REFERENCES "public"."UserTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
