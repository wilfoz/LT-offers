## Purpose

Define os requisitos e regras de cálculo para o acompanhamento físico-financeiro da execução de obras de Linhas de Transmissão através da Curva S (Previsto vs. Medido/Realizado) e análise de valor agregado (Fase F7 do roadmap).

## ADDED Requirements

### Requirement: Registro Mensal de Avanço Físico e Medições Reais de Campo
O sistema SHALL permitir registrar o avanço físico real executado em campo (% e quantidades físicas de escavação, fundações, montagem e cabos) e o faturamento medido acumulado mês a mês ao longo do contrato.

#### Scenario: Lançamento de boletim de medição mensal
- **WHEN** o engenheiro de campo registra o avanço do mês 06 com 45 torres montadas e R$ 4.500.000 de medição aprovada
- **THEN** o sistema armazena o boletim de medição vinculado à baseline e atualiza a série temporal de execução da obra

---

### Requirement: Curva S Comparativa e Análise de Desvios (Earned Value / IDP e IDC)
O sistema SHALL calcular automaticamente os indicadores de Análise de Valor Agregado (*Earned Value Management*):
1. Valor Planejado ($PV$ - *Planned Value* / Baseline);
2. Valor Agregado ($EV$ - *Earned Value* / Físico Realizado);
3. Custo Real ($AC$ - *Actual Cost* / Medição Financeira);
4. Variação de Prazo ($SV = EV - PV$) e Índice de Desempenho de Prazo ($SPI = EV / PV$);
5. Variação de Custo ($CV = EV - AC$) e Índice de Desempenho de Custo ($CPI = EV / AC$).

#### Scenario: Cálculo de SPI e CPI em obra com atraso físico
- **WHEN** no mês 08 o valor planejado é R$ 40.000.000, o valor agregado realizado é R$ 36.000.000 e o custo medido é R$ 38.000.000
- **THEN** o sistema calcula $SPI = 0,90$ (atraso de 10% no cronograma) e $CPI = 0,947$ (estouro de custo de 5,3%) e plota a Curva S comparativa
