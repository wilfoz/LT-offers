-- CreateEnum
CREATE TYPE "tower_function" AS ENUM ('SUSPENSION', 'ANCHOR');

-- CreateTable
CREATE TABLE "structure_series" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "structure_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "structure_series_version" (
    "id" SERIAL NOT NULL,
    "structure_series_id" INTEGER NOT NULL,
    "designer" TEXT,
    "voltage_kv" DECIMAL(12,2),
    "circuit_count" INTEGER,
    "cables_per_phase" INTEGER,
    "design_wind_speed_ms" DECIMAL(12,2),
    "insulator_type" TEXT,
    "sil_mw" DECIMAL(12,2),
    "effective_from" DATE NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "structure_series_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tower_type" (
    "id" SERIAL NOT NULL,
    "structure_series_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "function" "tower_function" NOT NULL,

    CONSTRAINT "tower_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tower_type_version" (
    "id" SERIAL NOT NULL,
    "tower_type_id" INTEGER NOT NULL,
    "guy_count" INTEGER,
    "effective_from" DATE NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tower_type_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tower_type_weight" (
    "id" SERIAL NOT NULL,
    "tower_type_version_id" INTEGER NOT NULL,
    "height_m" DECIMAL(10,3) NOT NULL,
    "weight_kg" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "tower_type_weight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "structure_series_name_key" ON "structure_series"("name");

-- CreateIndex
CREATE INDEX "structure_series_version_structure_series_id_effective_from_idx" ON "structure_series_version"("structure_series_id", "effective_from" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "structure_series_version_structure_series_id_effective_from_key" ON "structure_series_version"("structure_series_id", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "tower_type_structure_series_id_code_key" ON "tower_type"("structure_series_id", "code");

-- CreateIndex
CREATE INDEX "tower_type_version_tower_type_id_effective_from_idx" ON "tower_type_version"("tower_type_id", "effective_from" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "tower_type_version_tower_type_id_effective_from_key" ON "tower_type_version"("tower_type_id", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "tower_type_weight_tower_type_version_id_height_m_key" ON "tower_type_weight"("tower_type_version_id", "height_m");

-- AddForeignKey
ALTER TABLE "structure_series_version" ADD CONSTRAINT "structure_series_version_structure_series_id_fkey" FOREIGN KEY ("structure_series_id") REFERENCES "structure_series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tower_type" ADD CONSTRAINT "tower_type_structure_series_id_fkey" FOREIGN KEY ("structure_series_id") REFERENCES "structure_series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tower_type_version" ADD CONSTRAINT "tower_type_version_tower_type_id_fkey" FOREIGN KEY ("tower_type_id") REFERENCES "tower_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tower_type_weight" ADD CONSTRAINT "tower_type_weight_tower_type_version_id_fkey" FOREIGN KEY ("tower_type_version_id") REFERENCES "tower_type_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
