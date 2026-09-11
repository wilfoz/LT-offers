## 1. Contratos de Domínio & Calculadores (libs/domain & libs/calc-engine)

- [x] 1.1 Adicionar modelos de exportação e indicadores (`TenderSheetLayout`, `TenderSheetRow`, `MeasurementSheetRow`, `CashflowExportData`, `PerformanceIndicators`, `FullOfferPackage`) em `libs/domain`
- [x] 1.2 Implementar `PerformanceIndicatorsCalculator` em `libs/calc-engine` para cálculo de ratios sintéticos de custo por km e por torre (RF-49)
- [x] 1.3 Exportar novos tipos e calculadores nos arquivos `index.ts` de `domain` e `calc-engine`

## 2. Motor de Exportação no Backend (apps/api)

- [x] 2.1 Implementar `ExcelGeneratorService` utilizando `exceljs` com formatação corporativa, estilos, cores e bordas padronizadas (RNF-11)
- [x] 2.2 Implementar `ExportService` e `ExportController` com geração de Planilha do Edital (RF-47, RF-50), Folha de Medição/PUs (RF-48), Cronograma de Faturamento (RF-60) e Pacote Aberto JSON (RNF-18)
- [x] 2.3 Adicionar suite de testes unitários para `ExcelGeneratorService`, `ExportService` e `ExportController` no NestJS

## 3. Central de Exportação no Frontend (apps/web)

- [x] 3.1 Implementar `ExportApiService` no Angular para download reativo de arquivos binários XLSX e JSON
- [x] 3.2 Implementar `OfferExportComponent` com painel de indicadores sintéticos de custo (RF-49), seletor de layout do edital e botões de download com 1 clique
- [x] 3.3 Registrar e integrar a aba "Central de Exportação" no `OfferDetailComponent`
- [x] 3.4 Adicionar testes automatizados no Angular com Vitest para `ExportApiService` e `OfferExportComponent`

## 4. Validação e Aceite

- [x] 4.1 Executar bateria completa de testes no monorepo Nx (`nx run-many -t test`)
- [x] 4.2 Validar conformidade com os requisitos RF-47, RF-48, RF-49, RF-50, RF-60, RNF-11 e RNF-18
