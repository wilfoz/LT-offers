## Context

Veja `proposal.md` para motivação e justificativa de negócio.
O monorepo Nx divide responsabilidades de forma estrita (§12 do levantamento):
- `libs/domain`: Contratos TypeScript puros e interfaces de dados trafegados entre camadas.
- `libs/calc-engine`: Biblioteca pura sem dependência de framework ou banco, determinística (RNF-04) e com aritmética decimal exata (`DecimalValue`, RNF-08).
- `apps/api`: NestJS + Prisma ORM para persistência no PostgreSQL e endpoints RESTful.
- `apps/web`: Frontend Angular com design system Alexandria / SOLARIS Engineering, consumindo endpoints da API.

Atualmente, o catálogo `FoundationVolume` (`DB_FUN`, RN-13) já possui tipos e persistência no banco, e o módulo de Estaqueamento (`M04`) já armazena torres com atributos geotécnicos e suporta distribuição paramétrica preliminar (`PreliminaryDistribution`). Falta a engine de cálculo de quantitativos civis (M05 / F2) conectando essas camadas com os fatores regulamentares da RN-12.

## Goals / Non-Goals

**Goals:**
- Implementar a função pura de cálculo `calculateFoundationQuantities` em `libs/calc-engine`, cobrindo tanto estaqueamento completo torre a torre quanto estimativa preliminar paramétrica.
- Aplicar de forma configurável e testável os fatores da RN-12 (sobre-escavação por solo duro 10%, normal 5%, água 20%, tubulão 5%; perdas de concreto 5%; perdas de aço 10%/3%; balanço de reaterro compactado).
- Fornecer DTOs e contratos de rastreabilidade (RF-26, RF-27) em `libs/domain`.
- Expor endpoints na API (`apps/api`) para consultar os quantitativos calculados da linha com validação geotécnica e rastreabilidade item a item.
- Criar a interface de visualização analítica em `apps/web` com tabelas sumarizadas por famílias de materiais e modal/drawer de memória de cálculo detalhada.

**Non-Goals:**
- Precificação em moeda e tributação dos materiais de fundação (escopo de M06 / Fase F3).
- Alocação de equipes de escavação e concretagem no cronograma físico (escopo de M07 / Fase F4).
- Alteração no schema do Prisma para criar novas tabelas pesadas de resultados (o cálculo é executado sob demanda no motor determinístico e cacheado em memória ou retornado como DTO na API).

## Decisions

### 1. Motor de Cálculo em `libs/calc-engine` como Função Pura e Determinística
- **Decisão:** O cálculo de fundações será uma função pura `calculateLineFoundations(input: FoundationCalculationInput): FoundationCalculationResult` que recebe a lista de estruturas e as matrizes vigentes do catálogo.
- **Alternativas consideradas:**
  - *Cálculo persistido no banco via trigger/stored procedure:* Rejeitado por violar a portabilidade das regras (RNF-15) e impedir execução offline/em testes unitários puros (RNF-16).
  - *Cálculo acoplado ao serviço NestJS:* Rejeitado pela separação arquitetural da regra de negócio (RNF-16).
- **Justificativa:** Garante determinismo (RNF-04), permite testes unitários com fixtures históricas (§14) e integração simples ao grafo de dependências do motor.

### 2. Aritmética com `DecimalValue`
- **Decisão:** Todos os acréscimos percentuais (RN-12) e somatórios serão computados com a classe `DecimalValue` (ou `Decimal` do decimal.js), com arredondamento explícito (3 casas decimais para volumes $m^3$ e distâncias $m$, 2 casas decimais para massas $kg$).
- **Alternativas consideradas:**
  - *JavaScript `number` (IEEE 754 float):* Rejeitado categoricamente (RNF-08) devido a erros de representação cumulativos em somas de milhares de torres.
- **Justificativa:** Conformidade com RNF-08 e garantia de paridade exata com as planilhas de referência.

### 3. Estrutura de Agrupamento em Famílias de Materiais
- **Decisão:** Os quantitativos consolidados serão sumarizados em 5 famílias principais:
  1. **Escavação:** `ExcavationNormal`, `ExcavationHard`, `ExcavationWater`, `ExcavationPier`, `ExcavationPrecast`, `ExcavationPileCap` ($m^3$).
  2. **Concreto:** `ConcreteFootings`, `ConcretePiers`, `ConcretePileCaps`, `ConcretePrecast`, `ConcreteRock`, `Regeneration`, `Grout` ($m^3$).
  3. **Aço e Chumbadores:** `SteelFootings`, `SteelPiers`, `SteelPileCaps`, `SteelPrecast`, `SteelRock`, `SteelAnchorBolts`, `AnchorBoltDrilling` ($kg$ / $m$).
  4. **Reaterro e Formas:** `BackfillSoil`, `BackfillSoilCement`, `Formwork` ($m^3$ / $m^2$).
  5. **Estacas e Fundações Especiais:** `HelicalPile`, `SteelPile`, `Tricone`, `RootPile`, `ContinuousAugerPile`, `Micropile`, `ConcretePile` ($m$).
- **Justificativa:** Facilita o consumo direto pelo módulo de orçamentação e serviços (M09/BOQ) e proporciona clareza visual ao engenheiro orçamentista.

### 4. Rastreabilidade Torre a Torre (RF-27)
- **Decisão:** O resultado do cálculo inclui uma árvore de rastreabilidade (`traceability`) mapeando cada volume até a torre de origem, o tipo de solo, a fundação e a regra aplicada (teórico vs sobre-escavação).
- **Justificativa:** Atende diretamente o requisito RF-27 e o princípio de transparência de cálculo (RNF-06).

## Risks / Trade-offs

- **[Risco] Grande volume de torres em linhas longas (>3.000 torres)** → *Mitigação:* A função de cálculo em TypeScript puro processa 5.000 estruturas em menos de 50ms, bem abaixo do limite de 2s estipulado pelo RNF-01.
- **[Risco] Combinações Torre × Solo × Fundação ausentes no catálogo** → *Mitigação:* O motor identifica combinações pendentes e as isola em uma lista `missingCombinations`, gerando alerta no painel sem atribuir valores zero silenciosos (RNF-09).
- **[Risco] Divergências de arredondamento com fórmulas complexas do Excel legado** → *Mitigação:* Validação rigorosa com testes de paridade numérica baseados em fixtures históricas reais (§14).
