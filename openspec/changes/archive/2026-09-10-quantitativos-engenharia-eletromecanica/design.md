## Context

A orçamentação de Linhas de Transmissão (M05) exige a quantificação precisa de elementos eletromecânicos (torres, condutores, cabos de guarda, tirantes, isoladores, amortecedores, aterramento, sinalização, acessos e travessias). O estaqueamento executivo (M04) e os catálogos corporativos (M02/M03) fornecem as geometrias e atributos técnicos; este motor consolida essas parcelas em volumes físicos exatos (m³, km, toneladas, conjuntos) para alimentar a precificação (M06) e o cronograma (M07).

## Goals / Non-Goals

**Goals:**
- Implementar motor TypeScript puro e determinístico em `libs/calc-engine` para quantificação eletromecânica com `DecimalValue` (RF-23, RF-25, RF-26, RF-27, RN-10, RN-11).
- Segregar rigorosamente parcelas de quantidade: Teórico de Projeto, Margem de Perda / Extra de Obra e Peças Sobressalentes contratuais (*Spares*).
- Disponibilizar endpoints REST em `apps/api` para resumo consolidado e memorial de cálculo por item.
- Criar interface no Angular (`apps/web`) com visão executiva (KPIs de peso total de aço, km de cabos, discos de isoladores), tabelas analíticas filtráveis por família de suprimentos e modal de memória de cálculo com rastreabilidade estrutural.

**Non-Goals:**
- Não inclui precificação monetária ou aplicação de regras tributárias (coberto em M06 / `precos-commodities-tributos`).
- Não inclui alocação de equipes ou cálculo de produtividades temporais (pertencente a M07 / Cronograma Físico).

## Decisions

### 1. Separação por Calculadores Especializados no Motor de Cálculo
- **Decisão:** Criar submódulos dedicados em `libs/calc-engine/src/lib/electromechanical/`:
  - `TowerQuantityCalculator`: inventário de torres treliçadas e estaiadas por série/tipo/altura com extensões de perna e perdas de 0,5% (RN-10).
  - `ConductorQuantityCalculator`: condutores e cabos de guarda (aço e OPGW) com acréscimo de flecha (sag), descidas verticais de torres de emenda e perdas de 3,0% (RN-10, RN-11).
  - `HardwareQuantityCalculator`: discos de vidro/porcelana ou bastões poliméricos, ferragens de suspensão/ancoragem, tirantes e amortecedores Stockbridge.
  - `AccessQuantityCalculator`: abertura e recuperação de acessos, limpeza de faixa (desmate raso, médio e denso) e travessias especiais.
  - `ElectromechanicalSummaryCalculator`: consolidação final por família e item de material.
- **Alternativas descartadas:** Uma função monolítica gigante; rejeitada por violar a manutenibilidade, testabilidade isolada e o princípio de responsabilidade única.

### 2. Formato Unificado de Saída para o Motor de Preços (M06)
- **Decisão:** A saída do motor gera `MaterialQuantityItem` com `itemCode`, `family`, `unit`, `theoreticalQuantity`, `extraQuantity`, `spareQuantity`, `totalQuantity`. O motor M06 consome diretamente esse array sem precisar reinterpretar tipos de estrutura ou cabos.
- **Alternativas descartadas:** M06 consultar estaqueamento diretamente; rejeitada para evitar duplicação de regras de quebra e flecha.

### 3. Memória de Cálculo Estrutural e Auditabilidade (RF-27)
- **Decisão:** Cada calculador gera um array detalhado `traceability` com o identificador da torre (`structureNumber`, `stationM`), valor base, regra aplicada e resultado intermediário, preservando o determinismo numérico.

## Risks / Trade-offs

- [Risco] Ausência de estaqueamento detalhado na fase de estudo preliminar.
  - **Mitigação:** Suporte a cálculo preliminar através de parâmetros médios de vão e extensão cadastrados na linha (`TransmissionLine.refinedLengthKm` ou `reportLengthKm`).
- [Risco] Linhas com milhares de estruturas gerando grande volume de rastreabilidade.
  - **Mitigação:** Cálculo sob demanda e paginação de memória de cálculo no backend, mantendo o resumo consolidado leve.
