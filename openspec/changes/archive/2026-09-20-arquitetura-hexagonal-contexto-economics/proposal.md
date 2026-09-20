# Proposal - Arquitetura Hexagonal no Contexto Economics (Serviços, Resultado Econômico e Desembolso)

## Why

Os módulos de orçamento de serviços (`service-budget`, **M09**), resultado econômico (`economic-result`, **M10**) e fluxo de desembolso (`cashflow`, **M11**) — entregues juntos na Fase **F5** — formam uma cadeia coesa: serviços alimentam o resultado, que alimenta o desembolso. Hoje são três serviços monolíticos acoplados ao Prisma, e dois deles (`cashflow`, `economic-result`) são importados diretamente por `export` e `baseline`, criando acoplamento service-a-service que a migração hexagonal converte em fachada única.

## What Changes

- **Bounded context único `apps/api/src/contexts/economics/`** com três agregados:
  - **Domínio**: entidades `ServiceBudget`, `MeasurementSheet`, `EconomicResult`, `MarginSimulation`, `Cashflow`; portas de consulta (`EconomicsDataQueryPort`) e tokens de DI; regras de mascaramento de resultado por papel (RBAC) expressas no domínio.
  - **Aplicação**: casos de uso `GetServiceBudgetUseCase`, `GetMeasurementSheetUseCase` (oferta e linha), `GetLineEconomicResultUseCase`, `GetConsolidatedEconomicResultUseCase`, `SimulateMarginOrPriceUseCase`, `CompareRevisionsUseCase`, `GetLineCashflowUseCase`, `GetConsolidatedCashflowUseCase` — todos com testes puros.
  - **Infraestrutura**: adaptadores Prisma; controllers `ServiceBudgetController`, `EconomicResultController`, `CashflowController` preservando todas as rotas atuais; `EconomicsModule` com fachada `EconomicsFacadeService` expondo o que `export` e `baseline` consomem.
- **Consumidores**: `export` e `baseline` (ainda legados) passam a importar a fachada do contexto novo no lugar dos services removidos.
- **Limpeza do legado**: remoção de `apps/api/src/service-budget/`, `apps/api/src/economic-result/` e `apps/api/src/cashflow/`; atualização do `AppModule`.

## Capabilities

### New Capabilities
<!-- Nenhuma nova capability funcional; refatoração arquitetural com skip_specs: true -->

### Modified Capabilities
<!-- Nenhuma alteração contratual nos requisitos funcionais existentes -->

## Impact

- **Código afetado**: três módulos migrados para `apps/api/src/contexts/economics/`; imports em `apps/api/src/export/` e `apps/api/src/baseline/`; `app.module.ts`.
- **APIs e contratos**: zero breaking changes nas rotas de serviços, medição, resultado econômico, simulação e fluxo de caixa; mascaramento por papel preservado.
- **Testes**: cobertura preservada; build webpack obrigatório na verificação.
