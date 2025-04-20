/*
  Warnings:

  - You are about to alter the column `lotSize` on the `Home` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - The `features` column on the `Home` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Home" ALTER COLUMN "lotSize" SET DATA TYPE INTEGER,
DROP COLUMN "features",
ADD COLUMN     "features" TEXT[];
