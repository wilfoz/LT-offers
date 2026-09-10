## 1. Domain Contracts (`libs/domain`)

- [x] 1.1 Criar modelos de quantitativos de estruturas e torres (`TowerQuantityItem`, `TowerFamilyGroup`) em `libs/domain/src/lib/electromechanical/tower-quantity.ts`
- [x] 1.2 Criar modelos de cabos condutores e cabos de guarda (`ConductorQuantityItem`, `GroundWireQuantityItem`) com flecha e descidas em `libs/domain/src/lib/electromechanical/cable-quantity.ts`
- [x] 1.3 Criar modelos de ferragens, isoladores, tirantes, sinalização e aterramento (`HardwareQuantityItem`, `GuyWireQuantityItem`, `GroundingQuantityItem`) em `libs/domain/src/lib/electromechanical/hardware-quantity.ts`
- [x] 1.4 Criar modelos de serviços preliminares e acessos (`AccessQuantityItem`, `VegetationClearingItem`, `CrossingItem`) e o resumo consolidado `ElectromechanicalSummary` em `libs/domain/src/lib/electromechanical/summary.ts`
- [x] 1.5 Exportar contratos no index público de `@lt-offers/domain` e criar testes unitários em `libs/domain`

## 2. Calculation Engine (`libs/calc-engine`)

- [x] 2.1 Implementar `TowerQuantityCalculator` em `libs/calc-engine/src/lib/electromechanical/tower-calculator.ts` com recuperação de pesos por altura, extensões de pé e margem de 0,5% (RF-23, RN-10)
- [x] 2.2 Implementar `CableQuantityCalculator` em `libs/calc-engine/src/lib/electromechanical/cable-calculator.ts` para condutores e cabos de guarda (aço e OPGW) com acréscimo de flecha, descidas e 3,0% de perda (RF-23, RN-10, RN-11)
- [x] 2.3 Implementar `HardwareQuantityCalculator` e `AccessQuantityCalculator` em `libs/calc-engine/src/lib/electromechanical/` para isoladores, tirantes, amortecedores, aterramento e acessos (RF-23, RF-25)
- [x] 2.4 Implementar `ElectromechanicalSummaryCalculator` em `libs/calc-engine/src/lib/electromechanical/summary-calculator.ts` consolidando teórico, extra e sobressalentes por família de material (RF-26, RF-27)
- [x] 2.5 Criar suíte completa de testes unitários para todos os calculadores eletromecânicos com aritmética decimal exata em `libs/calc-engine`

## 3. Backend API NestJS (`apps/api`)

- [x] 3.1 Implementar `ElectromechanicalService` em `apps/api/src/electromechanical/electromechanical.service.ts` integrando estaqueamento, catálogos e motor de cálculo
- [x] 3.2 Implementar `ElectromechanicalController` em `apps/api/src/electromechanical/electromechanical.controller.ts` com endpoints REST `GET /api/lines/:lineId/electromechanical/summary` e `GET /api/lines/:lineId/electromechanical/traceability`
- [x] 3.3 Registrar `ElectromechanicalModule` no `AppModule` e criar testes de integração em `apps/api`

## 4. Frontend Angular (`apps/web`)

- [x] 4.1 Criar serviço HTTP tipado `ElectromechanicalApiService` em `apps/web/src/app/offers/electromechanical-api.service.ts`
- [x] 4.2 Criar componente `ElectromechanicalQuantitiesComponent` com cards de KPIs (toneladas de aço, km de cabos, discos de isoladores), tabelas por família de suprimento e filtros
- [x] 4.3 Implementar modal de Memória de Cálculo e Rastreabilidade estrutural item a item (RF-27)
- [x] 4.4 Integrar a aba "Quantitativos Eletromecânicos (M05)" ao `OfferDetailComponent` e criar testes unitários Vitest em `apps/web`

## 5. Quality Assurance & Validation

- [x] 5.1 Executar suíte completa de testes automatizados (`npx nx run-many -t test`)
- [x] 5.2 Executar linter em todo o monorepo (`npx nx run-many -t lint`)
- [x] 5.3 Validar build de produção de todas as aplicações (`npx nx run-many -t build`)
