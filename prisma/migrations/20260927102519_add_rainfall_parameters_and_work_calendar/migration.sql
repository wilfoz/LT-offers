-- CreateTable
CREATE TABLE "rainfall_parameter_version" (
    "id" SERIAL NOT NULL,
    "effective_from" DATE NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rainfall_parameter_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rainfall_severity_band" (
    "id" SERIAL NOT NULL,
    "rainfall_parameter_version_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "upper_limit_mm" DECIMAL(6,1),
    "productivity_factor" DECIMAL(5,4) NOT NULL,

    CONSTRAINT "rainfall_severity_band_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rainfall_uf_row" (
    "id" SERIAL NOT NULL,
    "rainfall_parameter_version_id" INTEGER NOT NULL,
    "uf" VARCHAR(2) NOT NULL,
    "jan_mm" DECIMAL(6,1) NOT NULL,
    "feb_mm" DECIMAL(6,1) NOT NULL,
    "mar_mm" DECIMAL(6,1) NOT NULL,
    "apr_mm" DECIMAL(6,1) NOT NULL,
    "may_mm" DECIMAL(6,1) NOT NULL,
    "jun_mm" DECIMAL(6,1) NOT NULL,
    "jul_mm" DECIMAL(6,1) NOT NULL,
    "aug_mm" DECIMAL(6,1) NOT NULL,
    "sep_mm" DECIMAL(6,1) NOT NULL,
    "oct_mm" DECIMAL(6,1) NOT NULL,
    "nov_mm" DECIMAL(6,1) NOT NULL,
    "dec_mm" DECIMAL(6,1) NOT NULL,

    CONSTRAINT "rainfall_uf_row_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_calendar_version" (
    "id" SERIAL NOT NULL,
    "effective_from" DATE NOT NULL,
    "standard_working_days_per_month" DECIMAL(4,2) NOT NULL,
    "non_working_weekdays" INTEGER[],
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_calendar_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holiday" (
    "id" SERIAL NOT NULL,
    "work_calendar_version_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "uf" VARCHAR(2),

    CONSTRAINT "holiday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rainfall_parameter_version_effective_from_key" ON "rainfall_parameter_version"("effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "rainfall_severity_band_version_position_key" ON "rainfall_severity_band"("rainfall_parameter_version_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "rainfall_uf_row_version_uf_key" ON "rainfall_uf_row"("rainfall_parameter_version_id", "uf");

-- CreateIndex
CREATE UNIQUE INDEX "work_calendar_version_effective_from_key" ON "work_calendar_version"("effective_from");

-- CreateIndex
CREATE INDEX "holiday_work_calendar_version_id_idx" ON "holiday"("work_calendar_version_id");

-- AddForeignKey
ALTER TABLE "rainfall_severity_band" ADD CONSTRAINT "rainfall_severity_band_rainfall_parameter_version_id_fkey" FOREIGN KEY ("rainfall_parameter_version_id") REFERENCES "rainfall_parameter_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rainfall_uf_row" ADD CONSTRAINT "rainfall_uf_row_rainfall_parameter_version_id_fkey" FOREIGN KEY ("rainfall_parameter_version_id") REFERENCES "rainfall_parameter_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holiday" ADD CONSTRAINT "holiday_work_calendar_version_id_fkey" FOREIGN KEY ("work_calendar_version_id") REFERENCES "work_calendar_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
