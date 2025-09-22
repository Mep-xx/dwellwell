-- CreateEnum
CREATE TYPE "public"."TaskGenIssueStatus" AS ENUM ('open', 'in_progress', 'resolved');

-- CreateEnum
CREATE TYPE "public"."TaskGenIssueCode" AS ENUM ('no_matching_template', 'enrichment_lookup_failed', 'template_eval_error', 'upsert_error');

-- CreateTable
CREATE TABLE "public"."TaskGenerationIssue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "homeId" TEXT,
    "roomId" TEXT,
    "trackableId" TEXT,
    "code" "public"."TaskGenIssueCode" NOT NULL,
    "status" "public"."TaskGenIssueStatus" NOT NULL DEFAULT 'open',
    "message" TEXT,
    "debugPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskGenerationIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskGenerationIssue_userId_createdAt_idx" ON "public"."TaskGenerationIssue"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TaskGenerationIssue_homeId_idx" ON "public"."TaskGenerationIssue"("homeId");

-- CreateIndex
CREATE INDEX "TaskGenerationIssue_trackableId_idx" ON "public"."TaskGenerationIssue"("trackableId");

-- CreateIndex
CREATE INDEX "TaskGenerationIssue_code_status_idx" ON "public"."TaskGenerationIssue"("code", "status");
