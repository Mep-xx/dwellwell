/*
  Warnings:

  - You are about to drop the column `hasBoiler` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `hasFireplace` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `hasSmokeDetector` on the `Room` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."FlooringType" AS ENUM ('carpet', 'hardwood', 'laminate', 'tile', 'vinyl', 'stone', 'concrete', 'other');

-- CreateEnum
CREATE TYPE "public"."WallFinish" AS ENUM ('painted_drywall', 'wallpaper', 'wood_paneling', 'plaster', 'other');

-- CreateEnum
CREATE TYPE "public"."CeilingType" AS ENUM ('drywall', 'drop_ceiling', 'exposed_beams', 'skylight', 'other');

-- CreateEnum
CREATE TYPE "public"."WindowType" AS ENUM ('none', 'single_hung', 'double_hung', 'casement', 'awning', 'bay', 'slider', 'fixed', 'skylight', 'other');

-- CreateEnum
CREATE TYPE "public"."CeilingFixture" AS ENUM ('none', 'flushmount', 'chandelier', 'fan_only', 'fan_with_light', 'recessed', 'track', 'mixed');

-- AlterTable
ALTER TABLE "public"."Room" DROP COLUMN "hasBoiler",
DROP COLUMN "hasFireplace",
DROP COLUMN "hasSmokeDetector";

-- CreateTable
CREATE TABLE "public"."RoomDetail" (
    "roomId" TEXT NOT NULL,
    "flooring" "public"."FlooringType",
    "wallFinish" "public"."WallFinish",
    "ceilingType" "public"."CeilingType",
    "windowCount" INTEGER DEFAULT 0,
    "windowType" "public"."WindowType",
    "hasExteriorDoor" BOOLEAN DEFAULT false,
    "heatBaseboardHydronic" BOOLEAN DEFAULT false,
    "heatBaseboardElectric" BOOLEAN DEFAULT false,
    "heatRadiator" BOOLEAN DEFAULT false,
    "hvacSupplyVents" INTEGER DEFAULT 0,
    "hvacReturnVents" INTEGER DEFAULT 0,
    "hasCeilingFan" BOOLEAN DEFAULT false,
    "ceilingFixture" "public"."CeilingFixture",
    "recessedLightCount" INTEGER DEFAULT 0,
    "approxOutletCount" INTEGER DEFAULT 0,
    "hasGfci" BOOLEAN DEFAULT false,
    "hasSmokeDetector" BOOLEAN DEFAULT false,
    "hasCoDetector" BOOLEAN DEFAULT false,
    "hasFireplace" BOOLEAN DEFAULT false,
    "sinkCount" INTEGER DEFAULT 0,
    "toiletCount" INTEGER DEFAULT 0,
    "showerCount" INTEGER DEFAULT 0,
    "tubCount" INTEGER DEFAULT 0,
    "hasRadiantFloorHeat" BOOLEAN DEFAULT false,
    "hasAtticAccess" BOOLEAN DEFAULT false,
    "hasCrawlspaceAccess" BOOLEAN DEFAULT false,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomDetail_pkey" PRIMARY KEY ("roomId")
);

-- AddForeignKey
ALTER TABLE "public"."RoomDetail" ADD CONSTRAINT "RoomDetail_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
