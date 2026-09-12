## Why

Conforme estipulado no levantamento de requisitos (`requisitos-calculo-lt.md` §14 e RNF-04, RNF-05, RNF-08), nenhuma fase de migração da planilha para a aplicação web é aceita exclusivamente por inspeção visual ou testes sintéticos. O critério definitivo de aceite é a **paridade numérica comprovada contra propostas reais já fechadas**.

Esta change implementa o arcabouço completo de **Validação de Paridade Numérica e Fixtures Reais**: consolida fixtures históricas representativas do setor elétrico (LT 500kV Solaris MG, Lote Multilinhas Tucano e Regime Especial REIDI/Faturamento Direto), executa o pipeline ponta a ponta do `calc-engine` e avalia os resultados segundo a matriz de tolerâncias declarada (zero para discretos, < 0,001% para grandezas físicas contínuas e ≤ 0,01% para valores financeiros agregados), gerando relatórios de conformidade e justificativa de deltas técnicos.

## What Changes

- **Conjunto de Fixtures Históricas Reais**: Definição e versionamento de fixtures estruturadas representativas do setor elétrico:
  - *Solaris MG (500 kV)*: Linha única com terrenos mistos, estruturas autoportantes e estaiadas, regime padrão com DIFAL.
  - *Lote Multilinhas Tucano*: 2 a 3 linhas simultâneas, canteiro compartilhado, entregas mensais e ponderação de futuros de commodities (LME/Midwest).
  - *Regime REIDI & Faturamento Direto*: Benefício fiscal de suspensão de PIS/COFINS e faturamento direto de materiais.
- **Motor Avaliador de Paridade Numérica (`ParityEvaluator`)**: Avaliação automatizada de paridade em múltiplos níveis de tolerância:
  - *Quantitativos Discretos*: Tolerância exata (Delta 0) em torres, vãos, bobinas, cadeias e equipes alocadas.
  - *Quantitativos Físicos Contínuos*: Tolerância < 0,001% em toneladas de cabos, volumes de concreto (m³) e armaduras de aço (kg).
  - *Valores Financeiros Agregados*: Tolerância ≤ 0,01% em custo líquido, tributos (ICMS/DIFAL/PIS/COFINS), custo de serviços, BDI, preço de venda e fluxo de caixa.
- **Gerador de Relatórios de Conformidade e Auditoria de Deltas**: Registro estruturado de divergências justificadas (correções de fórmulas quebradas ou erros de arredondamento da planilha legada, catalogados como *Correção Técnica Homologada*).
- **Validação de Casos Limite de Regras de Negócio (RN-01..RN-26)**: Testes de casos de borda para LT interestadual (2 UFs), fornecedores internacionais, mês de chuva máxima e imutabilidade de proposta histórica frente a novas vigências de catálogo (RNF-05).
- **Benchmark de Desempenho e Não-Regressão (RNF-01)**: Teste automatizado de tempo de recálculo completo (< 30s) e incremental (< 2s).

## Capabilities

### New Capabilities
- `paridade-numerica`: Critério de aceite por paridade numérica contra ofertas históricas reais, validação ponta a ponta com matriz de tolerâncias declarada, testes de regras de negócio em casos limite e relatório de conformidade (§14, RN-01..RN-26, RNF-01, RNF-04, RNF-05, RNF-08).

### Modified Capabilities
<!-- Nenhuma especificação de regra existente é modificada; a nova capability audita e homologa a conformidade do motor existente -->

## Impact

- **Motor de Cálculo (`libs/calc-engine`)**: Novo módulo `parity` contendo `ParityEvaluator`, fixtures de dados reais, suítes de teste de paridade ponta a ponta, verificadores de casos limites de regras de negócio e testes de não-regressão de desempenho (RNF-01).
- **Domínio (`libs/domain`)**: Tipagens e contratos para `ParityReport`, `ParityMetricComparison`, `ParityToleranceLevel` e `HistoricalOfferFixture`.
- **Backend API (`apps/api`) & Relatórios**: Utilitário/serviço para exportação e consulta do status de paridade e conformidade das propostas.
