## Context

A orçamentação de Linhas de Transmissão exige precisão rigorosa na precificação de materiais, combinando dinâmicas de commodities metálicas (LME de alumínio e cobre, prêmio Midwest/RTDU e volatilidade cambial) com a complexidade tributária brasileira (ICMS interestadual com rateio por até duas UFs de destino, DIFAL com base simples ou dupla, adicionais FECOEP, IPI por NCM e regimes fiscais REIDI / Faturamento Direto).

Na planilha original `Calculo LT`, essas regras encontram-se fragmentadas em abas como `Precios`, `Futuros`, `LMEUSD`, `Impuestos`, `Materiales` e `Datos`, sofrendo com recálculos lentos, referências voláteis (`TODAY()`) e erros de propagação (`#N/A`). Esta fase implementa a **Fase F3 (M06)** separando os contratos de domínio, o motor puro de cálculo determinístico (`libs/calc-engine`), a camada de orquestração/persistência (`apps/api`) e a interface analítica com memória de cálculo (`apps/web`).

## Goals / Non-Goals

**Goals:**
- Implementar modelo de dados tipado em `libs/domain` para cotações em múltiplas moedas (BRL, USD, EUR), parâmetros de commodities (LME, Midwest, prêmios) e matrizes de regras tributárias (ICMS, DIFAL, FECOEP, IPI, PIS/COFINS, REIDI).
- Implementar motor fiscal e de precificação determinístico em `libs/calc-engine` com suporte a:
  - Formação de preço de alumínio (Spot e Curva de Futuros ponderada por entregas mensais) conforme **RN-07**, **RN-08** e **RN-09** (**RF-30**, **RF-31**).
  - Apuração de ICMS interestadual com rateio por até 2 UFs de destino (**RN-01**, **RN-05**).
  - Cálculo de DIFAL por base simples e por **base dupla** (reconstituição de base por dentro) conforme exigência da UF de destino (**RN-05**, **RF-32**).
  - Cálculo de adicional FECOEP por UF e IPI por NCM (**RN-06**, **RF-32**).
  - Tratamento de PIS/COFINS com desoneração sob regime REIDI e segregação de Faturamento Direto (*Direct Billing*) (**RN-04**, **RF-32**).
  - Sinalização impeditiva de itens com quantitativos sem preço (**RF-29**).
  - Memória de cálculo detalhada com precisão decimal estrita (`DecimalValue`) (**RF-34**, **RNF-08**).
- Endpoints NestJS em `apps/api` fornecendo a consolidação de preços e tributos por linha e oferta.
- Componentes Angular em `apps/web` no Swiss Design System para visualização analítica, gestão de cotações, simulador de cenários fiscais e modal de memória de cálculo.

**Non-Goals:**
- Cronograma físico detalhado de atividades e histogramas de equipes/equipamentos (escopo da Fase F4 — M07 / M08).
- Formação de preço final de venda com BDI, coeficientes de margem K e fluxo de caixa contratual (escopo da Fase F5 — M09 / M10 / M11).
- Integração direta via API em tempo real com a bolsa de Londres (LME) ou Banco Central (o sistema recebe as cotações e curvas versionadas na oferta ou via catálogo).

## Decisions

### 1. Separação Funcional do Motor de Cálculo em Módulos Especializados
- **Decisão:** Dividir o motor em `libs/calc-engine` em três calculadores puros e combináveis:
  1. `CommodityCalculator`: responsável pela formação de preço de alumínio/cobre, conversão de moedas e ponderação pela curva de entrega no tempo.
  2. `TaxCalculator`: responsável exclusivamente pela apuração tributária de cada item (base de cálculo, ICMS, DIFAL base simples/dupla, FECOEP, IPI, PIS/COFINS e REIDI).
  3. `MaterialPricingCalculator`: orquestra a combinação dos quantitativos consolidados de engenharia (Fase F2 / M05) com as cotações vencedoras e o cálculo tributário, gerando o resumo consolidado por linha e oferta.
- **Alternativas consideradas:** Um único calculador monolítico gigante. A divisão modular facilita a testabilidade unitária de cada regra fiscal isolada e previne regressões.

### 2. Metodologia de Cálculo de DIFAL (Base Simples vs. Base Dupla)
- **Decisão:** Parametrizar a fórmula de DIFAL por UF de destino:
  - *Base Simples:* $\text{DIFAL} = \text{Base} \times (\text{Alíquota Interna} - \text{Alíquota Interestadual})$.
  - *Base Dupla:*
    $$\text{Base Destino} = \frac{\text{Valor Líquido} - \text{ICMS Origem}}{1 - (\text{Alíquota Interna Destino} + \text{Alíquota FECOEP})}$$
    $$\text{DIFAL} = (\text{Base Destino} \times \text{Alíquota Interna Destino}) - \text{ICMS Origem}$$
    $$\text{FECOEP} = \text{Base Destino} \times \text{Alíquota FECOEP}$$
- **Alternativas consideradas:** Aplicar apenas base simples. Isso geraria distorções severas de custos para obras em estados como MG, BA e RS, que exigem a base dupla legalmente.

### 3. Ponderação Temporal da Curva de Commodities (RN-09)
- **Decisão:** O cálculo do preço de futuros de commodities utiliza o produto escalar $\sum (\text{Ton}_m \times \text{Preço}_m) / \sum \text{Ton}_m$ baseado no perfil de entrega mensal de cabos. Quando o cronograma de suprimentos detalhado ainda não estiver definido, o sistema adota distribuição padrão ou permite entrada do preço médio estimado.
- **Alternativas consideradas:** Média simples dos meses do projeto. Rejeitado pois a entrega de condutores concentra-se em janelas específicas da obra.

### 4. Aritmética de Alta Precisão (`DecimalValue`)
- **Decisão:** Todos os preços unitários, alíquotas percentuais, bases de cálculo e montantes tributários são processados utilizando instâncias de `DecimalValue`, formatando monetários finais com 2 casas decimais e alíquotas com 4 casas decimais via política *half-up*.
- **Alternativas consideradas:** Uso de tipos primitivos `number` do JS. Rejeitado para evitar erros de ponto flutuante cumulativos em compras de grande porte (milhões de reais).

## Risks / Trade-offs

- **[Risco] Divergências na legislação tributária estadual entre revisões:**
  - *Mitigação:* Armazenar matrizes de alíquotas e regras de DIFAL em catálogo versionado por vigência legal (**RF-33**, **RNF-15**), desacoplando o código de alíquotas fixas.
- **[Risco] Complexidade de rateio interestadual quando a LT cruza fronteiras:**
  - *Mitigação:* Modelar as UFs de destino como lista ponderada (ex.: UF1 com 70% e UF2 com 30%) e executar a apuração tributária ponderada proporcionalmente para cada trecho (**RN-01**, **RN-05**).
- **[Risco] Falta de cotação para itens novos de engenharia:**
  - *Mitigação:* Painel de consistência sinaliza explicitamente materiais com quantidade física positiva e preço zerado/ausente, impedindo o avanço sem resolução (**RF-29**, **RNF-09**).

## Migration Plan

1. Definir tipos e enums fiscais em `libs/domain/src/lib/pricing/` e `libs/domain/src/lib/tax/`.
2. Implementar e testar unitariamente `TaxCalculator`, `CommodityCalculator` e `MaterialPricingCalculator` em `libs/calc-engine`.
3. Criar fixtures fiscais e tabelas de alíquotas padrão (27 UFs e TIPI).
4. Implementar endpoints e serviços de precificação em `apps/api`.
5. Criar componentes de visualização de preços, tributos e simulador em `apps/web`.
6. Validar paridade numérica contra cenários de teste da planilha original.
