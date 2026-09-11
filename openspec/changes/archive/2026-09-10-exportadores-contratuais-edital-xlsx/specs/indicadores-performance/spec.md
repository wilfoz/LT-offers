## Purpose

Define os requisitos e regras de cálculo para a consolidação de indicadores paramétricos sintéticos de desempenho e custo unitário de Linhas de Transmissão (Módulo M09, RF-49), permitindo comparações diretas (*benchmarking*) entre linhas de uma mesma proposta e contra propostas históricas.

## ADDED Requirements

### Requirement: Cálculo de Indicadores Paramétricos de Custo e Engenharia (RF-49)
O sistema SHALL calcular automaticamente indicadores sintéticos de desempenho econômico e técnico para cada linha de transmissão e consolidado para o lote:
1. Custo total por quilômetro (R$/km);
2. Custo total por torre/estrutura (R$/torre);
3. Custo de materiais por km (R$/km) e por torre (R$/torre);
4. Custo de serviços e montagem por km (R$/km) e por torre (R$/torre);
5. Densidade física de estruturas (torres/km e vão médio em metros);
6. Consumo médio de concreto por km ($\text{m}^3\text{/km}$) e por torre ($\text{m}^3\text{/torre}$);
7. Peso médio de aço galvanizado de estruturas por km (t/km).

#### Scenario: Cálculo de ratios sintéticos de linha de 150 km
- **WHEN** uma linha de transmissão possui 150 km de extensão, 375 torres e custo de venda de R$ 180.000.000
- **THEN** o sistema computa o ratio de R$ 1.200.000/km e R$ 480.000/torre, exibindo os indicadores no painel de benchmarking
