-- CreateTable
CREATE TABLE "verificacao_saude" (
    "id" SERIAL NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verificacao_saude_pkey" PRIMARY KEY ("id")
);
