# Tasks - Arquitetura Hexagonal no Contexto Baseline

> Revisado no apply: o legado é em memória (Maps + seeds, sem tabelas Prisma) — repositórios viram adaptadores in-memory, sem unit of work (design, decisões 4–6).

## 1. Domain Layer (`apps/api/src/contexts/baseline/domain`)

- [x] 1.1 Definir exceções tipadas com as mensagens pt-BR exatas do legado (`BaselineNotFoundException`, `NoActiveBaselineException`, `BaselineOfferNotFoundException`, `ChangeOrderNotFoundException`)
- [x] 1.2 Definir portas `BaselinesRepository` (sem update/delete — imutabilidade arquitetural), `ChangeOrdersRepository`, `ProgressRecordsRepository`, `BaselineOfferQueryPort`, `AuditTrailPort` e `ErpSpreadsheetPort`, com tokens de DI
- [x] 1.3 Exportar exceções, portas e tokens no barrel `domain/index.ts`

## 2. Application Layer (`apps/api/src/contexts/baseline/application`)

- [x] 2.1 Implementar casos de uso de baseline (`FreezeBaselineUseCase` com data injetada e valores do `EconomicsFacadeService` com fallback, `GetActiveBaselineUseCase` com fallback do seed adaptado, `GetBaselineByIdUseCase`, `ListBaselinesUseCase`)
- [x] 2.2 Implementar casos de uso de aditivos (`CreateChangeOrderUseCase`, `UpdateChangeOrderUseCase` com aprovação carimbada, `ListChangeOrdersUseCase`, `GetCurrentWorkingEstimateUseCase` via `ChangeOrderCalculator`)
- [x] 2.3 Implementar casos de uso de acompanhamento e ERP (`RecordMonthlyProgressUseCase` com upsert por mês, `GetCurveSUseCase` com ano-base injetado e `EarnedValueCalculator`, `ListProgressRecordsUseCase`, `GenerateErpJsonUseCase` e `GenerateErpXlsxUseCase` via `ErpSpreadsheetPort`), todos com eventos de auditoria idênticos ao legado via `AuditTrailPort`
- [x] 2.4 Criar testes unitários puros com repositórios em memória e dublês de porta, preservando as asserções do spec legado (`usecases.spec.ts`)

## 3. Infrastructure Layer (`apps/api/src/contexts/baseline/infrastructure`)

- [x] 3.1 Implementar adaptadores in-memory (`InMemoryBaselinesRepository`, `InMemoryChangeOrdersRepository`, `InMemoryProgressRecordsRepository`) preservando os seeds e as regras de geração de ID do legado
- [x] 3.2 Implementar `PrismaBaselineOfferQueryAdapter` (única consulta Prisma: dados básicos da oferta), `AuditServiceTrailAdapter` (delega ao `AuditService` global) e `ExcelErpSpreadsheetAdapter` (código ExcelJS movido, não reescrito)
- [x] 3.3 Implementar `BaselineController` preservando 100% dos contratos de `/api/offers/:offerId/baseline*`, `curve-s`, `progress-records`, `change-orders`, `cwe` e `erp-package*` (incl. headers do XLSX), com testes preservando as asserções do legado
- [x] 3.4 Configurar `BaselineModule` com injeção por tokens, importando `EconomicsModule` (fachada)

## 4. Integração, Migração e Validação

- [x] 4.1 Atualizar `AppModule` para importar `BaselineModule` de `contexts/` e adicionar o módulo ao teste de regressão de DI (`context-modules-di.spec.ts`)
- [x] 4.2 Remover pasta legada `apps/api/src/baseline/` e conferir com grep que nenhum módulo importa do caminho antigo
- [x] 4.3 Executar `npx nx run-many -t test lint build -p api` (build webpack obrigatório) e `npx nx format:check --all`
