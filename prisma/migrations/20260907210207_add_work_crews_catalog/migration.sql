-- CreateEnum
CREATE TYPE "production_period" AS ENUM ('HOUR', 'DAY', 'WEEK', 'MONTH');

-- CreateTable
CREATE TABLE "work_crew" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "work_crew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_crew_version" (
    "id" SERIAL NOT NULL,
    "work_crew_id" INTEGER NOT NULL,
    "standard_production_rate" DECIMAL(12,4),
    "production_unit" VARCHAR(50),
    "production_period" "production_period",
    "effective_from" DATE NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_crew_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_crew_labor_role" (
    "id" SERIAL NOT NULL,
    "work_crew_version_id" INTEGER NOT NULL,
    "labor_role_id" INTEGER NOT NULL,
    "quantity" DECIMAL(6,2) NOT NULL,

    CONSTRAINT "work_crew_labor_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_crew_equipment" (
    "id" SERIAL NOT NULL,
    "work_crew_version_id" INTEGER NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "quantity" DECIMAL(6,2) NOT NULL,

    CONSTRAINT "work_crew_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_crew_code_key" ON "work_crew"("code");

-- CreateIndex
CREATE INDEX "work_crew_version_work_crew_id_effective_from_idx" ON "work_crew_version"("work_crew_id", "effective_from" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "work_crew_version_work_crew_id_effective_from_key" ON "work_crew_version"("work_crew_id", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "work_crew_labor_role_work_crew_version_id_labor_role_id_key" ON "work_crew_labor_role"("work_crew_version_id", "labor_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_crew_equipment_work_crew_version_id_equipment_id_key" ON "work_crew_equipment"("work_crew_version_id", "equipment_id");

-- AddForeignKey
ALTER TABLE "work_crew_version" ADD CONSTRAINT "work_crew_version_work_crew_id_fkey" FOREIGN KEY ("work_crew_id") REFERENCES "work_crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_crew_labor_role" ADD CONSTRAINT "work_crew_labor_role_work_crew_version_id_fkey" FOREIGN KEY ("work_crew_version_id") REFERENCES "work_crew_version"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_crew_labor_role" ADD CONSTRAINT "work_crew_labor_role_labor_role_id_fkey" FOREIGN KEY ("labor_role_id") REFERENCES "labor_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_crew_equipment" ADD CONSTRAINT "work_crew_equipment_work_crew_version_id_fkey" FOREIGN KEY ("work_crew_version_id") REFERENCES "work_crew_version"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_crew_equipment" ADD CONSTRAINT "work_crew_equipment_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
