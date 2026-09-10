## 1. Domain Contracts (`libs/domain`)

- [x] 1.1 Criar modelos e enums de grupos de atividades, vínculos de quantitativo e marcos contratuais (`ScheduleActivity`, `ActivityGroup`, `QuantitySourceRef`, `MilestoneContract`) em `libs/domain/src/lib/schedule/activity.ts`
- [x] 1.2 Criar modelos de dimensionamento e custos de canteiros de obra (`CampDefinition`, `CampType`, `CampCostSummary`) em `libs/domain/src/lib/camps/camp.ts`
- [x] 1.3 Criar modelos de curvas temporais e histogramas de recursos (`ManpowerHistogramItem`, `EquipmentHistogramItem`, `ResourceHistogramSummary`, `MonthlyDeficitItem`) em `libs/domain/src/lib/histogram/histogram.ts`
- [x] 1.4 Exportar contratos no index público de `@lt-offers/domain` e criar testes unitários em `libs/domain`

## 2. Calculation Engine (`libs/calc-engine`)

- [x] 2.1 Implementar `PrecipitationCalculator` em `libs/calc-engine/src/lib/schedule/precipitation-calculator.ts` com matriz histórica de pluviosidade por UF e aplicação dos fatores redutores em 5 níveis (RF-37, RN-16)
- [x] 2.2 Implementar `ScheduleCalculator` em `libs/calc-engine/src/lib/schedule/schedule-calculator.ts` calculando durações com base em quantitativos de M05, produção de equipes `WorkCrew`, marcos LI/LO e validação de sobreprodução (RF-35, RF-36, RF-38, RF-39, RN-15)
- [x] 2.3 Implementar `CampCalculator` em `libs/calc-engine/src/lib/camps/camp-calculator.ts` calculando implantação, custo mensal recorrente e desmobilização de canteiro central e avançados (RF-41)
- [x] 2.4 Implementar `HistogramCalculator` em `libs/calc-engine/src/lib/histogram/histogram-calculator.ts` agregando efetivo direto/indireto, identificando picos e balanço de frota própria vs déficit a locar (RF-42, RF-43, RF-44, RN-17)
- [x] 2.5 Criar suíte completa de testes unitários para o motor de cronograma, canteiros e histogramas com aritmética decimal exata em `libs/calc-engine`

## 3. Backend API NestJS (`apps/api`)

- [x] 3.1 Implementar `ScheduleService` e `ScheduleController` em `apps/api/src/schedule/` com endpoints REST para cronograma físico, atividades e canteiros
- [x] 3.2 Implementar `HistogramService` e `HistogramController` em `apps/api/src/histogram/` com endpoints REST para histogramas de pessoal, equipamentos e consolidação do projeto
- [x] 3.3 Registrar `ScheduleModule` e `HistogramModule` no `AppModule` e criar testes de integração em `apps/api`

## 4. Frontend Angular (`apps/web`)

- [x] 4.1 Criar serviços HTTP tipados `ScheduleApiService` e `HistogramApiService` em `apps/web/src/app/offers/`
- [x] 4.2 Criar componente `ScheduleGanttComponent` com visualização de Gantt, grid temporal configurável (mês/semana), marcos contratuais e alertas de produção em `apps/web/src/app/offers/schedule-gantt.component.ts`
- [x] 4.3 Criar componentes de gestão de canteiros e de histograma de recursos com gráficos de barras empilhadas e curvas S em `apps/web/src/app/offers/`
- [x] 4.4 Integrar as abas "Cronograma Físico (M07)" e "Histograma de Recursos (M08)" ao `OfferDetailComponent` e criar testes unitários Vitest em `apps/web`

## 5. Quality Assurance & Validation

- [x] 5.1 Executar suíte completa de testes automatizados (`npx nx run-many -t test`)
- [x] 5.2 Executar linter em todo o monorepo (`npx nx run-many -t lint`)
- [x] 5.3 Validar build de produção de todas as aplicações (`npx nx run-many -t build`)
