## Why

Na planilha legada `Calculo LT`, a consolidação final da proposta comercial — que define a viabilidade do lote no leilão EPC — está dispersa em mais de 40 abas replicadas (`S1..S10`, `R1..R10`, `RT`, `R`, `K`, `BDI`, `Sim`, `D1..D10`, `DT`, `Cashflow`). Essa fragmentação contém fórmulas voláteis (`INDIRECT`, `OFFSET`), ausência de rastreabilidade de BDI/margem e cálculos manuais propensos a erros nas folhas de medição e no fluxo de caixa.

Esta proposta implementa a **Fase F5** do roadmap (§13), cobrindo os módulos:
- **M09 — Serviços e Orçamento Contratual** (RF-46 a RF-50)
- **M10 — Resultado Econômico e Formação de Preço** (RF-51 a RF-56, RN-18 a RN-22)
- **M11 — Desembolso e Fluxo de Caixa** (RF-57 a RF-60, RN-23 a RN-26)

Com essa entrega, o sistema fecha a precificação completa da proposta EPC: consolidação de custos de serviços, aplicação paramétrica de coeficientes de venda e margem (BDI), simulações de preço/margem, curvas de desembolso mensal e identificação do pico de exposição financeira (capital de giro).

## What Changes

- **Consolidação de Serviços (M09 / RF-46 a RF-50):**
  - Orçamento analítico de serviços por linha com 3 origens de custo: execução própria calculada do cronograma, execução própria ajustada por fatores de dificuldade/acesso e subcontratação cotada no mercado.
  - Associação de itens ao código CIP padronizado do contratante (ex.: `GR02.04.05`).
  - Geração automática de Folha de Medição Contratual (`M1..M10`) e Folha de Preços Unitários (`PU1..PU10`).
  - Cálculo de ratios de custo por km (R$/km) e por estrutura (R$/torre) para benchmarking paramétrico.
  - Suporte a múltiplos layouts de edital (ex.: AXIA Sudeste/Norte/Sul, Celeo, Elecnor).
- **Resultado Econômico e Formação de Preço (M10 / RF-51 a RF-56, RN-18 a RN-22):**
  - Quadro consolidado de resultado por linha e lote (Quadro R), segregando custo líquido, PIS/COFINS, IPI, ICMS origem, DIFAL, FECOEP, custo com impostos, faturamento direto, custo próprio e preço de venda.
  - Parametrização dos coeficientes de venda $K$ por linha: garantias, seguros, imposto sobre produção, IDDE, risco país/cliente, financeiros, contingências, estrutura e margem alvo.
  - Simulador interativo bidirecional de preço e margem (definir margem e calcular preço, ou definir preço e obter margem efetiva).
  - Projeção de corrosão do resultado pelo IPCA acumulado ao longo da vigência da obra.
  - Avaliação de impacto financeiro por contingências construtivas (mudança de tipo de torre, fundação ou solo).
  - Comparativo analítico entre revisões da oferta identificando a causa-raiz das variações (quantidade, preço unitário, tributo ou coeficiente).
- **Desembolso e Fluxo de Caixa (M11 / RF-57 a RF-60, RN-23 a RN-26):**
  - Distribuição mensal de custos e faturamento por item, com curva física para serviços e curva de entrega (% mensal) para materiais.
  - Cronograma de entregas de materiais com realimentação da ponderação da curva de futuros de commodities.
  - Fluxo de caixa consolidado (`D1..D10`, `DT`), cálculo do saldo acumulado mês a mês e determinação do pico máximo de exposição financeira.
  - Exportação do cronograma de faturamento/desembolso nos formatos dos clientes.

## Capabilities

### New Capabilities
- `servicos`: Orçamento analítico de serviços por linha com 3 origens de custo, códigos CIP e geração de folhas contratuais (M09, RF-46..RF-50).
- `resultado-economico`: Quadro de resultado econômico, coeficientes de venda K, BDI, simulação de preço/margem, IPCA e comparativo de revisões (M10, RF-51..RF-56, RN-18..RN-22).
- `desembolso`: Cronograma de desembolso mensal, fluxo de caixa, entregas de suprimentos e curva de exposição financeira acumulada (M11, RF-57..RF-60, RN-23..RN-26).

### Modified Capabilities
*(Nenhuma capability existente tem seus requisitos alterados nesta fase)*

## Impact

- **`libs/domain`**: Novos contratos e tipos para serviços orçados, códigos CIP, coeficientes de venda K, BDI, quadro R, curvas de desembolso D/DT e fluxo de caixa.
- **`libs/calc-engine`**: Novos módulos de cálculo (`ServiceBudgetCalculator`, `EconomicResultCalculator`, `CashflowCalculator`) com aritmética decimal exata (`DecimalValue`).
- **`apps/api`**: Novos controllers e services NestJS para serviços, resultado econômico e fluxo de caixa.
- **`apps/web`**: Novas abas e componentes Angular no `OfferDetailComponent` para Serviços (M09), Resultado & BDI (M10) e Desembolso & Fluxo de Caixa (M11).
