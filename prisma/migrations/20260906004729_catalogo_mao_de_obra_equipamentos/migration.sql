-- CreateEnum
CREATE TYPE "fixed_cost_category" AS ENUM ('EPI', 'MEDICAL_EXAM', 'UNIFORM', 'MOB_DEMOB', 'TRAVEL_HOUSING', 'OTHER');

-- CreateTable
CREATE TABLE "labor_role" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "labor_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labor_role_version" (
    "id" SERIAL NOT NULL,
    "labor_role_id" INTEGER NOT NULL,
    "base_salary" DECIMAL(12,2),
    "hazard_pay_percent" DECIMAL(6,4),
    "overtime_percent" DECIMAL(6,4),
    "dsr_overtime_percent" DECIMAL(6,4),
    "social_charges_percent" DECIMAL(6,4),
    "food_allowance_monthly" DECIMAL(12,2),
    "housing_monthly" DECIMAL(12,2),
    "home_leave_travel_monthly" DECIMAL(12,2),
    "health_insurance_monthly" DECIMAL(12,2),
    "life_insurance_monthly" DECIMAL(12,2),
    "effective_from" DATE NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "labor_role_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_version" (
    "id" SERIAL NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "external_rental_monthly" DECIMAL(12,2),
    "internal_rental_monthly" DECIMAL(12,2),
    "purchase_price" DECIMAL(12,2),
    "depreciation_years" INTEGER,
    "owned_availability_count" INTEGER,
    "fuel_maintenance_monthly" DECIMAL(12,2),
    "effective_from" DATE NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_cost" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "fixed_cost_category" NOT NULL,

    CONSTRAINT "fixed_cost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_cost_version" (
    "id" SERIAL NOT NULL,
    "fixed_cost_id" INTEGER NOT NULL,
    "unit_cost" DECIMAL(12,2),
    "unit" VARCHAR(50),
    "effective_from" DATE NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fixed_cost_version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "labor_role_code_key" ON "labor_role"("code");

-- CreateIndex
CREATE INDEX "labor_role_version_labor_role_id_effective_from_idx" ON "labor_role_version"("labor_role_id", "effective_from" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "labor_role_version_labor_role_id_effective_from_key" ON "labor_role_version"("labor_role_id", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_code_key" ON "equipment"("code");

-- CreateIndex
CREATE INDEX "equipment_version_equipment_id_effective_from_idx" ON "equipment_version"("equipment_id", "effective_from" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "equipment_version_equipment_id_effective_from_key" ON "equipment_version"("equipment_id", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_cost_code_key" ON "fixed_cost"("code");

-- CreateIndex
CREATE INDEX "fixed_cost_version_fixed_cost_id_effective_from_idx" ON "fixed_cost_version"("fixed_cost_id", "effective_from" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "fixed_cost_version_fixed_cost_id_effective_from_key" ON "fixed_cost_version"("fixed_cost_id", "effective_from");

-- AddForeignKey
ALTER TABLE "labor_role_version" ADD CONSTRAINT "labor_role_version_labor_role_id_fkey" FOREIGN KEY ("labor_role_id") REFERENCES "labor_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_version" ADD CONSTRAINT "equipment_version_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_cost_version" ADD CONSTRAINT "fixed_cost_version_fixed_cost_id_fkey" FOREIGN KEY ("fixed_cost_id") REFERENCES "fixed_cost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
