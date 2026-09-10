## 1. Domain & Fiscal Contracts (`libs/domain`)

- [x] 1.1 Criar modelos de cotações de materiais e moedas (`MaterialQuote`, `CurrencyCode`, `QuoteSelection`) em `libs/domain/src/lib/pricing/quote.ts`
- [x] 1.2 Criar modelos de precificação de commodities metálicas (`CommodityPricingConfig`, `LmeQuote`, `MidwestPremium`, `FabricationPremium`, `DeliveryWeightProfile`) em `libs/domain/src/lib/pricing/commodity.ts`
- [x] 1.3 Criar modelos e enums tributários brasileiros (`TaxProfile`, `IcmsRule`, `DifalRule`, `FecoepRule`, `IpiRule`, `PisCofinsRule`, `TaxRegime`, `TaxBreakdown`) em `libs/domain/src/lib/tax/tax-rules.ts`
- [x] 1.4 Exportar contratos no index público de `@lt-offers/domain` e criar testes de validação em `libs/domain`

## 2. Calculation Engine (`libs/calc-engine`)

- [x] 2.1 Implementar `CommodityCalculator` em `libs/calc-engine/src/lib/pricing/commodity-calculator.ts` com cálculo spot/futuros e ponderação por entregas mensais (RN-07, RN-08, RN-09, RF-30, RF-31)
- [x] 2.2 Implementar `TaxCalculator` em `libs/calc-engine/src/lib/tax/tax-calculator.ts` com ICMS origem/destino (rateio 2 UFs), DIFAL base simples e dupla, FECOEP, IPI, PIS/COFINS e regimes REIDI / Faturamento Direto (RN-04, RN-05, RN-06, RF-32)
- [x] 2.3 Implementar `MaterialPricingCalculator` em `libs/calc-engine/src/lib/pricing/material-pricing-calculator.ts` combinando quantitativos, cotações vencedoras e memória de cálculo tributária (RF-28, RF-29, RF-34)
- [x] 2.4 Criar suíte completa de testes unitários para `TaxCalculator`, `CommodityCalculator` e `MaterialPricingCalculator` em `libs/calc-engine`

## 3. Backend API NestJS (`apps/api`)

- [x] 3.1 Criar serviço e tabelas de referência fiscal (matriz ICMS interestadual 27 UFs, FECOEP, IPI por NCM) em `apps/api/src/taxation/` (RF-33, RNF-15)
- [x] 3.2 Implementar `PricingService` e `PricingController` em `apps/api/src/pricing/` com endpoints REST para cotações, simulação de commodities e consolidação de materiais por linha
- [x] 3.3 Registrar módulos `TaxationModule` e `PricingModule` no `AppModule` e implementar testes de integração em `apps/api`

## 4. Frontend Angular (`apps/web`)

- [x] 4.1 Criar serviço HTTP tipado `PricingApiService` em `apps/web/src/app/offers/pricing-api.service.ts`
- [x] 4.2 Criar componente `MaterialPricingComponent` com cards de KPIs, tabela analítica de materiais com impostos e filtros por família de material
- [x] 4.3 Implementar modal de Memória de Cálculo Tributária item a item e simulador de sensibilidade de commodities e regimes fiscais (REIDI / Faturamento Direto)
- [x] 4.4 Integrar a aba "Preços & Tributos (M06)" ao `OfferDetailComponent` e criar testes unitários Vitest em `apps/web`

## 5. Quality Assurance & Validation

- [x] 5.1 Executar suíte completa de testes automatizados (`npx nx run-many -t test`)
- [x] 5.2 Executar linter em todo o monorepo (`npx nx run-many -t lint`)
- [x] 5.3 Validar build de produção de todas as aplicações (`npx nx run-many -t build`)
