-- CreateEnum
CREATE TYPE "public"."RuleScope" AS ENUM ('home', 'room', 'trackable');

-- CreateEnum
CREATE TYPE "public"."ConditionTarget" AS ENUM ('home', 'room', 'room_detail', 'trackable');

-- CreateEnum
CREATE TYPE "public"."ConditionOp" AS ENUM ('eq', 'ne', 'contains', 'not_contains', 'exists', 'not_exists', 'gte', 'lte', 'in', 'not_in');

-- CreateTable
CREATE TABLE "public"."TaskGenRule" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "scope" "public"."RuleScope" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "reevalOn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskGenRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskGenRuleTemplate" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "imageUrl" TEXT,
    "category" TEXT,
    "recurrenceInterval" TEXT NOT NULL,
    "taskType" "public"."TaskType" NOT NULL DEFAULT 'GENERAL',
    "criticality" "public"."TaskCriticality" NOT NULL DEFAULT 'medium',
    "canDefer" BOOLEAN NOT NULL DEFAULT true,
    "deferLimitDays" INTEGER NOT NULL DEFAULT 0,
    "estimatedTimeMinutes" INTEGER NOT NULL DEFAULT 30,
    "estimatedCost" INTEGER NOT NULL DEFAULT 0,
    "canBeOutsourced" BOOLEAN NOT NULL DEFAULT false,
    "steps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "equipmentNeeded" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resources" JSONB,

    CONSTRAINT "TaskGenRuleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskGenRuleCondition" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "target" "public"."ConditionTarget" NOT NULL,
    "field" TEXT NOT NULL,
    "op" "public"."ConditionOp" NOT NULL,
    "value" TEXT,
    "values" TEXT[],
    "idx" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TaskGenRuleCondition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskGenRule_key_key" ON "public"."TaskGenRule"("key");

-- CreateIndex
CREATE UNIQUE INDEX "TaskGenRuleTemplate_ruleId_key" ON "public"."TaskGenRuleTemplate"("ruleId");

-- CreateIndex
CREATE INDEX "TaskGenRuleCondition_ruleId_idx_idx" ON "public"."TaskGenRuleCondition"("ruleId", "idx");

-- AddForeignKey
ALTER TABLE "public"."TaskGenRuleTemplate" ADD CONSTRAINT "TaskGenRuleTemplate_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "public"."TaskGenRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskGenRuleCondition" ADD CONSTRAINT "TaskGenRuleCondition_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "public"."TaskGenRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
