# Proposal - Arquitetura Hexagonal no Contexto Export (Exportadores Contratuais)

## Why

O módulo de exportadores contratuais (`export`, Fase **F6.3** — planilha do edital XLSX por layout, folha de medição, planilha de desembolso, indicadores de desempenho e pacote aberto JSON) é o maior módulo monolítico restante (~1,9k linhas), acoplado ao Prisma e aos services legados de `cashflow` e `economic-result`. Com o contexto `economics` migrado (pré-requisito desta change), a migração de `export` fecha a cadeia de leitura: dados via fachadas e portas, geração XLSX isolada como adaptador de infraestrutura.

## What Changes

- **Bounded context `apps/api/src/contexts/export/`**:
  - **Domínio**: entidades dos artefatos exportáveis (`TenderSheetData`, `MeasurementSheetExportData`, `CashflowExportData`, `PerformanceIndicatorsSummary`, layouts de edital), porta `ExportDataQueryPort` e porta de geração `SpreadsheetGeneratorPort` (contrato do gerador XLSX), tokens de DI.
  - **Aplicação**: casos de uso `GetPerformanceIndicatorsUseCase`, `GetTenderSheetDataUseCase` (por layout), `GetMeasurementSheetDataUseCase`, `GetCashflowExportDataUseCase`, `GenerateTenderSheetUseCase`, `GenerateMeasurementSheetUseCase`, `GenerateCashflowSheetUseCase` — dados via `EconomicsFacadeService` + porta própria; testes puros com gerador dublê.
  - **Infraestrutura**: adaptador Prisma; `ExcelGeneratorAdapter` implementando `SpreadsheetGeneratorPort` (código atual do `excel-generator.service` movido, não reescrito); `ExportController` e presenter preservando `/api/offers/:offerId/export/*` incluindo respostas binárias XLSX; `ExportModule`.
- **Limpeza do legado**: remoção de `apps/api/src/export/` e atualização do `AppModule`.

## Capabilities

### New Capabilities
<!-- Nenhuma nova capability funcional; refatoração arquitetural com skip_specs: true -->

### Modified Capabilities
<!-- Nenhuma alteração contratual nos requisitos funcionais existentes -->

## Impact

- **Código afetado**: `apps/api/src/export/` migrado para `apps/api/src/contexts/export/`; `app.module.ts`.
- **APIs e contratos**: zero breaking changes em `/api/offers/:offerId/export/*` — envelopes JSON e binários XLSX (headers, nome de arquivo, layout célula a célula) idênticos.
- **Dependências**: requer a change `arquitetura-hexagonal-contexto-economics` concluída (consome `EconomicsFacadeService`).
- **Testes**: cobertura preservada; build webpack obrigatório na verificação.
