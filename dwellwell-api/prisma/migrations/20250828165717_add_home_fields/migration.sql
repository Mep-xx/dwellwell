-- AlterTable
ALTER TABLE "Home" ADD COLUMN     "isChecked" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "timeZone" TEXT;

-- AlterTable
ALTER TABLE "Trackable" ADD COLUMN     "attributes" JSONB,
ADD COLUMN     "kind" TEXT;
