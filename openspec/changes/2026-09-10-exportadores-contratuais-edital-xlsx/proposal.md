## Why

Na planilha original ("Calculo LT"), a emissão de entregáveis contratuais para o cliente e para o edital exigia montagem manual de planilhas (`BOQ-EdoB-*`, `SIMULACAO CELEO`, `CASHFLOW`), com alto índice de fórmulas corrompida (`#REF!`, `#VALUE!`), layout fragmentado por concessionária e ausência de exportação aberta (AQ-01, AQ-05, AQ-06). Para concluir a Fase F6 (F6.3 do roadmap: M09, M11, M12) e atender aos requisitos RF-47, RF-48, RF-49, RF-50, RF-60, RNF-11 e RNF-18, esta mudança implementa geradores formais de relatórios contratuais em formato XLSX profissional (com árvore CIP, BDI segregado, folha de medição, preços unitários e cronograma de faturamento), cálculo de indicadores sintéticos comparáveis (R$/km e R$/torre) e pacote aberto de exportação integral em JSON.

## What Changes

- **Motor de Exportação de Planilha do Edital (RF-47, RF-50, RNF-11):** Emissão em formato XLSX hierárquico profissional com código CIP do contratante, subtotais por grupo (fornecimento de suprimentos, obras civis, montagem eletromecânica, engenharia e gestão de canteiros) e BDI discriminado.
- **Folha de Medição Contratual & Preços Unitários (RF-48):** Geração de planilhas analíticas de medição (`M1..M10`) e folha de variação de preços unitários (`PU1..PU10`) por linha de transmissão.
- **Painel e Cálculo de Indicadores Sintéticos (RF-49):** Métrica paramétrica de custo por km (R$/km), custo por torre (R$/torre), custo por grupo e peso médio de condutores e aço por km para benchmarking de ofertas.
- **Exportador do Cronograma de Faturamento & Desembolso (RF-60):** Geração da planilha mensal de desembolso ($DT$), curva S acumulada e identificação do pico de exposição financeira no layout do contratante.
- **Exportador em Formato Aberto (RNF-18):** Geração de dump integral da proposta em pacote JSON estruturado (*Full Offer Package*) sem lock-in, contendo todas as linhas, revisões, estaqueamentos, cotações, parâmetros e resultados econômicos.
- **Central de Emissão e Exportações na UI Web:** Aba e modal dedicados com seleção de layout do edital (Padrão ANEEL / Celeo / Concessionárias), visualização prévia de indicadores e download em 1 clique.

## Capabilities

### New Capabilities

- `exportadores-contratuais`: Define a emissão de planilhas do edital com código CIP e BDI, folha de medição/PUs, cronograma de faturamento em XLSX e pacote integral em formato aberto JSON (RF-47, RF-48, RF-50, RF-60, RNF-11, RNF-18).
- `indicadores-performance`: Define o cálculo e exibição de indicadores paramétricos sintéticos (R$/km, R$/torre) comparáveis entre linhas e propostas (RF-49).

### Modified Capabilities

- `servicos`: Atualiza a especificação de serviços para formalizar a amarração entre múltiplos layouts de edital e a árvore hierárquica CIP (RF-47, RF-50).

## Impact

- **libs/domain:** Modelos de contrato de exportação (`ExportFormat`, `TenderSheetLayout`, `TenderSheetRow`, `MeasurementSheetRow`, `CashflowExportData`, `PerformanceIndicators`, `FullOfferPackage`).
- **libs/calc-engine:** `PerformanceIndicatorsCalculator` para ratios paramétricos e `ExportDataFormatter` para compilação hierárquica de linhas e CIPs.
- **apps/api:** `ExportService` e `ExportController` com endpoints de streaming/download para XLSX (`exceljs`) e JSON.
- **apps/web:** `ExportApiService`, componente `OfferExportComponent` e integração na aba da proposta comercial.
