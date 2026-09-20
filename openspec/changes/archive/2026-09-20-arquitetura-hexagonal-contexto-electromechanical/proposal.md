# Proposal - Arquitetura Hexagonal no Contexto Electromechanical (Quantitativos Eletromecânicos)

## Why

O módulo de quantitativos de engenharia eletromecânica (`electromechanical`, Módulo **M05**, Fase **F2** — torres, cabos por vão, ferragens, cadeias e acessos) é um serviço monolítico acoplado ao Prisma que lê estaqueamento e catálogos e delega o cálculo ao motor puro. É o análogo direto de `foundations` (mesma forma: consulta → cálculo no motor → rastreabilidade), cuja migração já está provada — esta change replica o padrão.

## What Changes

- **Bounded context `apps/api/src/contexts/electromechanical/`**:
  - **Domínio**: entidades de quantitativos (`LineElectromechanicalCalculation`, `TowerQuantity`, `CableQuantity`, `HardwareQuantity`, `ElectromechanicalSummary`), portas de consulta (`LineElectromechanicalQueryPort` para torres/distribuição preliminar e `ElectromechanicalCatalogsQueryPort` para catálogos vigentes) e tokens de DI.
  - **Aplicação**: casos de uso `CalculateLineElectromechanicalUseCase` e `GetLineElectromechanicalTraceabilityUseCase` delegando a `@lt-offers/calc-engine` (tower/cable/hardware/access/summary calculators), com testes puros.
  - **Infraestrutura**: adaptadores Prisma, `ElectromechanicalController` e presenter preservando `/api/lines/:lineId/electromechanical/*`, `ElectromechanicalModule` com injeção por tokens.
- **Limpeza do legado**: remoção de `apps/api/src/electromechanical/` e atualização do `AppModule`.

## Capabilities

### New Capabilities
<!-- Nenhuma nova capability funcional; refatoração arquitetural com skip_specs: true -->

### Modified Capabilities
<!-- Nenhuma alteração contratual nos requisitos funcionais existentes -->

## Impact

- **Código afetado**: `apps/api/src/electromechanical/` migrado para `apps/api/src/contexts/electromechanical/`; `app.module.ts`.
- **APIs e contratos**: zero breaking changes em `/api/lines/:lineId/electromechanical/*` (cálculo e rastreabilidade RF-27).
- **Testes**: cobertura preservada; build webpack obrigatório na verificação.
