## 1. Contratos de Domínio para Coeficientes de Campo

- [x] 1.1 Criar tipos e interfaces para `FieldAdjustmentFactors`, `AccessSeverityWeights`, `GeotechnicalFactors` e `PrecipitationRegionData` em `libs/domain/src/lib/field-factors/field-factors.types.ts`
- [x] 1.2 Exportar novos contratos no barrel `libs/domain/src/index.ts` e validar compilação

## 2. Expansão e Calibração do Motor de Cálculo (calc-engine)

- [x] 2.1 Expandir `PrecipitationCalculator` em `libs/calc-engine/src/lib/schedule/precipitation-calculator.ts` para cobrir todas as 27 UFs brasileiras com fatores mensais calibrados (RN-16)
- [x] 2.2 Atualizar `ScheduleCalculator` em `libs/calc-engine/src/lib/schedule/schedule-calculator.ts` para suportar fator de severidade de acesso ponderado da linha (`AccessDifficulty`) e validação estrita de taxas máximas
- [x] 2.3 Atualizar `FoundationQuantityEngine` em `libs/calc-engine/src/lib/foundations/foundation-quantity-engine.ts` para calcular volume empolado de bota-fora e reaterro compactado com coeficientes por tipo de solo
- [x] 2.4 Atualizar o orquestrador do grafo de cálculo (`calc-engine`) para propagar os coeficientes de campo nas frentes de cronograma e fundações

## 3. Integração na API e Serviços

- [x] 3.1 Atualizar schemas, DTOs e serviços de `WorkCrew` em `apps/api` para persistência e validação de taxas de produção máxima
- [x] 3.2 Criar endpoint/serviço para consulta de coeficientes pluviométricos e parâmetros de campo na API

## 4. Testes Automatizados e Validação Geral

- [x] 4.1 Adicionar testes unitários para o `PrecipitationCalculator` validando todas as 27 UFs e faixas de precipitação
- [x] 4.2 Adicionar testes unitários para o `ScheduleCalculator` com fator de acesso ponderado e equipes de múltiplos condutores
- [x] 4.3 Adicionar testes unitários para o `FoundationQuantityEngine` validando volumes de empolamento e compactação
- [x] 4.4 Executar suíte completa de testes (`npx nx run-many -t test`) e validar integridade dos 900+ testes existentes
