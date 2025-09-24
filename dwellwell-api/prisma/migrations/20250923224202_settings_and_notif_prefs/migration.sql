-- CreateEnum
CREATE TYPE "public"."ThemeMode" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."GamificationVisibility" AS ENUM ('PRIVATE', 'PUBLIC', 'HIDDEN_UI_KEEP_STATS');

-- CreateEnum
CREATE TYPE "public"."NotificationEvent" AS ENUM ('TASK_DUE_SOON', 'TASK_OVERDUE', 'WEEKLY_DIGEST', 'NEW_TASKS_ADDED', 'TRACKABLE_MILESTONE', 'GAMIFICATION_LEVEL_UP');

-- CreateEnum
CREATE TYPE "public"."NotificationChannel" AS ENUM ('EMAIL', 'PUSH', 'SMS');

-- CreateEnum
CREATE TYPE "public"."NotificationFrequency" AS ENUM ('IMMEDIATE', 'DAILY_DIGEST', 'WEEKLY_DIGEST');

-- CreateTable
CREATE TABLE "public"."UserSettings" (
    "userId" TEXT NOT NULL,
    "theme" "public"."ThemeMode" NOT NULL DEFAULT 'SYSTEM',
    "accentColor" TEXT NOT NULL DEFAULT '#4f46e5',
    "fontScale" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "gamificationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "gamificationVisibility" "public"."GamificationVisibility" NOT NULL DEFAULT 'PRIVATE',
    "retainDeletedTrackableStats" BOOLEAN NOT NULL DEFAULT true,
    "defaultDaysBeforeDue" INTEGER NOT NULL DEFAULT 2,
    "autoAssignRoomTasks" BOOLEAN NOT NULL DEFAULT true,
    "allowTaskDisable" BOOLEAN NOT NULL DEFAULT true,
    "allowTaskDelete" BOOLEAN NOT NULL DEFAULT true,
    "googleCalendarEnabled" BOOLEAN NOT NULL DEFAULT false,
    "icalFeedToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "public"."NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "event" "public"."NotificationEvent" NOT NULL,
    "channel" "public"."NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" "public"."NotificationFrequency" NOT NULL DEFAULT 'IMMEDIATE',
    "homeId" TEXT,
    "trackableId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_icalFeedToken_key" ON "public"."UserSettings"("icalFeedToken");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_event_channel_idx" ON "public"."NotificationPreference"("userId", "event", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_event_channel_homeId_trackabl_key" ON "public"."NotificationPreference"("userId", "event", "channel", "homeId", "trackableId");

-- AddForeignKey
ALTER TABLE "public"."UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
