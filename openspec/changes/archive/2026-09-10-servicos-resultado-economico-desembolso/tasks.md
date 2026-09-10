## 1. Domain Contracts (`libs/domain`)

- [x] 1.1 Criar modelos e tipos para orçamento de serviços, origens de custo, códigos CIP e ratios (`ServiceBudgetItem`, `ServiceCostSource`, `CipReference`, `ServiceBudgetSummary`) em `libs/domain/src/lib/services/service-budget.ts`
- [x] 1.2 Criar modelos para coeficientes de venda K, BDI e quadro de resultado econômico (`SaleCoefficients`, `BdiBreakdown`, `EconomicResultLine`, `EconomicResultSummary`) em `libs/domain/src/lib/pricing/economic-result.ts`
- [x] 1.3 Criar modelos para curvas de desembolso temporal, cronograma de entregas e fluxo de caixa (`DisbursementCurve`, `SupplyDeliverySchedulePoint`, `CashflowMonthPoint`, `CashflowSummary`) em `libs/domain/src/lib/cashflow/cashflow.ts`
- [x] 1.4 Exportar contratos no index público de `@lt-offers/domain` e criar testes unitários Jest em `libs/domain`

## 2. Calculation Engine (`libs/calc-engine`)

- [x] 2.1 Implementar `ServiceBudgetCalculator` em `libs/calc-engine/src/lib/services/service-budget-calculator.ts` consolidando as 3 origens de custo, código CIP, folhas de medição/PU e ratios R$/km e R$/torre (RF-46..RF-50)
- [x] 2.2 Implementar `EconomicResultCalculator` em `libs/calc-engine/src/lib/pricing/economic-result-calculator.ts` com cálculo do Quadro R, coeficientes K, BDI, solver bidirecional margem/preço, corrosão IPCA e contingências (RF-51..RF-56, RN-18..RN-22)
- [x] 2.3 Implementar `CashflowCalculator` em `libs/calc-engine/src/lib/cashflow/cashflow-calculator.ts` com distribuição temporal mês a mês de custos e faturamento, cronograma de entregas de materiais e identificação do pico de exposição financeira (RF-57..RF-60, RN-23..RN-26)
- [x] 2.4 Criar suíte completa de testes unitários para os motores de serviços, resultado econômico e fluxo de caixa com aritmética decimal em `libs/calc-engine`

## 3. Backend API NestJS (`apps/api`)

- [x] 3.1 Implementar `ServiceBudgetService` e `ServiceBudgetController` em `apps/api/src/service-budget/` com endpoints REST para orçamento de serviços e folhas contratuais
- [x] 3.2 Implementar `EconomicResultService` e `EconomicResultController` em `apps/api/src/economic-result/` com endpoints para Quadro R, coeficientes K, simulação de margem/preço e comparativo de revisões
- [x] 3.3 Implementar `CashflowService` e `CashflowController` em `apps/api/src/cashflow/` com endpoints para curvas de desembolso e fluxo de caixa consolidado
- [x] 3.4 Registrar os módulos no `AppModule` e criar testes de integração em `apps/api`

## 4. Frontend Angular (`apps/web`)

- [x] 4.1 Criar serviços HTTP tipados `ServiceBudgetApiService`, `EconomicResultApiService` e `CashflowApiService` em `apps/web/src/app/offers/`
- [x] 4.2 Criar componente `ServiceBudgetComponent` com tabela de serviços hierárquica por código CIP, origens de custo e indicadores de ratio em `apps/web/src/app/offers/service-budget.component.ts`
- [x] 4.3 Criar componente `EconomicResultComponent` com visualização do Quadro R, parametrização de coeficientes K, simulador interativo de BDI/margem e comparativo de revisões em `apps/web/src/app/offers/economic-result.component.ts`
- [x] 4.4 Criar componente `CashflowComponent` com curvas S de desembolso vs faturamento, painel de exposição máxima de caixa e exportação contratual em `apps/web/src/app/offers/cashflow.component.ts`
- [x] 4.5 Integrar as 3 novas abas no `OfferDetailComponent` e criar testes unitários Vitest em `apps/web`

## 5. Quality Assurance & Validation

- [x] 5.1 Executar suíte completa de testes automatizados (`npx nx run-many -t test`)
- [x] 5.2 Executar linter em todo o monorepo (`npx nx run-many -t lint`)
- [x] 5.3 Validar build de produção de todas as aplicações (`npx nx run-many -t build`)
