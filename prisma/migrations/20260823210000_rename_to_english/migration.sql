-- Renomeação pt-BR -> inglês (change convencao-codigo-ingles, design D3).
-- RENAME preserva todos os dados; nada é dropado.

-- Tabelas
ALTER TABLE "cabo_condutor" RENAME TO "conductor_cable";
ALTER TABLE "cabo_condutor_versao" RENAME TO "conductor_cable_version";

-- Colunas: conductor_cable
ALTER TABLE "conductor_cable" RENAME COLUMN "codigo" TO "code";

-- Colunas: conductor_cable_version
ALTER TABLE "conductor_cable_version" RENAME COLUMN "cabo_condutor_id" TO "conductor_cable_id";
ALTER TABLE "conductor_cable_version" RENAME COLUMN "descricao" TO "description";
ALTER TABLE "conductor_cable_version" RENAME COLUMN "peso_ton_km" TO "weight_ton_per_km";
ALTER TABLE "conductor_cable_version" RENAME COLUMN "bobina_m" TO "reel_length_m";
ALTER TABLE "conductor_cable_version" RENAME COLUMN "diametro_mm" TO "diameter_mm";
ALTER TABLE "conductor_cable_version" RENAME COLUMN "vigencia_inicio" TO "effective_from";
ALTER TABLE "conductor_cable_version" RENAME COLUMN "criado_por" TO "created_by";
ALTER TABLE "conductor_cable_version" RENAME COLUMN "criado_em" TO "created_at";

-- Índices e constraints: alinhados à convenção de nomes do Prisma para
-- evitar drift em migrations futuras
ALTER INDEX "cabo_condutor_pkey" RENAME TO "conductor_cable_pkey";
ALTER INDEX "cabo_condutor_codigo_key" RENAME TO "conductor_cable_code_key";
ALTER INDEX "cabo_condutor_versao_pkey" RENAME TO "conductor_cable_version_pkey";
ALTER INDEX "cabo_condutor_versao_cabo_condutor_id_vigencia_inicio_key" RENAME TO "conductor_cable_version_conductor_cable_id_effective_from_key";
ALTER INDEX "cabo_condutor_versao_cabo_condutor_id_vigencia_inicio_idx" RENAME TO "conductor_cable_version_conductor_cable_id_effective_from_idx";
ALTER TABLE "conductor_cable_version" RENAME CONSTRAINT "cabo_condutor_versao_cabo_condutor_id_fkey" TO "conductor_cable_version_conductor_cable_id_fkey";
