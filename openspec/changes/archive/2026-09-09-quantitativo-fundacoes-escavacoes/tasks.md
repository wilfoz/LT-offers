## 1. Domain & Contracts (`libs/domain`)

- [x] 1.1 Criar definições e tipos de quantitativos de fundação em `libs/domain/src/lib/foundations/foundation-quantities.ts` (quantidades teóricas, sobre-escavação, desperdícios, balanço de reaterro e rastreabilidade).
- [x] 1.2 Exportar os novos contratos no `libs/domain/src/index.ts` e adicionar testes de validação de schemas/tipos em `foundation-quantities.spec.ts`.

## 2. Calculation Engine (`libs/calc-engine`)

- [x] 2.1 Implementar funções de resolução paramétrica de matrizes de fundação `resolveFoundationMatrix` e aplicação dos fatores da RN-12 (`applyOverExcavation`, `applyConcreteWaste`, `applySteelWaste`, `calculateBackfillBalance`).
- [x] 2.2 Implementar motor de cálculo principal `calculateLineFoundations` em `libs/calc-engine/src/lib/foundations/foundation-calculator.ts` suportando estaqueamento real (torre a torre) e distribuição percentual preliminar (RF-21, RF-24).
- [x] 2.3 Escrever bateria de testes unitários em `foundation-calculator.spec.ts` cobrindo determinismo (RNF-04), precisão decimal (RNF-08), tratamento de dados faltantes (RNF-09, RF-20) e paridade numérica com casos limite da planilha legada.
- [x] 2.4 Integrar o nó de fundações ao grafo de dependências do motor em `dependency-graph.ts` e exportar no index do pacote.

## 3. API Endpoints & Services (`apps/api`)

- [x] 3.1 Implementar `FoundationsService` em `apps/api/src/app/offers/foundations.service.ts` para carregar dados de estaqueamento da linha e matrizes de volumes vigentes e executar o motor de cálculo.
- [x] 3.2 Implementar endpoints REST no controller de ofertas/linhas:
  - `GET /api/offers/:offerId/lines/:lineId/foundations/quantities` (quantitativos consolidados e memória de cálculo).
  - `GET /api/offers/:offerId/lines/:lineId/foundations/traceability` (rastreabilidade por torre/material).
  - `GET /api/offers/:offerId/lines/:lineId/foundations/validation` (diagnóstico de combinações ausentes e pendências).
- [x] 3.3 Escrever testes unitários e de integração em `foundations.service.spec.ts` e `foundations.controller.spec.ts`.

## 4. Web UI & Visualization (`apps/web`)

- [x] 4.1 Criar `FoundationsService` no frontend Angular para consumir os endpoints de quantitativos de fundações.
- [x] 4.2 Desenvolver componente `FoundationQuantitiesComponent` com design system Alexandria / SOLARIS Engineering, exibindo:
  - Cards com KPIs consolidados (Volume Total de Escavação, Concreto Estrutural, Aço Total, Reaterro Compactado).
  - Tabela analítica agrupada por família de materiais com separação entre Quantidade Teórica, Fator de Perda/Sobre-escavação e Total Final.
  - Alertas de combinações geotécnicas pendentes/inválidas com link direto para correção.
- [x] 4.3 Desenvolver drawer/modal de memória de cálculo detalhada e rastreabilidade torre a torre (RF-27).
- [x] 4.4 Integrar a navegação e rotas na página de detalhes da oferta e da linha de transmissão (`offer-detail`).

## 5. Verification & QA

- [x] 5.1 Executar suíte completa de testes automatizados (`npx nx run-many -t test`).
- [x] 5.2 Executar linters e checagem de tipos (`npx nx run-many -t lint`).
- [x] 5.3 Executar build de produção de todas as aplicações e bibliotecas (`npx nx run-many -t build`).
