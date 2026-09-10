## Context

Veja [proposal.md](proposal.md) para a motivação e escopo da Fase F5.

O sistema já possui implementados os motores de quantitativos físicos (M05), preços de materiais e tributos (M06), cronograma físico (M07) e histogramas de recursos (M08). A Fase F5 consolida esses insumos para produzir o fechamento comercial da proposta: o orçamento de serviços (M09), a decomposição tributária e formação de preço de venda com BDI (M10), e o fluxo de caixa temporal com determinação da exposição máxima de capital de giro (M11).

## Goals / Non-Goals

**Goals:**
- Implementar contratos de domínio em `libs/domain` para orçamentos de serviços com código CIP, folhas de medição/PU, quadro de resultado econômico (Quadro R), coeficientes de venda $K$, fórmulas de BDI, curvas de desembolso temporal (Quadro D) e fluxo de caixa.
- Desenvolver motores de cálculo puros e determinísticos em `libs/calc-engine` com aritmética decimal exata (`DecimalValue`), suportando solver bidirecional (margem alvo $\leftrightarrow$ preço de venda) e projeção de IPCA acumulado.
- Disponibilizar endpoints REST em `apps/api` estruturados nos módulos `ServiceBudgetModule`, `EconomicResultModule` e `CashflowModule`.
- Criar interface interativa no Angular (`apps/web`) integrada ao `OfferDetailComponent`, com tabela analítica de serviços por código CIP, simulador comercial de BDI/margem em tempo real, visão comparativa de revisões e gráfico de curvas S de fluxo de caixa acumulado.

**Non-Goals:**
- Integração bidirecional com ERP corporativo (SAP/Totvs) — reservada para a Fase F7.
- Matriz de riscos e governança avançada de perfis de usuário (M12) — reservada para a Fase F6.
- Importação direta de planilhas de edital em formato proprietário fechado não padronizado.

## Decisions

### 1. Separação de Motores em 3 Calculadoras Especializadas (`libs/calc-engine`)
- `ServiceBudgetCalculator`: Agrega custos de serviços pelas 3 origens (cronograma M07, paramétrico ajustado e subcontratado cotado), associa itens aos códigos CIP e calcula ratios paramétricos (R$/km e R$/torre).
- `EconomicResultCalculator`: Constrói o Quadro R consolidando materiais (M06) e serviços (M09), calcula tributos acumulados, faturamento direto, aplica coeficientes de venda $K$ e BDI, e executa a simulação bidirecional de preço $\leftrightarrow$ margem.
- `CashflowCalculator`: Mapeia saídas de caixa (materiais por curva de entrega e serviços por medição física) contra entradas (faturamento por medição e adiantamentos contratuais), gerando a curva de saldo acumulado e identificando o mês de máxima exposição financeira negativa.

### 2. Solver Analítico Bidirecional para Margem e Preço (RF-53)
Para permitir que o usuário defina uma margem líquida e obtenha o preço de venda exato, ou fixe um preço teto e descubra a margem resultante:
- O cálculo direto aplica a fórmula analítica padrão de BDI:
  $$\text{Preço de Venda} = \frac{\text{Custo Próprio} \times (1 + K_{\text{indiretos}})}{1 - (Tributos_{\text{faturamento}} + Margem)}$$
- Para cenários com impostos não lineares ou faturamento direto, utiliza-se busca por convergência analítica rápida com precisão decimal exata.

### 3. Modelo Temporal de Desembolso em Matriz Mês a Mês (RF-57, RF-59)
- Cada item do orçamento possui uma curva de distribuição temporal associada:
  - Itens de serviço: herdam a distribuição mensal da atividade correspondente no cronograma M07.
  - Itens de material: associados a curvas percentuais de entrega e fabricação configuráveis (ex.: $0\%, 20\%, 40\%, 40\%$).
- O fluxo de caixa consolida as linhas de saída contra a política de faturamento do cliente (faturamento em $M+1$ ou com retenção técnica contratual).

### 4. Estrutura de Rotas e Componentes Web no Angular (`apps/web`)
Adição de 3 novas abas no `OfferDetailComponent`:
1. **"Orçamento de Serviços (M09)"**: Tabela analítica com agrupamento hierárquico, código CIP, origem de custo e ratios R$/km e R$/torre.
2. **"Resultado Econômico & BDI (M10)"**: Quadro R com visão detalhada de impostos, sliders/inputs de coeficientes $K$, simulador de margem e comparador de revisões.
3. **"Desembolso & Fluxo de Caixa (M11)"**: Gráfico de curvas S de desembolso vs faturamento, painel de exposição máxima de caixa e visualização temporal.

## Risks / Trade-offs

- **[Risco] Divergência em fórmulas de BDI entre editais de diferentes concessionárias**  
  *Mitigação:* Parametrização flexível que permite estruturar o BDI como multiplicador aditivo ou composto sobre o custo direto, garantindo compatibilidade com editais AXIA, Celeo e Elecnor.
- **[Risco] Descasamento temporal entre entrega de materiais e faturamento da medição**  
  *Mitigação:* O `CashflowCalculator` modela separadamente as datas de desembolso de fornecedores e as datas de liquidação das faturas de medição, destacando o impacto no capital de giro.
