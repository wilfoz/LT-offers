## Why

Conforme diagnosticado no levantamento de requisitos (`requisitos-calculo-lt.md` §10 e §13 — Fase F7), a maior perda de valor no ciclo de vida de uma Linha de Transmissão ocorre na transição entre a proposta comercial ganha e a execução da obra em campo. No modelo legado da planilha, todo o planejamento, estrutura de custos, cronograma e histogramas precisavam ser redigitados do zero nos ERPs da construtora.

A Fase F7 materializa a **Ponte com a Execução**: transforma a proposta vencedora em uma **Linha de Base Contratual Imutável (Baseline Data 0)**, viabiliza o **Acompanhamento Físico-Financeiro (Curva S Previsto vs. Realizado)** com análise de desvios (IDP/IDC), gerencia **Aditivos e Pleitos (*Change Orders*)** e gera pacotes de dados padronizados para **Integração com ERPs corporativos** (SAP, TOTVS, Mega/Sienge).

## What Changes

- **Congelamento da Baseline da Obra (Data 0)**: Derivação automática da linha de base de execução quando a proposta é marcada como ganha (`WON`), congelando escopo, EAP, quantitativos de engenharia, histogramas e cronograma financeiro.
- **Curva S de Acompanhamento Físico-Financeiro**: Registro mensal de avanço físico executado em campo e medição financeira real, calculando desvios de prazo (IDP/SPI) e custo (IDC/CPI).
- **Gestão de Aditivos & Pleitos (*Change Orders*)**: Registro de variações contratuais em campo (alteração de solo, realocação de torres, novas quantidades) com cálculo do delta sobre a baseline original e projeção do *Current Working Estimate* (CWE).
- **Intercâmbio e Pacote de Carga para ERPs**: Exportação estruturada de EAP, centros de custo, contas orçamentárias e cronograma físico-financeiro para sistemas corporativos.
- **Painel de Acompanhamento de Obra na Web**: Nova interface reativa em Angular apresentando gráficos de Curva S comparativa, velocímetros de IDP/IDC, histórico de medições e controle de aditivos.

## Capabilities

### New Capabilities
- `baseline-execucao`: Linha de Base Contratual Imutável (Data 0) derivada da proposta vencedora com EAP e contas de custo.
- `acompanhamento-curva-s`: Curva S de avanço físico e financeiro previsto vs. realizado com índices de desempenho (IDP/IDC).
- `aditivos-contratuais`: Gestão de aditivos, pleitos e ordens de alteração (*Change Orders*) com versão CWE.
- `integracao-erp`: Exportador de pacote de dados estruturado para integração com ERPs de construção.

### Modified Capabilities
- `ofertas/cadastro-revisoes-linhas`: Transição de status da oferta para `WON` e `IN_EXECUTION` disparando a criação da baseline.

## Impact

- **Domínio (`libs/domain`)**: Novos contratos e tipos para `WorkBaseline`, `MonthlyProgressRecord`, `ContractChangeOrder`, `EarnedValueMetrics` e `ErpIntegrationPackage`.
- **Motor de Cálculo (`libs/calc-engine`)**: Novo calculador `EarnedValueCalculator` (Análise de Valor Agregado / Curva S com SPI, CPI, CV, SV) e `ChangeOrderCalculator`.
- **Backend API (`apps/api`)**: Módulo `BaselineModule`, serviços `BaselineService`, `ProgressTrackingService`, `ChangeOrderService`, `ErpIntegrationService` e respectivos endpoints REST.
- **Frontend Web (`apps/web`)**: Componentes Angular `WorkBaselineComponent`, `CurveSTrackingComponent`, `ChangeOrdersComponent` e aba de acompanhamento em `OfferDetailComponent`.
