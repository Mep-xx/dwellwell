/*
  Warnings:

  - You are about to drop the column `boilerType` on the `Home` table. All the data in the column will be lost.
  - You are about to drop the column `isChecked` on the `Home` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Home` table without a default value. This is not possible if the table is not empty.
  - Made the column `zip` on table `Home` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Home" DROP CONSTRAINT "Home_userId_fkey";

-- DropIndex
DROP INDEX "Home_userId_address_city_state_apartment_key";

-- AlterTable
ALTER TABLE "Home" DROP COLUMN "boilerType",
DROP COLUMN "isChecked",
ADD COLUMN     "hasHeatPump" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "zip" SET NOT NULL;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Room_homeId_position_idx" ON "Room"("homeId", "position");

-- AddForeignKey
ALTER TABLE "Home" ADD CONSTRAINT "Home_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
