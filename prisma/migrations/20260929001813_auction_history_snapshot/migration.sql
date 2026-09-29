-- CreateTable
CREATE TABLE "auction_result_import" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "row_count" INTEGER NOT NULL,
    "imported_by" TEXT NOT NULL,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auction_result_import_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auction_result" (
    "id" SERIAL NOT NULL,
    "import_id" INTEGER NOT NULL,
    "auction_year" INTEGER NOT NULL,
    "auction_date" DATE,
    "auction_number" VARCHAR(15) NOT NULL,
    "lot_number" INTEGER NOT NULL,
    "project_name" TEXT NOT NULL,
    "main_uf" VARCHAR(30),
    "construction_deadline_months" INTEGER,
    "line_length_km" DECIMAL(12,3),
    "substation_mva" DECIMAL(12,2),
    "estimated_investment" DECIMAL(16,2),
    "max_rap" DECIMAL(16,2),
    "winner_name" TEXT,
    "winning_rap" DECIMAL(16,2),
    "discount_percent" DECIMAL(5,2),

    CONSTRAINT "auction_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auction_result_auction_number_lot_number_idx" ON "auction_result"("auction_number", "lot_number");

-- AddForeignKey
ALTER TABLE "auction_result" ADD CONSTRAINT "auction_result_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "auction_result_import"("id") ON DELETE CASCADE ON UPDATE CASCADE;
