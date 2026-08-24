-- CreateEnum
CREATE TYPE "ground_wire_type" AS ENUM ('STEEL', 'OPGW');

-- CreateTable
CREATE TABLE "ground_wire" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" "ground_wire_type" NOT NULL,

    CONSTRAINT "ground_wire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ground_wire_version" (
    "id" SERIAL NOT NULL,
    "ground_wire_id" INTEGER NOT NULL,
    "description" TEXT,
    "weight_ton_per_km" DECIMAL(12,4),
    "reel_length_m" DECIMAL(12,2),
    "diameter_mm" DECIMAL(10,3),
    "uts_kn" DECIMAL(12,2),
    "galvanization_class" TEXT,
    "strength_grade" TEXT,
    "wire_count" INTEGER,
    "manufacturer" TEXT,
    "i2t_ka2s" DECIMAL(12,3),
    "fiber_count" INTEGER,
    "effective_from" DATE NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ground_wire_version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ground_wire_code_key" ON "ground_wire"("code");

-- CreateIndex
CREATE INDEX "ground_wire_version_ground_wire_id_effective_from_idx" ON "ground_wire_version"("ground_wire_id", "effective_from" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ground_wire_version_ground_wire_id_effective_from_key" ON "ground_wire_version"("ground_wire_id", "effective_from");

-- AddForeignKey
ALTER TABLE "ground_wire_version" ADD CONSTRAINT "ground_wire_version_ground_wire_id_fkey" FOREIGN KEY ("ground_wire_id") REFERENCES "ground_wire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
