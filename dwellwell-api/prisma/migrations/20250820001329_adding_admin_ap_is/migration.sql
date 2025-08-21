-- CreateEnum
CREATE TYPE "TrackableResourceType" AS ENUM ('pdf', 'video');

-- CreateTable
CREATE TABLE "WhatsNew" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WhatsNew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackableResource" (
    "id" TEXT NOT NULL,
    "trackableId" TEXT NOT NULL,
    "type" "TrackableResourceType" NOT NULL,
    "name" TEXT NOT NULL,
    "filePath" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackableResource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackableResource_trackableId_idx" ON "TrackableResource"("trackableId");

-- AddForeignKey
ALTER TABLE "TrackableResource" ADD CONSTRAINT "TrackableResource_trackableId_fkey" FOREIGN KEY ("trackableId") REFERENCES "Trackable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
