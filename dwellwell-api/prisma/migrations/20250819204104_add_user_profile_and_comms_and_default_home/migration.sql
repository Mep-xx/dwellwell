-- CreateEnum
CREATE TYPE "Units" AS ENUM ('imperial', 'metric');

-- CreateEnum
CREATE TYPE "HouseholdRole" AS ENUM ('owner', 'renter', 'property_manager');

-- CreateEnum
CREATE TYPE "DiySkill" AS ENUM ('none', 'beginner', 'intermediate', 'pro');

-- DropIndex
DROP INDEX "TaskTemplate_category_idx";

-- DropIndex
DROP INDEX "TaskTemplate_criticality_idx";

-- DropIndex
DROP INDEX "TaskTemplate_recurrenceInterval_idx";

-- AlterTable
ALTER TABLE "TaskTemplate" ALTER COLUMN "deferLimitDays" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultHomeId" TEXT;

-- CreateTable
CREATE TABLE "UserProfile" (
    "userId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatarUrl" TEXT,
    "timezone" TEXT,
    "locale" TEXT,
    "units" "Units",
    "householdRole" "HouseholdRole",
    "diySkill" "DiySkill",
    "tosAcceptedAt" TIMESTAMP(3),
    "privacyAcceptedAt" TIMESTAMP(3),
    "marketingOptInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "CommunicationPreferences" (
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderLeadDays" INTEGER NOT NULL DEFAULT 3,
    "quietHoursStart" INTEGER NOT NULL DEFAULT 22,
    "quietHoursEnd" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationPreferences_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_defaultHomeId_fkey" FOREIGN KEY ("defaultHomeId") REFERENCES "Home"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationPreferences" ADD CONSTRAINT "CommunicationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
