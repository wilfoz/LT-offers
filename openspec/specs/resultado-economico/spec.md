## Purpose

Define os requisitos e regras de cálculo para a formação de preço de venda e quadro de resultado econômico de Linhas de Transmissão (Módulo M10), abrangendo decomposição tributária, coeficientes de venda K (BDI), simulação de margem/preço, IPCA acumulado e comparativo de revisões.

## Requirements

### Requirement: Quadro Consolidado de Resultado Econômico por Linha e Lote (RF-51)
O sistema SHALL apresentar o quadro analítico de resultado econômico por linha (`R1..R10`) e consolidado para o lote (`RT`/`R`), segregando rigorosamente as colunas: Custo Líquido, PIS/COFINS, IPI, ICMS Origem, DIFAL, FECOEP, Custo com Impostos, Faturamento Direto do Cliente, Custo Próprio da Construtora, Sobressalentes e Preço Final de Venda.

#### Scenario: Visualização do fechamento econômico da linha
- **WHEN** os custos de materiais (M06) e de serviços (M09) estão calculados para uma linha de transmissão
- **THEN** o sistema consolida o Quadro R exibindo cada componente tributário, a parcela de faturamento direto e o total de venda gerado

---

### Requirement: Parametrização dos Coeficientes de Venda K e BDI (RF-52)
O sistema SHALL permitir a parametrização dos coeficientes de venda $K$ por linha e grupo de custo: taxa de garantias e cauções contratuais, taxa de seguros (riscos de engenharia e responsabilidade civil), imposto sobre produção, taxa de IDDE, risco país/cliente, custo financeiro de capital, contingências de obra (alimentadas diretamente pelo cálculo ponderado da Matriz de Riscos ou definidas manualmente), taxa de administração central/estrutura e margem de lucro líquido alvo.

#### Scenario: Composição da taxa de BDI da proposta
- **WHEN** o orçamentista define as taxas de estrutura (4,5%), riscos/garantias (2,0%), financeiro (1,8%) e margem líquida (8,0%)
- **THEN** o sistema calcula o multiplicador de BDI e os coeficientes de venda aplicáveis a cada grupo de fornecimento e serviço

#### Scenario: Composição da taxa de BDI da proposta com contingências de risco
- **WHEN** o orçamentista define as taxas de estrutura (4,5%), seguros/garantias (2,0%), financeiro (1,8%), margem líquida (8,0%) e importa a contingência ponderada da Matriz de Riscos (RF-61)
- **THEN** o sistema calcula o multiplicador de BDI e os coeficientes de venda incorporando a parcela calculada de risco a cada grupo de fornecimento e serviço

---

### Requirement: Simulador Interativo Bidirecional de Preço de Venda e Margem Alvo (RF-53)
O sistema SHALL disponibilizar simulador de sensibilidade comercial bidirecional, permitindo ao usuário: (1) ajustar a margem percentual alvo e calcular instantaneamente o preço de venda resultante por linha e lote, ou (2) fixar um preço teto de venda da proposta e calcular a margem de lucro líquida resultante (*Atingir Meta* / Solver).

#### Scenario: Simulação de desconto comercial para fechamento
- **WHEN** a diretoria comercial impõe um desconto de 5% sobre o preço de venda da oferta de R$ 250.000.000
- **THEN** o sistema recalcula a margem líquida resultante de cada linha, alertando caso a margem caia abaixo do piso mínimo de segurança da empresa

---

### Requirement: Projeção de Corrosão do Resultado por IPCA Acumulado (RF-54)
O sistema SHALL projetar a inflação acumulada ao longo do cronograma da obra com base na curva projetada de IPCA mensal, calculando o impacto financeiro da defasagem de reajuste contratual sobre os custos e sobre o resultado final da proposta.

#### Scenario: Avaliação de perda inflacionária em contrato de 24 meses
- **WHEN** o cronograma do projeto se estende por 24 meses com previsão de IPCA de 4,5% ao ano e reajuste contratual anual
- **THEN** o sistema calcula o custo corrigido projetado e demonstra a perda real de margem provocada pelo descasamento do reajuste

---

### Requirement: Avaliação de Impacto por Contingências Construtivas (RF-55)
O sistema SHALL permitir a simulação de contingências técnicas e geotécnicas (ex.: aumento de 15% em solo rochoso, acréscimo de extensões de acessos difíceis ou substituição de torres autoportantes por estaiadas) integradas à Matriz de Riscos (RF-61), computando o reflexo financeiro imediato no custo, na contingência e na margem.

#### Scenario: Simulação de cenário com maior incidência de rocha
- **WHEN** o orçamentista testa a hipótese de 20% das fundações em solo tipo 3 (rocha com perfuração) em vez de 10%
- **THEN** o sistema recalcula o custo adicional de perfuração/concreto e indica a contingência monetária requerida

#### Scenario: Simulação de cenário com maior incidência de rocha e reflexo no BDI
- **WHEN** o orçamentista testa a hipótese de 20% das fundações em solo tipo 3 (rocha com perfuração) em vez de 10% e classifica a incerteza na Matriz de Riscos
- **THEN** o sistema recalcula o custo adicional de perfuração/concreto, atualiza a severidade ponderada do risco e ajusta automaticamente a contingência do BDI

---

### Requirement: Comparativo Analítico de Revisões por Causa-Raiz (RF-56)
O sistema SHALL comparar duas revisões quaisquer da mesma oferta, decompondo a diferença do preço de venda em suas causas-raiz: variação de quantitativos físicos (M05), variação de preços de materiais/cotações (M06), alteração de tributos (M06), variação de serviços (M09) ou modificação de margem e coeficientes $K$ (M10).

#### Scenario: Comparação entre Revisão 0 e Revisão 1
- **WHEN** a Revisão 1 apresenta um aumento de R$ 12.000.000 no preço de venda em relação à Revisão 0
- **THEN** o sistema detalha que R$ 8.000.000 decorrem da elevação da cotação do alumínio LME, R$ 3.000.000 do acréscimo de 10 torres e R$ 1.000.000 de impostos
