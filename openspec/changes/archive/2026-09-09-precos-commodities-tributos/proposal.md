## Why

Na planilha original `Calculo LT`, a formação de preços e a apuração tributária de materiais (abas `Precios`, `Futuros`, `LMEUSD`, `Impuestos`, `Materiales` e `Datos`) concentram mais de 100 mil fórmulas com alto grau de volatilidade, dependência temporal (`TODAY()`) e milhares de células em `#N/A`. A precificação precisa lidar com dinâmicas complexas: cotações em múltiplas moedas (BRL, USD, EUR), volatilidade de commodities metálicas (Alumínio LME + prêmio Midwest/RTDU) ponderadas por curvas de entrega no tempo, e o intrincado sistema tributário brasileiro (ICMS interestadual com rateio por até 2 UFs de destino, DIFAL com base dupla, FECOEP por UF, IPI por NCM, PIS/COFINS com regimes REIDI e Faturamento Direto).

Esta change implementa a **Fase F3 (Módulo M06 — Preços, Commodities e Tributos)** do roadmap de modernização (§13 de `requisitos-calculo-lt.md`), fornecendo um motor de cálculo puro, determinístico e de alta precisão decimal (`libs/calc-engine`), contratos de domínio e tipos fiscais (`libs/domain`), persistência e endpoints analíticos (`apps/api`), e interface gráfica completa para gestão de cotações, parâmetros de commodities e demonstrativo da memória tributária item a item (`apps/web`).

## What Changes

- **Contratos de Domínio e Modelos Fiscais (`libs/domain`):**
  - Definição de entidades e enums fiscais: regimes tributários (Padrão, REIDI, Faturamento Direto / *Direct Billing*), matriz de alíquotas ICMS (origem × destino), alíquotas FECOEP por estado, alíquotas IPI por NCM, e regras de PIS/COFINS (3,65% cumulativo ou 9,25% não-cumulativo / suspensão REIDI).
  - Modelos de precificação de commodities (Alumínio LME, Cobre, prêmio Midwest/RTDU, prêmio de manufatura) e taxas de câmbio (spot e futuros mensais).
  - Tipos e DTOs para cotações por fornecedor, seleção de cotação vencedora, memorial de cálculo tributário e consolidação financeira de materiais.

- **Motor de Cálculo Puro e Determinístico (`libs/calc-engine`):**
  - Motor fiscal brasileiro com cálculo de base de cálculo líquida, IPI (*por fora*), ICMS de origem e destino, diferencial de alíquota (DIFAL) com metodologia de base dupla quando exigida pela UF de destino, FECOEP e PIS/COFINS (**RF-32**, **RN-05**, **RN-06**).
  - Suporte a regime REIDI e Faturamento Direto com desoneração/suspensão de PIS/COFINS e impacto no ICMS/IPI conforme a matriz de responsabilidade (**RF-32**, **RN-04**).
  - Formação dinâmica de preços de cabos condutores e de guarda de alumínio via fórmula $(\text{LME} + \text{Midwest/RTDU}) \times \text{Câmbio} + \text{Prêmio}$, suportando chaveamento entre spot e curva de futuros ponderada por entregas mensais (**RF-30**, **RF-31**, **RN-07**, **RN-08**, **RN-09**).
  - Validação estrita de pendências: sinalização impeditiva de itens com quantitativo físico sem cotação/preço unitário atribuído (**RF-29**, **RNF-09**).
  - Memória de cálculo detalhada item a item e tributo a tributo com precisão decimal exata (`DecimalValue`) (**RF-34**, **RNF-08**).

- **Backend API & Serviços NestJS (`apps/api`):**
  - Endpoints REST em `/api/lines/:lineId/materials/pricing`, `/tax-summary`, `/traceability` e `/commodities`.
  - Serviço de aplicação orquestrando os quantitativos de engenharia de M05 com o motor de preços e tributos de M06.
  - Tabela de parâmetros fiscais e vigência de alíquotas versionadas (**RF-33**, **RNF-15**).

- **Frontend Angular (`apps/web`):**
  - Painel analítico de Preços, Tributos e Commodities no detalhe da oferta/linha.
  - Tabela interativa de materiais com quantitativos consolidados, cotações, formação de preço de commodities, colunas detalhadas de impostos (ICMS Origem, DIFAL, FECOEP, IPI, PIS/COFINS) e custo final com tributos (**RF-34**, **RF-51**).
  - Simulador de cenários fiscais (Alternar REIDI Sim/Não, Faturamento Direto Sim/Não, Variação de LME e Câmbio).
  - Alertas de pendências de cotação (itens sem preço).

## Capabilities

### New Capabilities
- `precos-tributos`: Cobertura completa de regras e cenários para formação de preços de materiais, parametrização de commodities (LME/Midwest/Câmbio), apuração tributária brasileira (ICMS, DIFAL base dupla, FECOEP, IPI, PIS/COFINS, REIDI, Faturamento Direto) e rastreabilidade item a item.

### Modified Capabilities
<!-- Nenhuma capability existente tem seus requisitos alterados. As specs existentes mantêm seus contratos. -->

## Impact

- **Código:**
  - `libs/domain`: novos tipos em `libs/domain/src/lib/pricing/` e `libs/domain/src/lib/tax/`.
  - `libs/calc-engine`: novos calculadores `TaxCalculator`, `CommodityCalculator`, `MaterialPricingCalculator` e suíte de testes unitários com fixtures de cenários reais.
  - `apps/api`: novos módulos `pricing` e `taxation` integrados com o módulo `foundations` e `offers`.
  - `apps/web`: novos componentes de visualização, formulários de cotação e simulador fiscal.
- **APIs:** Novos endpoints REST sob `/api/lines/:lineId/pricing/...` e `/api/tax-tables/...`.
- **Dependências:** Nenhuma nova dependência externa necessária; reutilização de `@lt-offers/domain`, `@lt-offers/calc-engine` e infraestrutura NestJS/Angular existente.
- **Sistemas:** Compatível com os quantitativos de engenharia consolidados da Fase F2.
