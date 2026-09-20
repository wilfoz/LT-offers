## Purpose

Centraliza os parâmetros de engenharia de campo e coeficientes de correção geotécnicos e topográficos (§02, RF-14, RF-15, RF-21, RN-15, RN-16) utilizados pelo motor de cálculo de linhas de transmissão, incluindo fatores de severidade de acesso, relevo, empolamento e calibração de produtividade.

## Requirements

### Requirement: Parametrização e Resolução de Fatores de Dificuldade de Acesso e Terreno
O sistema SHALL disponibilizar fatores de correção de esforço e produtividade baseados na severidade de acesso de cada estrutura (`AccessDifficulty`), aplicando multiplicadores padronizados: `NORMAL` (fator 1,00), `DIFFICULT` (fator 1,25) e `CROSSING` (fator 1,60), permitindo calcular o índice ponderado de dificuldade de acesso da linha de transmissão para ajuste de durações e alocação de equipamentos.

#### Scenario: Cálculo do índice ponderado de acesso de uma linha
- **WHEN** uma linha de transmissão possui 100 torres, das quais 70 são classificadas como `NORMAL` (1,00), 20 como `DIFFICULT` (1,25) e 10 como `CROSSING` (1,60)
- **THEN** o sistema calcula o fator médio ponderado de acesso da linha em $\frac{70 \times 1,00 + 20 \times 1,25 + 10 \times 1,60}{100} = 1,110$, utilizando precisão decimal exata

#### Scenario: Torre com acesso travessia especial (CROSSING)
- **WHEN** uma torre de ângulo ou transposição é classificada com acesso `CROSSING`
- **THEN** o sistema aplica o multiplicador de 1,60 sobre o tempo previsto de implantação e mobilização específica de acessos para a estrutura

### Requirement: Parametrização Geotécnica de Empolamento e Compactação de Solos
O sistema SHALL permitir definir e aplicar coeficientes de empolamento de solo (fator de expansão volumétrica de corte, $20\%$ a $30\%$) e contração/compactação para fins de cálculo de transporte de bota-fora e volume de corte/aterro por tipo de solo.

#### Scenario: Aplicação de fator de empolamento para bota-fora
- **WHEN** o volume geométrico escavado de uma fundação for de 100,000 m³ em solo arenoso/argiloso com fator de empolamento configurado em 1,25 (25%)
- **THEN** o sistema calcula o volume solto para transporte em $100,000 \times 1,25 = 125,000\text{ m³}$, gerando a quantidade exata para dimensionamento de caminhões basculantes e bota-fora
