-- DropForeignKey
ALTER TABLE "public"."Trackable" DROP CONSTRAINT "Trackable_homeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Trackable" DROP CONSTRAINT "Trackable_roomId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserTask" DROP CONSTRAINT "UserTask_homeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserTask" DROP CONSTRAINT "UserTask_roomId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserTask" DROP CONSTRAINT "UserTask_trackableId_fkey";

-- AlterTable
ALTER TABLE "public"."Home" ADD COLUMN     "boilerType" TEXT,
ADD COLUMN     "heatingCoolingTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AddForeignKey
ALTER TABLE "public"."Trackable" ADD CONSTRAINT "Trackable_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "public"."Home"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Trackable" ADD CONSTRAINT "Trackable_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserTask" ADD CONSTRAINT "UserTask_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "public"."Home"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserTask" ADD CONSTRAINT "UserTask_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserTask" ADD CONSTRAINT "UserTask_trackableId_fkey" FOREIGN KEY ("trackableId") REFERENCES "public"."Trackable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
