-- Sobra da renomeação pt-BR -> inglês encontrada no review consolidado:
-- tabela de infraestrutura do health check da fundação.

ALTER TABLE "verificacao_saude" RENAME TO "health_check";
ALTER TABLE "health_check" RENAME COLUMN "criado_em" TO "created_at";
ALTER INDEX "verificacao_saude_pkey" RENAME TO "health_check_pkey";
