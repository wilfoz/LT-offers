# Proposal - Arquitetura Hexagonal nos Contextos Pricing e Taxation (Preços e Tributos)

## Why

Os módulos de precificação de materiais (`pricing`, Módulo **M06**, Fase **F3**) e de tabelas tributárias (`taxation`, DIFAL, FECOEP, ICMS/IPI/PIS/COFINS por UF) residem como serviços monolíticos acoplados diretamente ao Prisma (`apps/api/src/pricing/`, `apps/api/src/taxation/`). O `pricing` já consome a fachada do contexto hexagonal `foundations`, mas importa o `TaxTablesService` do módulo legado — uma fronteira mista que só se resolve migrando os dois juntos. A migração dá continuidade à série iniciada em `catalogs`/`offers`/`staking`/`foundations` (RNF-16, testabilidade pura com portas em memória).

## What Changes

- **Bounded context `apps/api/src/contexts/taxation/`**:
  - Domínio: entidades de regras tributárias (`IcmsRule`, `IpiRule`, `PisCofinsRule`), porta `TaxRulesQueryPort` e tokens de DI.
  - Aplicação: casos de uso `GetStatesUseCase`, `GetTaxRulesMapUseCase` (ICMS/IPI/PIS-COFINS) com testes puros.
  - Infraestrutura: adaptador Prisma das tabelas tributárias, `TaxationController` preservando os contratos de `/api/taxation/*`, `TaxationModule` com fachada `TaxationFacadeService` para consumidores internos.
- **Bounded context `apps/api/src/contexts/pricing/`**:
  - Domínio: entidades de cotação e precificação (`Quote`, `LinePricingResult`), portas `QuotesQueryPort` e `PricingDataQueryPort`, tokens de DI.
  - Aplicação: casos de uso `GetQuotesUseCase` e `CalculateLinePricingUseCase` delegando o cálculo a `@lt-offers/calc-engine` (material-pricing e commodities), com testes puros.
  - Infraestrutura: adaptadores Prisma, `PricingController` preservando `/api/lines/:lineId/pricing/*`, `PricingModule` consumindo `FoundationsFacadeService` (já hexagonal) e a nova `TaxationFacadeService`.
- **Limpeza do legado**: remoção de `apps/api/src/pricing/` e `apps/api/src/taxation/` e atualização do `AppModule` — na mesma change, sem período de convivência.

## Capabilities

### New Capabilities
<!-- Nenhuma nova capability funcional; refatoração arquitetural com skip_specs: true -->

### Modified Capabilities
<!-- Nenhuma alteração contratual nos requisitos funcionais existentes -->

## Impact

- **Código afetado**: `apps/api/src/pricing/` e `apps/api/src/taxation/` migrados para `apps/api/src/contexts/{pricing,taxation}/`; `apps/api/src/app/app.module.ts`.
- **APIs e contratos**: zero breaking changes nas rotas `/api/lines/:lineId/pricing/*` e `/api/taxation/*`.
- **Testes**: manutenção da cobertura unitária existente (asserções preservadas, apenas fiação); build webpack da api obrigatório na verificação (a infraestrutura Prisma não é importada por testes puros).
