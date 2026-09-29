-- AlterTable
ALTER TABLE "offer_revision" ADD COLUMN     "bidder_capex" DECIMAL(16,2);

-- CreateTable
CREATE TABLE "viability_parameter_version" (
    "id" SERIAL NOT NULL,
    "effective_from" DATE NOT NULL,
    "wacc_real_after_tax_percent" DECIMAL(5,2) NOT NULL,
    "concession_years" INTEGER NOT NULL,
    "pis_cofins_percent" DECIMAL(5,2) NOT NULL,
    "operation_maintenance_percent" DECIMAL(5,2) NOT NULL,
    "income_tax_percent" DECIMAL(5,2) NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "viability_parameter_version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "viability_parameter_version_effective_from_key" ON "viability_parameter_version"("effective_from");
