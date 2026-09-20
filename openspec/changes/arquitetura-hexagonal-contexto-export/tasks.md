# Tasks - Arquitetura Hexagonal no Contexto Export

## 1. Domain Layer (`apps/api/src/contexts/export/domain`)

- [x] 1.1 Criar entidades dos artefatos exportáveis (`TenderSheetData`, `MeasurementSheetExportData`, `CashflowExportData`, `PerformanceIndicatorsSummary`, layouts de edital) reutilizando os contratos de `@lt-offers/domain` onde já existirem
- [x] 1.2 Definir portas `ExportDataQueryPort` e `SpreadsheetGeneratorPort` (contrato do gerador XLSX: payload estruturado → buffer + metadados de arquivo) com tokens de DI; barrel `domain/index.ts`

## 2. Application Layer (`apps/api/src/contexts/export/application`)

- [x] 2.1 Implementar casos de uso de dados (`GetPerformanceIndicatorsUseCase`, `GetTenderSheetDataUseCase` por layout, `GetMeasurementSheetDataUseCase`, `GetCashflowExportDataUseCase`) consumindo `EconomicsFacadeService` e `ExportDataQueryPort`
- [x] 2.2 Implementar casos de uso de geração (`GenerateTenderSheetUseCase`, `GenerateMeasurementSheetUseCase`, `GenerateCashflowSheetUseCase`) delegando à `SpreadsheetGeneratorPort`
- [x] 2.3 Criar testes unitários puros com dublês de porta, incluindo gerador dublê que asserta o payload estruturado recebido (`usecases.spec.ts`)

## 3. Infrastructure Layer (`apps/api/src/contexts/export/infrastructure`)

- [x] 3.1 Mover o `excel-generator.service` para `ExcelGeneratorAdapter` implementando `SpreadsheetGeneratorPort` — código e testes existentes preservados (move, não reescrita)
- [x] 3.2 Implementar mapeadores e adaptador `PrismaExportDataQueryAdapter` (construtor aceita `PrismaService | Prisma.TransactionClient`)
- [x] 3.3 Implementar `ExportController` e presenter preservando 100% dos contratos de `/api/offers/:offerId/export/*` — testes assertam envelopes JSON por igualdade e, nas rotas binárias, Content-Type, Content-Disposition e nome de arquivo exatos
- [x] 3.4 Configurar `ExportModule` importando `EconomicsModule` (fachada), com injeção por tokens

## 4. Integração, Migração e Validação

- [x] 4.1 Atualizar `AppModule` para importar `ExportModule` de `contexts/`
- [x] 4.2 Remover pasta legada `apps/api/src/export/` e conferir com grep que nenhum módulo importa do caminho antigo
- [x] 4.3 Executar `npx nx run-many -t test lint build -p api` (build webpack obrigatório) e `npx nx format:check --all`; smoke manual de download XLSX nos 3 exportadores

