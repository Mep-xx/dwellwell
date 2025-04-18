/*
  Warnings:

  - The `features` column on the `Home` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Home" DROP COLUMN "features",
ADD COLUMN     "features" JSONB;
