-- CreateTable
CREATE TABLE "cabo_condutor" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,

    CONSTRAINT "cabo_condutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cabo_condutor_versao" (
    "id" SERIAL NOT NULL,
    "cabo_condutor_id" INTEGER NOT NULL,
    "descricao" TEXT,
    "peso_ton_km" DECIMAL(12,4),
    "bobina_m" DECIMAL(12,2),
    "diametro_mm" DECIMAL(10,3),
    "uts_kn" DECIMAL(12,2),
    "vigencia_inicio" DATE NOT NULL,
    "criado_por" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cabo_condutor_versao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cabo_condutor_codigo_key" ON "cabo_condutor"("codigo");

-- CreateIndex
CREATE INDEX "cabo_condutor_versao_cabo_condutor_id_vigencia_inicio_idx" ON "cabo_condutor_versao"("cabo_condutor_id", "vigencia_inicio" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "cabo_condutor_versao_cabo_condutor_id_vigencia_inicio_key" ON "cabo_condutor_versao"("cabo_condutor_id", "vigencia_inicio");

-- AddForeignKey
ALTER TABLE "cabo_condutor_versao" ADD CONSTRAINT "cabo_condutor_versao_cabo_condutor_id_fkey" FOREIGN KEY ("cabo_condutor_id") REFERENCES "cabo_condutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
