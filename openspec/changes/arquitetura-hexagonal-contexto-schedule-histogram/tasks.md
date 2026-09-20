# Tasks - Arquitetura Hexagonal nos Contextos Schedule e Histogram

## 1. Contexto Schedule - Domain e Application (`apps/api/src/contexts/schedule`)

- [ ] 1.1 Criar entidades de domínio (`LineSchedule`, `ScheduleActivity`, `CampPlan`), porta `ScheduleDataQueryPort` (linhas, torres, fatores de campo, precipitação) com token de DI e barrel `domain/index.ts`
- [ ] 1.2 Implementar `GetLineScheduleUseCase` e `GetLineCampsUseCase` delegando a `@lt-offers/calc-engine` (schedule/precipitation/camp calculators), com datas recebidas como parâmetro (RNF-04) e testes unitários puros (`usecases.spec.ts`)

## 2. Contexto Schedule - Infrastructure

- [ ] 2.1 Implementar mapeadores e adaptador Prisma `PrismaScheduleDataQueryAdapter` (construtor aceita `PrismaService | Prisma.TransactionClient`; Decimal→string nos mappers)
- [ ] 2.2 Implementar `ScheduleController` e presenter preservando 100% dos contratos HTTP de `/api/lines/:lineId/schedule/*` (cronograma e canteiros), com testes de controller preservando as asserções do legado
- [ ] 2.3 Configurar `ScheduleModule` com injeção por tokens e fachada `ScheduleFacadeService` exportada

## 3. Contexto Histogram - Domain e Application (`apps/api/src/contexts/histogram`)

- [ ] 3.1 Criar entidades de domínio (`LineHistogram`, `ConsolidatedHistogram`) e tokens, com barrel `domain/index.ts`
- [ ] 3.2 Implementar `GetLineHistogramUseCase` e `GetOfferConsolidatedHistogramUseCase` consumindo `ScheduleFacadeService` (elimina o import do service legado), com testes unitários puros

## 4. Contexto Histogram - Infrastructure

- [ ] 4.1 Implementar `HistogramController` e presenter preservando 100% dos contratos HTTP das rotas de histograma por linha e consolidado por oferta, com testes de controller
- [ ] 4.2 Configurar `HistogramModule` importando `ScheduleModule` (fachada)

## 5. Integração, Migração e Validação

- [ ] 5.1 Atualizar `AppModule` para importar `ScheduleModule` e `HistogramModule` de `contexts/`
- [ ] 5.2 Remover pastas legadas `apps/api/src/schedule/` e `apps/api/src/histogram/` e conferir com grep que nenhum módulo importa dos caminhos antigos
- [ ] 5.3 Executar `npx nx run-many -t test lint build -p api` (build webpack obrigatório) e `npx nx format:check --all`
