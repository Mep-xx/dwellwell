/*
  Warnings:

  - You are about to alter the column `kind` on the `Trackable` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(64)`.
  - You are about to alter the column `brand` on the `Trackable` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(128)`.
  - You are about to alter the column `category` on the `Trackable` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(64)`.
  - You are about to alter the column `model` on the `Trackable` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(128)`.

*/
-- AlterTable
ALTER TABLE "public"."Trackable" ADD COLUMN     "attributes" JSONB,
ALTER COLUMN "kind" SET DATA TYPE VARCHAR(64),
ALTER COLUMN "brand" SET DATA TYPE VARCHAR(128),
ALTER COLUMN "category" SET DATA TYPE VARCHAR(64),
ALTER COLUMN "model" SET DATA TYPE VARCHAR(128);

-- CreateIndex
CREATE INDEX "Trackable_brand_idx" ON "public"."Trackable"("brand");

-- CreateIndex
CREATE INDEX "Trackable_model_idx" ON "public"."Trackable"("model");

-- CreateIndex
CREATE INDEX "Trackable_category_idx" ON "public"."Trackable"("category");

-- CreateIndex
CREATE INDEX "Trackable_kind_idx" ON "public"."Trackable"("kind");
