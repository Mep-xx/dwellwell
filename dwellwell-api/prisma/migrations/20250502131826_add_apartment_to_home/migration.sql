/*
  Warnings:

  - A unique constraint covering the columns `[userId,address,city,state,apartment]` on the table `Home` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Home" ADD COLUMN     "apartment" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Home_userId_address_city_state_apartment_key" ON "Home"("userId", "address", "city", "state", "apartment");
