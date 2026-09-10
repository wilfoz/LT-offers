## Purpose

Define os requisitos e regras de cálculo para o desembolso e fluxo de caixa de Linhas de Transmissão (Módulo M11), abrangendo a distribuição temporal de custos e faturamento, cronograma de entregas de suprimentos, curvas de fluxo de caixa e determinação do pico de exposição financeira.

## Requirements

### Requirement: Distribuição Mensal de Custo e Faturamento por Curva de Desembolso (RF-57)
O sistema SHALL distribuir o custo e o faturamento mês a mês para cada item do orçamento, aplicando a curva física de execução para itens de serviço (derivada de M07) e curvas percentuais de fabricação/entrega editáveis para itens de fornecimento de materiais.

#### Scenario: Distribuição temporal de custo de condutores e montagem
- **WHEN** os cabos condutores são fornecidos nos meses 6 a 10 (20% ao mês) e o faturamento do serviço de montagem acompanha a medição física dos meses 7 a 14
- **THEN** o sistema projeta a saída de caixa dos materiais nos meses 6 a 10 e o faturamento do serviço conforme o cronograma físico

---

### Requirement: Cronograma de Entregas de Suprimentos e Realimentação de Commodities (RF-58)
O sistema SHALL consolidar o cronograma mensal de entregas de materiais em percentuais e toneladas, utilizando esse cronograma para realimentar automaticamente a ponderação da curva de futuros de alumínio e commodities metálicas (conforme RN-09).

#### Scenario: Ponderação de futuros a partir do cronograma de entregas
- **WHEN** a entrega de 1.200 toneladas de cabos condutores está programada em 400 t no Mês 8 e 800 t no Mês 9
- **THEN** o sistema pondera a cotação futura do alumínio aplicando peso de 33,33% para o Mês 8 e 66,67% para o Mês 9 na formação do preço base

---

### Requirement: Consolidação de Fluxo de Caixa e Pico de Exposição Financeira (RF-59)
O sistema SHALL consolidar o fluxo de caixa temporal do projeto por linha e lote (`D1..D10` e `DT`), computando o saldo mensal ($Faturamento - Custo$) e o saldo acumulado, identificando automaticamente o mês de ocorrência e o valor do **pico máximo de exposição financeira negativa** (necessidade máxima de capital de giro da construtora).

#### Scenario: Identificação do pico de exposição negativa
- **WHEN** o saldo acumulado de caixa atinge seu valor mais negativo de -R$ 18.500.000 no Mês 7 antes do primeiro grande faturamento de medição no Mês 8
- **THEN** o sistema destaca o Mês 7 como pico de exposição de capital de giro com o valor de R$ 18.500.000

---

### Requirement: Exportação de Cronograma de Faturamento nos Layouts dos Contratantes (RF-60)
O sistema SHALL exportar o cronograma de desembolso e faturamento nos formatos padronizados exigidos pelos contratantes e concessionárias (ex.: layout *SIMULAÇÃO CELEO*, *CASHFLOW ELECNOR* com marcos LI/LO por função de transmissão).

#### Scenario: Geração de cashflow no modelo Elecnor
- **WHEN** o usuário seleciona a exportação "Cashflow Padrão Elecnor"
- **THEN** o sistema emite a tabela com as funções de transmissão, datas de LI/LO, desembolsos mensais e curvas acumuladas no padrão exato da concessionária
