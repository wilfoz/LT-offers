-- CreateTable
CREATE TABLE "guy_wire" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "guy_wire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guy_wire_version" (
    "id" SERIAL NOT NULL,
    "guy_wire_id" INTEGER NOT NULL,
    "description" TEXT,
    "weight_ton_per_km" DECIMAL(12,4),
    "reel_length_m" DECIMAL(12,2),
    "diameter_mm" DECIMAL(10,3),
    "uts_kn" DECIMAL(12,2),
    "galvanization_class" TEXT,
    "strength_grade" TEXT,
    "wire_count" INTEGER,
    "effective_from" DATE NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guy_wire_version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guy_wire_code_key" ON "guy_wire"("code");

-- CreateIndex
CREATE INDEX "guy_wire_version_guy_wire_id_effective_from_idx" ON "guy_wire_version"("guy_wire_id", "effective_from" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "guy_wire_version_guy_wire_id_effective_from_key" ON "guy_wire_version"("guy_wire_id", "effective_from");

-- AddForeignKey
ALTER TABLE "guy_wire_version" ADD CONSTRAINT "guy_wire_version_guy_wire_id_fkey" FOREIGN KEY ("guy_wire_id") REFERENCES "guy_wire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
