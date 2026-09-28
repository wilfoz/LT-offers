-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "offer_revision_status" ADD VALUE 'WON';
ALTER TYPE "offer_revision_status" ADD VALUE 'IN_EXECUTION';

-- AlterTable
ALTER TABLE "offer_revision" ADD COLUMN     "auction_number" VARCHAR(15),
ADD COLUMN     "construction_deadline_months" INTEGER,
ADD COLUMN     "contract_signing_date" DATE,
ADD COLUMN     "lot_number" INTEGER,
ADD COLUMN     "sub_lot_code" VARCHAR(3);
