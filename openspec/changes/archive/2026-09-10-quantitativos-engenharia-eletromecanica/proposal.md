## Why

A orçamentação precisa de linhas de transmissão requer o levantamento detalhado de todos os quantitativos de engenharia eletromecânica a partir do estaqueamento executivo ou preliminar. Atualmente, a planilha *Calculo LT* calcula esses quantitativos em abas isoladas (`Torres`, `Conductores`, `CG`, `Cadenas`, `Tirantes`, `Amortiguacion`, `Señalizacion`, `Tierras`, `Accesos`, `Travesias`, consolidando em `Cantidades`), com alto risco de inconsistência, fórmulas voláteis e falta de rastreabilidade. Esta proposta implementa o motor completo de quantitativos eletromecânicos da **Fase F2 / Módulo M05** (requisitos **RF-23, RF-25, RF-26, RF-27** e regras de negócio **RN-10, RN-11**), integrando o inventário de estruturas com o cálculo exato de massas, comprimentos, sobressalentes e perdas.

## What Changes

- **Motor de Quantitativos de Torres e Estruturas (RF-23):** Cálculo do inventário de torres por série, tipo, altura e peso unitário/total, contemplando extensões de perna (*leg extension*), acessórios e percentual de extra/quebra (0,5% conforme RN-10).
- **Motor de Quantitativos de Condutores e Cabos de Guarda (RF-23, RN-10, RN-11):** Cálculo de extensões em km e massas em toneladas para condutores e cabos de guarda (aço e OPGW com fibras ópticas), aplicando acréscimos regulamentares de flecha (sag), descidas de torre até caixa de emenda (para OPGW), perdas de lançamento e bobinas.
- **Motor de Ferragens, Tirantes e Isoladores (RF-23):** Dimensionamento de tirantes e cabos de aço para estruturas estaiadas, cadeias de isoladores (suspensão simples/dupla, ancoragem), sistemas de amortecimento por vão médio/tensão, balizadores/esferas de sinalização aeroespacial e malha de aterramento (hastes e contrapesos).
- **Motor de Serviços Civis Preliminares e Acessos (RF-25):** Estimativa paramétrica de acessos por grau de dificuldade (abertura de picadas, estradas de serviço), limpeza de faixa de servidão por tipo de vegetação e quantificação de travessias de rodovias, ferrovias e linhas existentes.
- **Consolidação de Materiais por Linha e Global (RF-26):** Matriz discriminada de quantitativos segregando volume/peso teórico, margem extra de obra e peças sobressalentes (*spares*), alimentando o motor de preços M06 (`Cantidades -> Precios`).
- **Rastreabilidade Integral Item a Item (RF-27, RNF-06, RNF-08):** Memória de cálculo detalhada demonstrando a origem de cada tonelada ou unidade a partir da lista de torres estaqueadas.

## Capabilities

### New Capabilities
- `quantitativos-eletromecanicos`: Cálculo e consolidação dos quantitativos de engenharia eletromecânica para torres, condutores, cabos de guarda, tirantes, isoladores, aterramento, sinalização, acessos e travessias com rastreabilidade completa e separação entre teórico, extra e sobressalentes (RF-23, RF-25, RF-26, RF-27, RN-10, RN-11).

### Modified Capabilities
<!-- Nenhuma especificação existente teve seus requisitos funcionais alterados. -->

## Impact

- **`libs/domain`:** Novos contratos, tipos e enums para quantitativos eletromecânicos (`TowerQuantityItem`, `ConductorQuantityItem`, `GroundWireQuantityItem`, `HardwareQuantityItem`, `AccessQuantityItem`, `MaterialQuantitySummary`).
- **`libs/calc-engine`:** Implementação pura de `TowerCalculator`, `ConductorCalculator`, `HardwareCalculator`, `AccessCalculator` e `ElectromechanicalSummaryCalculator` com aritmética `DecimalValue`.
- **`apps/api`:** Novo serviço e controller `ElectromechanicalService` / `ElectromechanicalController` integrados ao módulo de estaqueamento e propostas.
- **`apps/web`:** Nova aba "Quantitativos Eletromecânicos (M05)" no detalhe da oferta (`OfferDetailComponent`) com cards de KPIs, tabelas analíticas por família (torres, cabos, isoladores, acessos), filtros e modal de memorial de cálculo.
