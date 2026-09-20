# Tasks - Arquitetura Hexagonal nos Contextos Pricing e Taxation

## 1. Contexto Taxation - Domain e Application (`apps/api/src/contexts/taxation`)

- [x] 1.1 Criar entidades de domínio das regras tributárias (`IcmsRule`, `IpiRule`, `PisCofinsRule`, `UfState`) e a porta `TaxRulesQueryPort` com token de DI (`tokens.ts`), exportadas no barrel `domain/index.ts`
- [x] 1.2 Implementar casos de uso `GetStatesUseCase` e `GetTaxRulesMapUseCase` (mapas ICMS/IPI/PIS-COFINS por UF) com testes unitários puros usando dublês de porta em memória (`usecases.spec.ts`)

## 2. Contexto Taxation - Infrastructure

- [x] 2.1 Implementar adaptador da porta de tabelas tributárias — descoberto na implementação que a fonte legada é estática em código (sem Prisma): `StaticTaxTablesAdapter` implementa `TaxRulesQueryPort`; matriz de ICMS e regra de PIS/COFINS derivadas como funções puras de domínio
- [x] 2.2 Implementar `TaxationController` preservando 100% dos contratos HTTP de `/api/taxation/*` (envelopes com alíquotas em number, como no legado), com testes de controller (asserções do legado preservadas)
- [x] 2.3 Configurar `TaxationModule` com injeção por tokens e fachada `TaxationFacadeService` exportada para consumidores internos

## 3. Contexto Pricing - Domain e Application (`apps/api/src/contexts/pricing`)

- [x] 3.1 Criar entidades de domínio (`Quote`, `LinePricingResult`), portas `QuotesQueryPort` e `PricingDataQueryPort` com tokens de DI, exportadas no barrel `domain/index.ts`
- [x] 3.2 Implementar `GetQuotesUseCase` e `CalculateLinePricingUseCase` orquestrando portas + `TaxationFacadeService` + `FoundationsFacadeService` e delegando o cálculo a `@lt-offers/calc-engine`, com testes unitários puros (`usecases.spec.ts`)

## 4. Contexto Pricing - Infrastructure

- [x] 4.1 Implementar adaptadores das portas de pricing — `PrismaPricingDataQueryAdapter` (recorte da linha, Decimal→string, `@Inject(PrismaService)` + união com `Prisma.TransactionClient`) e `StaticQuotesAdapter` (cotações legadas são estáticas em código, sem Prisma — mesmo achado do taxation)
- [x] 4.2 Implementar `PricingController` preservando 100% dos contratos HTTP de `/api/lines/:lineId/pricing/*`, com testes de controller (asserções do legado preservadas)
- [x] 4.3 Configurar `PricingModule` importando `TaxationModule` e `FoundationsModule` (fachadas), com injeção por tokens

## 5. Integração, Migração e Validação

- [x] 5.1 Atualizar `AppModule` para importar `TaxationModule` e `PricingModule` de `contexts/`
- [x] 5.2 Remover pastas legadas `apps/api/src/pricing/` e `apps/api/src/taxation/` e conferir com grep que nenhum módulo importa dos caminhos antigos
- [x] 5.3 Executar `npx nx run-many -t test lint build -p api` (build webpack obrigatório — testes puros não importam a infraestrutura Prisma) e `npx nx format:check --all`
- [x] 5.4 (Trabalho descoberto) Corrigir falha de bootstrap de DI em TODOS os contextos: construtores `PrismaService | Prisma.TransactionClient` emitem paramtype `Object` e o Nest não resolvia os providers (a API não subia desde a migração hexagonal — testes puros e build nunca exercitam DI real). Fix: `@Inject(PrismaService)` explícito nos 18 construtores de união (catalogs ×13, offers ×2, staking ×2, pricing ×1) + teste permanente de regressão `app/context-modules-di.spec.ts` compilando os 6 módulos de contexto com DI real (sem banco — `PrismaService` só conecta no `onModuleInit`)
