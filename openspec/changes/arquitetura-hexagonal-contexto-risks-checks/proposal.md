# Proposal - Arquitetura Hexagonal nos Contextos Risks e Checks (Riscos e Verificações)

## Why

Os módulos de matriz de riscos (`risks`, Módulo **M12** — CRUD de riscos com impacto × probabilidade e contingência) e de painel de verificações de consistência (`checks` — pendências impeditivas em tempo real, RN-13) são serviços monolíticos pequenos acoplados ao Prisma, entregues juntos na Fase **F6**. A migração conjunta completa o M12 na arquitetura hexagonal (RNF-16), com `risks` exercitando o padrão de escrita (repositório + unit of work) e `checks` o padrão somente-leitura (portas + motor de consistência).

## What Changes

- **Bounded context `apps/api/src/contexts/risks/`**:
  - **Domínio**: entidade `RiskItem` (categoria, impacto, probabilidade, severidade calculada, tratamento na formação de preço), porta `RisksRepository`, exceções tipadas e tokens de DI.
  - **Aplicação**: casos de uso `GetOfferRisksUseCase`, `SaveRiskUseCase` (create/update), `DeleteRiskUseCase`, com testes puros.
  - **Infraestrutura**: `PrismaRisksRepository`, `RisksController` e presenter preservando `/api/offers/:offerId/risks/*`, `RisksModule`.
- **Bounded context `apps/api/src/contexts/checks/`**:
  - **Domínio**: porta `ChecksDataQueryPort` (dados da oferta para o motor de consistência) e tokens.
  - **Aplicação**: caso de uso `RunOfferChecksUseCase` delegando ao `ConsistencyEngine` de `@lt-offers/calc-engine`, com testes puros.
  - **Infraestrutura**: adaptador Prisma, `ChecksController` preservando `/api/offers/:offerId/checks/*`, `ChecksModule`.
- **Limpeza do legado**: remoção de `apps/api/src/risks/` e `apps/api/src/checks/` e atualização do `AppModule`.

## Capabilities

### New Capabilities
<!-- Nenhuma nova capability funcional; refatoração arquitetural com skip_specs: true -->

### Modified Capabilities
<!-- Nenhuma alteração contratual nos requisitos funcionais existentes -->

## Impact

- **Código afetado**: `apps/api/src/risks/` e `apps/api/src/checks/` migrados para `apps/api/src/contexts/{risks,checks}/`; `app.module.ts`.
- **APIs e contratos**: zero breaking changes em `/api/offers/:offerId/risks/*` e `/api/offers/:offerId/checks/*` (health/status consumido pelo badge do detalhe da oferta).
- **Testes**: cobertura preservada; build webpack obrigatório na verificação.
