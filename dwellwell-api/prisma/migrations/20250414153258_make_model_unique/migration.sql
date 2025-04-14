/*
  Warnings:

  - A unique constraint covering the columns `[model]` on the table `ApplianceCatalog` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ApplianceCatalog_model_key" ON "ApplianceCatalog"("model");
