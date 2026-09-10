## Why

A orçamentação de linhas de transmissão exige a determinação exata dos volumes de obras civis (escavação, concreto, armadura em aço, reaterro compactado, perfuração em rocha, estacas e formas) a partir do cruzamento de cada torre estaqueada com o solo geológico classificado e a fundação atribuída. Na planilha legada (`Calculo LT`), a aba `Fundaciones` consome mais de 220 mil células e 200 mil fórmulas com alta taxa de acoplamento e risco de erros de propagação por conversão silenciosa de valores não encontrados em zero.

Esta proposta introduz a capability **`fundacoes`** (Fase F2 do roadmap, cobrindo M05 com integração com M04), fornecendo um motor de cálculo desacoplado e determinístico em `libs/calc-engine`, contratos de dados em `libs/domain`, endpoints de agregação e rastreabilidade na API NestJS (`apps/api`) e visualização analítica/memória de cálculo na interface Angular (`apps/web`).

## What Changes

- **Novo Motor de Cálculo de Fundações e Escavações (`libs/calc-engine`)**:
  - Implementação pura em TypeScript sem dependências de infraestrutura (RNF-16), determinística (RNF-04) e com aritmética decimal exata (`DecimalValue`) sem números em ponto flutuante (RNF-08).
  - Resolução paramétrica por torre do catálogo de volumes vigentes (`FoundationVolume`), identificando a combinação `TowerType × SoilType × FoundationType` (RN-13).
  - Aplicação estrita dos fatores de sobre-escavação por terreno (duro 10%, normal 5%, com água 20%, tubulão 5%), perdas de concreto (5%), perdas de aço (10% reforço, 3% tubulão) e cálculo de reaterro compactado (RN-12).
  - Suporte tanto ao estaqueamento detalhado torre a torre (M04/RF-24) quanto ao estaqueamento paramétrico preliminar por distribuição percentual estimada de solos e fundações (RF-21).
  - Distinção rigorosa entre `0`, valor pendente (`null`) e combinação inválida/não cadastrada, gerando relatório de pendências sem zeramento silencioso (RNF-09).
- **Contratos e Tipos de Domínio (`libs/domain`)**:
  - Definição dos tipos `FoundationCalculationInput`, `TowerFoundationQuantities`, `LineFoundationSummary`, `FoundationMaterialItem`, `FoundationTraceabilityItem` e `FoundationCalculationResult`.
  - Suporte a filtros e agrupamentos por linha de transmissão, família de torre, tipo de solo e tipo de fundação.
- **Serviços e Endpoints de API (`apps/api`)**:
  - `GET /api/offers/:offerId/lines/:lineId/foundations/quantities`: Retorna quantitativos consolidados e memória de cálculo analítica da linha.
  - `GET /api/offers/:offerId/lines/:lineId/foundations/traceability`: Rastreabilidade item a item, torre a torre (RF-27).
  - `GET /api/offers/:offerId/lines/:lineId/foundations/validation`: Diagnóstico geotécnico e combinações pendentes na oferta (RF-20).
- **Visualização e Memória de Cálculo Web (`apps/web`)**:
  - Painel de Quantitativos de Fundações e Escavações integrado à visão da linha de transmissão.
  - Tabela consolidada com subtotais por família de material (Escavação, Concreto, Aço, Reaterro, Especiais) separando quantidade teórica, sobre-escavação/desperdício e total.
  - Drill-down e rastreabilidade por torre com indicação visual de parâmetros aplicados.

## Capabilities

### New Capabilities
- `fundacoes`: Motor e contratos de quantitativos de fundações, escavações, armaduras, concreto e reaterro para linhas de transmissão (M05, RF-20, RF-21, RF-24, RF-26, RF-27, RN-12, RN-13, RNF-04, RNF-08, RNF-09, RNF-16).

### Modified Capabilities
<!-- Nenhuma capability existente tem requisitos alterados; esta proposta adiciona nova capability ao ecossistema OpenSpec. -->

## Impact

- **Código Afetado**:
  - `libs/domain`: novos contratos de quantitativos e rastreabilidade de fundações.
  - `libs/calc-engine`: novo módulo `foundation-calculator` e integração ao grafo de dependências.
  - `apps/api`: novos services/controllers de cálculo de fundações sob o módulo de linhas/ofertas.
  - `apps/web`: nova página/aba de Quantitativos de Fundações com memória de cálculo e rastreabilidade.
- **Compatibilidade e Dependências**:
  - Consome catálogos vigentes (`FoundationVolume`, `SoilType`, `FoundationType`, `TowerType`) e estaqueamento (`StakingTowerItem` / `PreliminaryDistribution`).
  - Sem impacto destrutivo ou breaking changes nas APIs existentes.
