-- CreateEnum
CREATE TYPE "foundation_application" AS ENUM ('SELF_SUPPORTING', 'GUYED', 'CROSS_ROPE');

-- CreateTable
CREATE TABLE "soil_type" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "soil_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soil_type_version" (
    "id" SERIAL NOT NULL,
    "soil_type_id" INTEGER NOT NULL,
    "description" TEXT,
    "submerged" BOOLEAN,
    "allowable_compression_stress_kgf_cm2" DECIMAL(12,2),
    "specific_weight_kgf_m3" DECIMAL(12,2),
    "internal_friction_angle_deg" DECIMAL(10,3),
    "cohesion_kg_cm2" DECIMAL(10,3),
    "nspt_min" INTEGER,
    "nspt_max" INTEGER,
    "effective_from" DATE NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "soil_type_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foundation_type" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "application" "foundation_application" NOT NULL,

    CONSTRAINT "foundation_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foundation_type_version" (
    "id" SERIAL NOT NULL,
    "foundation_type_id" INTEGER NOT NULL,
    "description" TEXT,
    "spread_footing_count" INTEGER,
    "precast_mast_count" INTEGER,
    "precast_guy_count" INTEGER,
    "straight_pier_count" INTEGER,
    "belled_pier_count" INTEGER,
    "slab_pier_count" INTEGER,
    "straight_pier_guy_count" INTEGER,
    "belled_pier_guy_count" INTEGER,
    "rock_anchor_count" INTEGER,
    "concrete_pile_count" INTEGER,
    "steel_pile_count" INTEGER,
    "helical_mast_count" INTEGER,
    "helical_guy_count" INTEGER,
    "tricone_count" INTEGER,
    "root_pile_count" INTEGER,
    "micropile_count" INTEGER,
    "continuous_auger_pile_count" INTEGER,
    "effective_from" DATE NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foundation_type_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foundation_volume" (
    "id" SERIAL NOT NULL,
    "tower_type_id" INTEGER NOT NULL,
    "soil_type_id" INTEGER NOT NULL,
    "foundation_type_id" INTEGER NOT NULL,

    CONSTRAINT "foundation_volume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foundation_volume_version" (
    "id" SERIAL NOT NULL,
    "foundation_volume_id" INTEGER NOT NULL,
    "excavation_hard_footing_m3" DECIMAL(12,3),
    "excavation_normal_footing_m3" DECIMAL(12,3),
    "excavation_water_footing_m3" DECIMAL(12,3),
    "excavation_hard_precast_m3" DECIMAL(12,3),
    "excavation_normal_precast_m3" DECIMAL(12,3),
    "excavation_water_precast_m3" DECIMAL(12,3),
    "excavation_hard_pile_cap_m3" DECIMAL(12,3),
    "excavation_normal_pile_cap_m3" DECIMAL(12,3),
    "excavation_water_pile_cap_m3" DECIMAL(12,3),
    "excavation_pier_m3" DECIMAL(12,3),
    "anchor_bolt_drilling_m" DECIMAL(12,3),
    "steel_piers_kg" DECIMAL(12,3),
    "steel_footings_kg" DECIMAL(12,3),
    "steel_pile_caps_kg" DECIMAL(12,3),
    "steel_precast_kg" DECIMAL(12,3),
    "steel_rock_kg" DECIMAL(12,3),
    "steel_anchor_bolts_kg" DECIMAL(12,3),
    "concrete_piers_m3" DECIMAL(12,3),
    "concrete_footings_m3" DECIMAL(12,3),
    "concrete_pile_caps_m3" DECIMAL(12,3),
    "concrete_precast_m3" DECIMAL(12,3),
    "concrete_rock_m3" DECIMAL(12,3),
    "regeneration_m3" DECIMAL(12,3),
    "grout_m3" DECIMAL(12,3),
    "backfill_soil_m3" DECIMAL(12,3),
    "backfill_soil_cement_m3" DECIMAL(12,3),
    "formwork_m2" DECIMAL(12,3),
    "helical_pile_m" DECIMAL(12,3),
    "steel_pile_m" DECIMAL(12,3),
    "tricone_m" DECIMAL(12,3),
    "root_pile_m" DECIMAL(12,3),
    "continuous_auger_pile_m" DECIMAL(12,3),
    "micropile_m" DECIMAL(12,3),
    "concrete_pile_m" DECIMAL(12,3),
    "effective_from" DATE NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foundation_volume_version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "soil_type_code_key" ON "soil_type"("code");

-- CreateIndex
CREATE INDEX "soil_type_version_soil_type_id_effective_from_idx" ON "soil_type_version"("soil_type_id", "effective_from" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "soil_type_version_soil_type_id_effective_from_key" ON "soil_type_version"("soil_type_id", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "foundation_type_code_key" ON "foundation_type"("code");

-- CreateIndex
CREATE INDEX "foundation_type_version_foundation_type_id_effective_from_idx" ON "foundation_type_version"("foundation_type_id", "effective_from" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "foundation_type_version_foundation_type_id_effective_from_key" ON "foundation_type_version"("foundation_type_id", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "foundation_volume_tower_soil_foundation_key" ON "foundation_volume"("tower_type_id", "soil_type_id", "foundation_type_id");

-- CreateIndex
CREATE INDEX "foundation_volume_version_volume_id_effective_from_idx" ON "foundation_volume_version"("foundation_volume_id", "effective_from" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "foundation_volume_version_volume_id_effective_from_key" ON "foundation_volume_version"("foundation_volume_id", "effective_from");

-- AddForeignKey
ALTER TABLE "soil_type_version" ADD CONSTRAINT "soil_type_version_soil_type_id_fkey" FOREIGN KEY ("soil_type_id") REFERENCES "soil_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foundation_type_version" ADD CONSTRAINT "foundation_type_version_foundation_type_id_fkey" FOREIGN KEY ("foundation_type_id") REFERENCES "foundation_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foundation_volume" ADD CONSTRAINT "foundation_volume_tower_type_id_fkey" FOREIGN KEY ("tower_type_id") REFERENCES "tower_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foundation_volume" ADD CONSTRAINT "foundation_volume_soil_type_id_fkey" FOREIGN KEY ("soil_type_id") REFERENCES "soil_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foundation_volume" ADD CONSTRAINT "foundation_volume_foundation_type_id_fkey" FOREIGN KEY ("foundation_type_id") REFERENCES "foundation_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foundation_volume_version" ADD CONSTRAINT "foundation_volume_version_foundation_volume_id_fkey" FOREIGN KEY ("foundation_volume_id") REFERENCES "foundation_volume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
