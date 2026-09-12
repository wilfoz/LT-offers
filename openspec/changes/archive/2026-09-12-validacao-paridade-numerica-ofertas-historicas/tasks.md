## 1. Contratos de Domínio para Paridade

- [x] 1.1 Criar contratos de dados e interfaces para `ParityMetricComparison`, `ParityToleranceLevel`, `ParityReport`, `ParityEvaluationResult` e `HistoricalOfferFixture` em `libs/domain/src/lib/contracts/parity.types.ts`
- [x] 1.2 Exportar novos contratos no barrel `libs/domain/src/index.ts` e validar compilação

## 2. Fixtures de Ofertas Históricas Reais

- [x] 2.1 Criar fixture estruturada para o Perfil Linha Única *Solaris MG (500 kV)* em `libs/calc-engine/src/lib/parity/fixtures/solaris-mg-500kv.fixture.ts`
- [x] 2.2 Criar fixture estruturada para o Perfil *Lote Multilinhas Tucano* em `libs/calc-engine/src/lib/parity/fixtures/tucano-multiline.fixture.ts`
- [x] 2.3 Criar fixture estruturada para o Perfil *Regime Especial REIDI & Faturamento Direto* em `libs/calc-engine/src/lib/parity/fixtures/reidi-direct-bill.fixture.ts`

## 3. Orquestrador de Pipeline e Avaliador de Paridade

- [x] 3.1 Implementar `FullOfferPipelineRunner` em `libs/calc-engine/src/lib/parity/full-offer-pipeline-runner.ts` executando a cadeia completa de cálculo (quantitativos -> tributos -> cronograma/histograma -> serviços/BDI -> fluxo de caixa)
- [x] 3.2 Implementar `ParityEvaluator` em `libs/calc-engine/src/lib/parity/parity-evaluator.ts` com avaliação das 3 faixas de tolerância (0 para discretos, ≤ 0,001% para físicos contínuos, ≤ 0,01% para monetários)
- [x] 3.3 Implementar `ParityReportGenerator` em `libs/calc-engine/src/lib/parity/parity-report-generator.ts` para geração de relatórios estruturados em Markdown e JSON com anotações de `CORRECAO_HOMOLOGADA`

## 4. Suítes de Testes de Paridade, Casos Limite e Performance

- [x] 4.1 Implementar suíte de paridade numérica ponta a ponta em `libs/calc-engine/src/lib/parity/parity-validation.spec.ts` validando os perfis históricos
- [x] 4.2 Implementar testes de limites de regras de negócio em `libs/calc-engine/src/lib/parity/business-rules-boundary.spec.ts` cobrindo multi-UF (RN-05/06), ponderação de futuros LME (RN-07/09), precipitação máxima (RN-16) e imutabilidade de vigência (RNF-05)
- [x] 4.3 Implementar teste de benchmark de performance em `libs/calc-engine/src/lib/parity/performance-benchmark.spec.ts` validando tempos de recálculo total (< 30s) e incremental (< 2s) (RNF-01)

## 5. Integração na API e Relatórios de Conformidade

- [x] 5.1 Implementar serviço `ParityService` e endpoint em `apps/api` para execução e consulta de relatórios de paridade numérica
- [x] 5.2 Adicionar testes unitários e de integração para o serviço e controller de paridade na API

## 6. Validação Geral e Homologação de Aceite

- [x] 6.1 Executar a suíte completa de testes do monorepo (`npx nx run-many -t test`) e garantir 100% de sucesso
- [x] 6.2 Gerar o relatório consolidado de conformidade de paridade numérica comprovando os critérios de aceite do §14
