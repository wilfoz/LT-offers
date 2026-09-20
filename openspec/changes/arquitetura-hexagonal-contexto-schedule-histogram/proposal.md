# Proposal - Arquitetura Hexagonal nos Contextos Schedule e Histogram (Cronograma e Histograma)

## Why

Os módulos de cronograma físico (`schedule`, Módulos **M07/M08**, Fase **F4** — atividades, precipitação por mês, canteiros) e de histograma de recursos (`histogram` — perfis mensais por linha e consolidado da oferta) são serviços monolíticos acoplados ao Prisma, e `histogram` importa diretamente o `ScheduleService` legado. A migração conjunta para a Arquitetura Hexagonal fecha essa fronteira via porta e dá continuidade à série de contextos (RNF-16), mantendo o cálculo determinístico no motor puro (RNF-04).

## What Changes

- **Bounded context `apps/api/src/contexts/schedule/`**:
  - Domínio: entidades de cronograma e canteiros (`LineSchedule`, `ScheduleActivity`, `CampPlan`), portas de consulta (`ScheduleDataQueryPort`) e tokens de DI.
  - Aplicação: casos de uso `GetLineScheduleUseCase` e `GetLineCampsUseCase` delegando a `@lt-offers/calc-engine` (schedule-calculator, precipitation-calculator com fatores de campo, camp-calculator), com testes puros.
  - Infraestrutura: adaptador Prisma, `ScheduleController` preservando `/api/lines/:lineId/schedule/*`, `ScheduleModule` com fachada `ScheduleFacadeService` para consumidores internos.
- **Bounded context `apps/api/src/contexts/histogram/`**:
  - Domínio: entidades de histograma (`LineHistogram`, `ConsolidatedHistogram`) e tokens.
  - Aplicação: casos de uso `GetLineHistogramUseCase` e `GetOfferConsolidatedHistogramUseCase` consumindo a `ScheduleFacadeService` (fim do import do service legado), com testes puros.
  - Infraestrutura: `HistogramController` preservando as rotas atuais de histograma (por linha e consolidado da oferta), `HistogramModule`.
- **Limpeza do legado**: remoção de `apps/api/src/schedule/` e `apps/api/src/histogram/` e atualização do `AppModule`.

## Capabilities

### New Capabilities
<!-- Nenhuma nova capability funcional; refatoração arquitetural com skip_specs: true -->

### Modified Capabilities
<!-- Nenhuma alteração contratual nos requisitos funcionais existentes -->

## Impact

- **Código afetado**: `apps/api/src/schedule/` e `apps/api/src/histogram/` migrados para `apps/api/src/contexts/{schedule,histogram}/`; `apps/api/src/app/app.module.ts`.
- **APIs e contratos**: zero breaking changes nas rotas de cronograma, canteiros e histograma.
- **Testes**: cobertura unitária preservada; build webpack da api obrigatório na verificação.
