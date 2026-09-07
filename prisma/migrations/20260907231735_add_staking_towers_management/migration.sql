-- CreateEnum
CREATE TYPE "access_difficulty" AS ENUM ('NORMAL', 'DIFFICULT', 'CROSSING');

-- CreateTable
CREATE TABLE "staking_tower" (
    "id" SERIAL NOT NULL,
    "transmission_line_id" INTEGER NOT NULL,
    "tower_number" VARCHAR(50) NOT NULL,
    "station_meters" DECIMAL(12,3) NOT NULL,
    "body_extension_meters" DECIMAL(8,3) NOT NULL DEFAULT 0,
    "deflection_angle_deg" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "lateral_offset_meters" DECIMAL(8,3) NOT NULL DEFAULT 0,
    "utm_east" DECIMAL(12,3),
    "utm_north" DECIMAL(12,3),
    "elevation_meters" DECIMAL(10,3),
    "tower_type_id" INTEGER,
    "soil_type_id" INTEGER,
    "foundation_type_id" INTEGER,
    "access_difficulty" "access_difficulty" NOT NULL DEFAULT 'NORMAL',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staking_tower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preliminary_staking_distribution" (
    "id" SERIAL NOT NULL,
    "transmission_line_id" INTEGER NOT NULL,
    "soil_percentages" JSONB NOT NULL DEFAULT '[]',
    "foundation_percentages" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preliminary_staking_distribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staking_tower_transmission_line_id_station_meters_idx" ON "staking_tower"("transmission_line_id", "station_meters");

-- CreateIndex
CREATE UNIQUE INDEX "staking_tower_transmission_line_id_tower_number_key" ON "staking_tower"("transmission_line_id", "tower_number");

-- CreateIndex
CREATE UNIQUE INDEX "preliminary_staking_distribution_transmission_line_id_key" ON "preliminary_staking_distribution"("transmission_line_id");

-- AddForeignKey
ALTER TABLE "staking_tower" ADD CONSTRAINT "staking_tower_transmission_line_id_fkey" FOREIGN KEY ("transmission_line_id") REFERENCES "transmission_line"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staking_tower" ADD CONSTRAINT "staking_tower_tower_type_id_fkey" FOREIGN KEY ("tower_type_id") REFERENCES "tower_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staking_tower" ADD CONSTRAINT "staking_tower_soil_type_id_fkey" FOREIGN KEY ("soil_type_id") REFERENCES "soil_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staking_tower" ADD CONSTRAINT "staking_tower_foundation_type_id_fkey" FOREIGN KEY ("foundation_type_id") REFERENCES "foundation_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preliminary_staking_distribution" ADD CONSTRAINT "preliminary_staking_distribution_transmission_line_id_fkey" FOREIGN KEY ("transmission_line_id") REFERENCES "transmission_line"("id") ON DELETE CASCADE ON UPDATE CASCADE;
