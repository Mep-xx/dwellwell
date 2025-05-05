-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "hasBoiler" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasFireplace" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasSmokeDetector" BOOLEAN NOT NULL DEFAULT false;
