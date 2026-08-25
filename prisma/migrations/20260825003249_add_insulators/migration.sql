-- CreateTable
CREATE TABLE "insulator" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "insulator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insulator_version" (
    "id" SERIAL NOT NULL,
    "insulator_id" INTEGER NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "manufacturer" TEXT,
    "profile" TEXT,
    "rupture_strength_kn" DECIMAL(12,2),
    "diameter_mm" DECIMAL(10,3),
    "spacing_mm" DECIMAL(10,3),
    "creepage_distance_mm" DECIMAL(10,3),
    "effective_from" DATE NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insulator_version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insulator_code_key" ON "insulator"("code");

-- CreateIndex
CREATE INDEX "insulator_version_insulator_id_effective_from_idx" ON "insulator_version"("insulator_id", "effective_from" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "insulator_version_insulator_id_effective_from_key" ON "insulator_version"("insulator_id", "effective_from");

-- AddForeignKey
ALTER TABLE "insulator_version" ADD CONSTRAINT "insulator_version_insulator_id_fkey" FOREIGN KEY ("insulator_id") REFERENCES "insulator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
