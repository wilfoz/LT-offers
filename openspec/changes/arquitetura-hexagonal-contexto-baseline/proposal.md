# Proposal - Arquitetura Hexagonal no Contexto Baseline (Ponte com a Execução)

## Why

O módulo de baseline contratual de obra (`baseline`, Fase **F7** — congelamento da proposta ganha, curva S, aditivos/change orders, estimativa corrente, acompanhamento de avanço físico e pacote de integração ERP) é o segundo maior módulo monolítico restante (~1,5k linhas, 3 services), acoplado ao Prisma e aos services legados de `cashflow` e `economic-result`. Com o contexto `economics` migrado (pré-requisito), a migração de `baseline` completa a série hexagonal do domínio de negócio, trazendo o padrão de escrita transacional (congelamento e aditivos) já provado em `offers` e `staking`.

## What Changes

- **Bounded context `apps/api/src/contexts/baseline/`**:
  - **Domínio**: entidades `WorkBaseline`, `WorkPackage` (EAP), `ContractChangeOrder`, `CurrentWorkingEstimate`, `MonthlyProgressRecord`; portas `BaselinesRepository`, `ChangeOrdersRepository`, `ProgressRecordsRepository` e `BaselineUnitOfWork`; exceções tipadas; tokens de DI.
  - **Aplicação**: casos de uso `FreezeBaselineUseCase` (transacional), `GetActiveBaselineUseCase`, `GetBaselineByIdUseCase`, `ListBaselinesUseCase`, `CreateChangeOrderUseCase`, `UpdateChangeOrderUseCase`, `ListChangeOrdersUseCase`, `GetCurrentWorkingEstimateUseCase`, `RecordMonthlyProgressUseCase`/curva S (earned value via `@lt-offers/calc-engine`) e `GenerateErpPackageUseCase` (data de geração recebida como parâmetro — RNF-04); testes puros.
  - **Infraestrutura**: repositórios Prisma + unit of work; `BaselineController` e presenter preservando as rotas `/api/offers/:offerId/baseline*`, aditivos, avanço e ERP; `BaselineModule` consumindo `EconomicsFacadeService`.
- **Limpeza do legado**: remoção de `apps/api/src/baseline/` (incl. `erp-integration.service` e `progress-tracking.service`, absorvidos pelos casos de uso) e atualização do `AppModule`.

## Capabilities

### New Capabilities
<!-- Nenhuma nova capability funcional; refatoração arquitetural com skip_specs: true -->

### Modified Capabilities
<!-- Nenhuma alteração contratual nos requisitos funcionais existentes -->

## Impact

- **Código afetado**: `apps/api/src/baseline/` migrado para `apps/api/src/contexts/baseline/`; `app.module.ts`.
- **APIs e contratos**: zero breaking changes nas rotas de baseline, aditivos, estimativa corrente, avanço mensal e pacote ERP.
- **Dependências**: requer a change `arquitetura-hexagonal-contexto-economics` concluída; auditoria continua via `AuditInterceptor` global (módulo `audit` fora desta change).
- **Testes**: cobertura preservada; build webpack obrigatório na verificação.
