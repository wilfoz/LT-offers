# precos-tributos Specification

## Purpose
Define as regras de negócio, formação de preços de commodities metálicas (LME/Midwest), cotações por moeda e o motor de apuração tributária brasileira (ICMS interestadual, DIFAL base dupla, FECOEP, IPI por NCM, PIS/COFINS, REIDI e Faturamento Direto) para materiais de Linhas de Transmissão.

## Requirements
### Requirement: Registro de Cotações e Seleção de Fornecedor Vencedor (RF-28, RF-29)
O sistema SHALL registrar cotações de materiais por fornecedor, moeda (BRL, USD, EUR), UF de origem e condição de fornecimento, convertendo valores para a moeda da oferta e selecionando o fornecedor vencedor para compor o custo base. O sistema DEVE sinalizar e impedir o fechamento da revisão se houver material com quantitativo físico não nulo sem preço unitário definido.

#### Scenario: Conversão cambial e seleção do menor preço unitário
- **WHEN** um material possui cotações de dois fornecedores (um nacional em BRL e um internacional em USD com taxa de câmbio de 5,50 BRL/USD)
- **THEN** o sistema converte o valor em USD para BRL usando a taxa de câmbio da oferta e permite definir a cotação vencedora para a apuração de custos

#### Scenario: Bloqueio de item com quantitativo físico sem cotação
- **WHEN** a linha possui quantidade física calculada maior que zero para um item de material (ex.: cabo condutor ou isolador) e nenhuma cotação ou preço unitário foi atribuído
- **THEN** o sistema sinaliza pendência impeditiva no painel de consistência e bloqueia o fechamento da revisão da proposta

### Requirement: Formação de Preço de Commodities de Alumínio e Cobre (RF-30, RN-07, RN-08)
O sistema SHALL formar dinamicamente o preço de cabos condutores e cabos de guarda de alumínio utilizando a composição: $(\text{LME} + \text{Midwest} \text{ ou } \text{RTDU}) \times \text{Câmbio} + \text{Prêmio do Fabricante}$. A escolha entre a cotação spot e a curva de futuros DEVE seguir a matriz de responsabilidade e alocação de risco da oferta (risco da contratada utiliza futuros; risco do cliente utiliza spot).

#### Scenario: Formação de preço spot para cabo de alumínio com risco do cliente
- **WHEN** a matriz de responsabilidade define que o risco de commodity é do cliente e o item possui LME de 2.400 USD/t, prêmio Midwest de 450 USD/t, câmbio de 5,50 BRL/USD e prêmio de fabricação de 3.200 BRL/t
- **THEN** o sistema calcula o preço base da tonelada de alumínio como $(2.400 + 450) \times 5,50 + 3.200 = 18.875,00 \text{ BRL/t}$

#### Scenario: Formação de preço por curva de futuros com risco da contratada
- **WHEN** a matriz de responsabilidade define que o risco de commodity e câmbio é da contratada
- **THEN** o sistema utiliza a curva de futuros de LME e taxa de câmbio projetada para os meses de fornecimento da obra

### Requirement: Ponderação da Curva de Commodities por Entregas Mensais (RF-31, RN-09)
O sistema SHALL ponderar os preços futuros de commodities e câmbio pelas quantidades (toneladas) efetivamente programadas para entrega em cada mês da obra, a partir do cronograma de entregas de suprimentos, e não por média aritmética simples do período.

#### Scenario: Ponderação volumétrica mensal de entregas
- **WHEN** o cronograma de suprimentos prevê a entrega de 300 toneladas de cabos no mês 6 (LME futuro de 2.500 USD/t) e 700 toneladas no mês 7 (LME futuro de 2.600 USD/t)
- **THEN** o sistema calcula o LME médio ponderado como $\frac{(300 \times 2.500) + (700 \times 2.600)}{1.000} = 2.570,00 \text{ USD/t}$

### Requirement: Motor Fiscal Brasileiro de Materiais (RF-32, RN-04, RN-05, RN-06)
O sistema SHALL calcular o ICMS de origem e destino (considerando rateio proporcional por até duas UFs de destino), o Diferencial de Alíquota (DIFAL) com cálculo de base dupla quando exigido pela legislação da UF de destino, o adicional FECOEP, o IPI por NCM e as alíquotas de PIS/COFINS (3,65% ou 9,25%). Em casos de enquadramento no REIDI ou Faturamento Direto (*Direct Billing*), o sistema DEVE aplicar a suspensão/desoneração tributária aplicável.

#### Scenario: Apuração de ICMS interestadual com DIFAL base dupla e FECOEP
- **WHEN** um material é adquirido em SP (alíquota interestadual de 7%) para entrega em MG (alíquota interna de 18% + 2% de FECOEP) com exigência de base dupla
- **THEN** o sistema apura o ICMS de origem, reconstitui a base interna de MG incluindo os tributos e calcula o DIFAL e o FECOEP devidos no destino com precisão decimal exata

#### Scenario: Desoneração de PIS/COFINS sob regime REIDI com Faturamento Direto
- **WHEN** o cliente detém habilitação REIDI e o material é faturado diretamente pelo fornecedor ao cliente (*Direct Billing*) conforme a matriz de responsabilidade
- **THEN** o sistema aplica alíquota de 0% (suspensão) para PIS e COFINS e segrega o montante faturado direto na estrutura de custos da oferta

### Requirement: Versionamento de Parâmetros e Tabelas Fiscais (RF-33, RNF-15)
O sistema SHALL armazenar matrizes de alíquotas de ICMS origem-destino, tabelas de IPI por NCM, percentuais de FECOEP e parâmetros de PIS/COFINS como entidades versionadas com data de vigência e base legal, permitindo atualizações fiscais sem necessidade de reescrita ou novo deploy do motor de cálculo.

#### Scenario: Consulta de alíquotas por vigência da oferta
- **WHEN** uma oferta histórica fechada em 2024 é recalculada ou visualizada após a atualização das tabelas fiscais em 2026
- **THEN** o sistema utiliza a versão das matrizes tributárias vigentes na data de fechamento daquela revisão, mantendo a reprodutibilidade histórica exata

### Requirement: Memória Analítica e Rastreabilidade Tributária Item a Item (RF-34, RNF-06, RNF-08)
O sistema SHALL disponibilizar a memória de cálculo completa de cada item de material, discriminando quantidade total (teórica + extra + sobressalente), preço unitário base, acréscimos de commodities/câmbio, valor de IPI, ICMS origem, DIFAL, FECOEP, PIS/COFINS e preço final com tributos em aritmética decimal exata (`DecimalValue`).

#### Scenario: Exibição do memorial analítico de material
- **WHEN** o usuário solicita a memória de cálculo de um item de ferragens ou cabo
- **THEN** o sistema apresenta a decomposição linha a linha de cada tributo incidente, a base de cálculo utilizada, a cotação de referência e os fatores aplicados sem truncamento indevido
