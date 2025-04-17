-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "TaskCriticality" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('GENERAL', 'AI_GENERATED', 'USER_DEFINED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Home" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "nickname" TEXT,
    "zillowId" TEXT,
    "squareFeet" INTEGER,
    "lotSize" DOUBLE PRECISION,
    "yearBuilt" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Home_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "floor" INTEGER,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LawnProfile" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "squareFeet" INTEGER,
    "usesLawnService" BOOLEAN DEFAULT false,
    "soilType" TEXT,
    "sunExposure" TEXT,
    "irrigationInstalled" BOOLEAN DEFAULT false,

    CONSTRAINT "LawnProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplianceCatalog" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "notes" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplianceCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trackable" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "roomId" TEXT,
    "applianceCatalogId" TEXT,
    "userDefinedName" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "serialNumber" TEXT,
    "imageUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trackable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT,
    "image" TEXT,
    "category" TEXT,
    "recurrenceInterval" TEXT NOT NULL,
    "taskType" "TaskType" NOT NULL,
    "criticality" "TaskCriticality" NOT NULL DEFAULT 'medium',
    "steps" TEXT[],
    "equipmentNeeded" TEXT[],
    "resources" JSONB,

    CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplianceTaskTemplate" (
    "id" TEXT NOT NULL,
    "applianceCatalogId" TEXT NOT NULL,
    "taskTemplateId" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ApplianceTaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT,
    "estimatedTimeMinutes" INTEGER NOT NULL,
    "estimatedCost" INTEGER NOT NULL,
    "criticality" "TaskCriticality" NOT NULL,
    "deferLimitDays" INTEGER NOT NULL,
    "canBeOutsourced" BOOLEAN NOT NULL,
    "canDefer" BOOLEAN NOT NULL,
    "recurrenceInterval" TEXT NOT NULL,
    "taskType" "TaskType" NOT NULL,
    "imageUrl" TEXT,
    "icon" TEXT,
    "steps" JSONB,
    "equipmentNeeded" JSONB,
    "resources" JSONB,
    "userId" TEXT NOT NULL,
    "trackableId" TEXT NOT NULL,
    "taskTemplateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIQueryHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "query" TEXT NOT NULL,
    "source" TEXT,
    "responseSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIQueryHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LawnProfile_homeId_key" ON "LawnProfile"("homeId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplianceCatalog_brand_model_key" ON "ApplianceCatalog"("brand", "model");

-- CreateIndex
CREATE UNIQUE INDEX "ApplianceTaskTemplate_applianceCatalogId_taskTemplateId_key" ON "ApplianceTaskTemplate"("applianceCatalogId", "taskTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingAccount_userId_key" ON "BillingAccount"("userId");

-- AddForeignKey
ALTER TABLE "LoginActivity" ADD CONSTRAINT "LoginActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Home" ADD CONSTRAINT "Home_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawnProfile" ADD CONSTRAINT "LawnProfile_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trackable" ADD CONSTRAINT "Trackable_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trackable" ADD CONSTRAINT "Trackable_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trackable" ADD CONSTRAINT "Trackable_applianceCatalogId_fkey" FOREIGN KEY ("applianceCatalogId") REFERENCES "ApplianceCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplianceTaskTemplate" ADD CONSTRAINT "ApplianceTaskTemplate_applianceCatalogId_fkey" FOREIGN KEY ("applianceCatalogId") REFERENCES "ApplianceCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplianceTaskTemplate" ADD CONSTRAINT "ApplianceTaskTemplate_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "TaskTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "TaskTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_trackableId_fkey" FOREIGN KEY ("trackableId") REFERENCES "Trackable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingAccount" ADD CONSTRAINT "BillingAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIQueryHistory" ADD CONSTRAINT "AIQueryHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
