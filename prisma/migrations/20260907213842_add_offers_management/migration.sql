-- CreateEnum
CREATE TYPE "offer_revision_status" AS ENUM ('DRAFT', 'FROZEN', 'DELIVERED');

-- CreateEnum
CREATE TYPE "scope_responsible_party" AS ENUM ('CONTRACTOR', 'CLIENT');

-- CreateTable
CREATE TABLE "offer" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "base_currency" VARCHAR(10) NOT NULL DEFAULT 'BRL',
    "cloned_from_offer_id" INTEGER,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_revision" (
    "id" SERIAL NOT NULL,
    "offer_id" INTEGER NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "status" "offer_revision_status" NOT NULL DEFAULT 'DRAFT',
    "auction_name" TEXT NOT NULL,
    "lot_name" TEXT NOT NULL,
    "offer_date" DATE NOT NULL,
    "auction_date" DATE,
    "schedule_start_date" DATE,
    "commercial_operation_date" DATE,
    "estimated_capex" DECIMAL(16,2),
    "max_rap" DECIMAL(16,2),
    "winning_rap" DECIMAL(16,2),
    "notes" TEXT,
    "closed_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transmission_line" (
    "id" SERIAL NOT NULL,
    "offer_revision_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nominal_voltage_kv" DECIMAL(8,2) NOT NULL,
    "refined_length_km" DECIMAL(10,3) NOT NULL,
    "report_length_km" DECIMAL(10,3) NOT NULL,
    "circuit_count" INTEGER NOT NULL DEFAULT 1,
    "bundle_conductor_count" INTEGER NOT NULL DEFAULT 1,
    "destination_state_primary" VARCHAR(2) NOT NULL,
    "destination_percentage_primary" DECIMAL(5,2) NOT NULL,
    "destination_state_secondary" VARCHAR(2),
    "destination_percentage_secondary" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transmission_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scope_matrix_item" (
    "id" SERIAL NOT NULL,
    "offer_revision_id" INTEGER NOT NULL,
    "item_code" VARCHAR(50) NOT NULL,
    "item_name" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "responsible_party" "scope_responsible_party" NOT NULL DEFAULT 'CONTRACTOR',
    "accepts_direct_billing" BOOLEAN NOT NULL DEFAULT false,
    "currency_risk_party" "scope_responsible_party" NOT NULL DEFAULT 'CONTRACTOR',
    "commodity_risk_party" "scope_responsible_party" NOT NULL DEFAULT 'CONTRACTOR',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scope_matrix_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "offer_code_key" ON "offer"("code");

-- CreateIndex
CREATE INDEX "offer_revision_offer_id_revision_number_idx" ON "offer_revision"("offer_id", "revision_number" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "offer_revision_offer_id_revision_number_key" ON "offer_revision"("offer_id", "revision_number");

-- CreateIndex
CREATE UNIQUE INDEX "transmission_line_offer_revision_id_code_key" ON "transmission_line"("offer_revision_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "scope_matrix_item_offer_revision_id_item_code_key" ON "scope_matrix_item"("offer_revision_id", "item_code");

-- AddForeignKey
ALTER TABLE "offer" ADD CONSTRAINT "offer_cloned_from_offer_id_fkey" FOREIGN KEY ("cloned_from_offer_id") REFERENCES "offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_revision" ADD CONSTRAINT "offer_revision_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transmission_line" ADD CONSTRAINT "transmission_line_offer_revision_id_fkey" FOREIGN KEY ("offer_revision_id") REFERENCES "offer_revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scope_matrix_item" ADD CONSTRAINT "scope_matrix_item_offer_revision_id_fkey" FOREIGN KEY ("offer_revision_id") REFERENCES "offer_revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
