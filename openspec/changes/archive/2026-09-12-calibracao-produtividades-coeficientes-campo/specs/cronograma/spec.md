## MODIFIED Requirements

### Requirement: Alocação de Equipes e Cálculo Paramétrico de Duração (RF-36, RN-14, RN-15)
O sistema SHALL calcular a duração de cada atividade em meses e dias a partir da quantidade física de trabalho, da quantidade de equipes alocadas, da taxa de produção nominal cadastrada no catálogo de equipes vigentes (`WorkCrew`) e do fator ponderado de dificuldade de acesso da linha de transmissão (`AccessDifficulty`), distribuindo no tempo os custos de mobilização, os custos recorrentes mensais de mão de obra e equipamentos (calculados conforme RN-14) e a desmobilização.

#### Scenario: Cálculo de duração e custo temporal de equipe de montagem de torres
- **WHEN** a atividade de montagem possui 120 torres, e o usuário aloca 2 equipes de montagem com produção de 6 torres/mês por equipe em trecho com fator de acesso neutro (1,00)
- **THEN** o sistema calcula a duração de $\frac{120}{2 \times 6} = 10\text{ meses}$, distribuindo a mobilização no mês inicial, o custo mensal das 2 equipes ao longo dos 10 meses e a desmobilização no mês final

#### Scenario: Ajuste de duração pelo fator de dificuldade de acesso do trecho
- **WHEN** uma frente de escavação possui 100 fundações e o trecho apresenta fator de dificuldade de acesso ponderado de 1,25 (terreno difícil) com 2 equipes de capacidade 10 fundações/mês
- **THEN** o sistema ajusta a produtividade efetiva das equipes dividindo pela dificuldade de acesso ($\frac{20}{1,25} = 16\text{ fundações/mês}$), resultando em duração calculada de $\lceil \frac{100}{16} \rceil = 7\text{ meses}$

### Requirement: Aplicação do Redutor de Produtividade por Precipitação Pluviométrica Regional (RF-37, RN-16)
O sistema SHALL aplicar um fator redutor de produtividade sobre a produção nominal das equipes de campo em função da precipitação pluviométrica histórica média da UF e do mês do calendário de execução da obra, cobrindo todas as 27 UFs brasileiras e classificando a severidade de chuva em 5 faixas calibradas de produtividade (de 0,55 para precipitação severa > 250 mm/mês até 1,00 para período seco < 50 mm/mês).

#### Scenario: Redução de produtividade no período chuvoso
- **WHEN** uma equipe de escavação possui produção nominal de 20 fundações/mês em condições normais (fator 1,0), e nos meses de janeiro e fevereiro a UF da linha apresenta nível máximo de precipitação com fator de produtividade de 0,65
- **THEN** o sistema reduz a produção efetiva nesses meses para $20 \times 0,65 = 13\text{ fundações/mês}$, ajustando a duração total e alertando o impacto no cronograma

#### Scenario: Resolução para qualquer UF brasileira válida
- **WHEN** uma linha de transmissão é cadastrada em uma UF do Norte ou Nordeste (ex.: PA, MA, BA, RO)
- **THEN** o motor de cálculo recupera a curva pluviométrica histórica exata dos 12 meses da UF selecionada para cálculo de produtividade
