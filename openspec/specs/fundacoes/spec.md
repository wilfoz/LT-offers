# fundacoes Specification

## Purpose
Calcula e consolida os quantitativos de engenharia civil para fundações e escavações de linhas de transmissão, aplicando sobre-escavação, perdas e reaterro sobre as combinações de torre, solo e fundação, com rastreabilidade integral e memória de cálculo.
## Requirements
### Requirement: Resolução Paramétrica de Volumes por Combinação Torre × Solo × Fundação (RN-13, RF-24)
O sistema SHALL (DEVE) resolver os volumes unitários de fundação de cada torre a partir do cruzamento do tipo de torre (`TowerType`), tipo de solo (`SoilType`) e tipo de fundação (`FoundationType`), buscando a versão vigente no catálogo corporativo `FoundationVolume`.

#### Scenario: Cálculo com combinação cadastrada e vigente
- **WHEN** uma torre estaqueada possui tipo de torre "SL-20", solo "II" e fundação "Sapata Normal" com matriz de volumes cadastrada no catálogo
- **THEN** o motor de cálculo recupera os volumes unitários de escavação, concreto, aço, reaterro, perfuração e estacas da versão vigente para essa combinação

#### Scenario: Combinação com ausência de matriz cadastrada
- **WHEN** uma torre estaqueada possui uma combinação de tipo de torre, solo ou fundação sem registro correspondente no catálogo de volumes vigentes
- **THEN** o sistema sinaliza a combinação como pendente/inválida (`MISSING_COMBINATION`), gerando aviso explícito sem converter volumes em zero silencioso

### Requirement: Aplicação de Fatores de Sobre-escavação, Desperdício e Reaterro (RN-12, RF-24)
O sistema SHALL (DEVE) aplicar os fatores regulamentares de sobre-escavação, empolamento e perdas sobre os volumes teóricos brutos:
1. Sobre-escavação por tipo de terreno: solo duro (10%), solo normal (5%), solo com água (20%), tubulão (5%);
2. Empolamento volumétrico para bota-fora e transporte de corte: solo normal (25%), solo duro/rocha (40%), solo saturado/lama (20%);
3. Desperdício de concreto estrutural e de regularização: 5%;
4. Desperdício de aço: 10% para aço de reforço/armadura e 3% para aço de tubulão;
5. Reaterro compactado calculado pela diferença entre o volume total escavado e o volume de concreto/estrutura enterrada, acrescido do fator de compactação de 15%.

#### Scenario: Aplicação de sobre-escavação em solo com água
- **WHEN** o volume teórico de escavação de uma fundação em solo com água for de 40.000 m³
- **THEN** o sistema aplica o acréscimo de 20% de sobre-escavação, totalizando 48.000 m³ com separação explícita entre valor teórico (40.000 m³) e sobre-escavação (8.000 m³)

#### Scenario: Aplicação de perdas de aço e concreto
- **WHEN** a armadura teórica da fundação for de 1.500,00 kg de aço e 12,000 m³ de concreto
- **THEN** o sistema calcula 1.650,00 kg de aço (10% de perda) e 12,600 m³ de concreto (5% de perda), mantendo as memórias de cálculo rastreáveis

#### Scenario: Balanço de reaterro compactado
- **WHEN** o volume escavado total for de 50,000 m³ e o volume de concreto enterrado for de 15,000 m³ em solo com fator de compactação de 15%
- **THEN** o sistema calcula o volume de reaterro compactado necessário em 35,000 m³

#### Scenario: Cálculo de volume de bota-fora com fator de empolamento
- **WHEN** o volume escavado excedente não aproveitado para reaterro for de 15,000 m³ em solo com empolamento de 25%
- **THEN** o sistema calcula o volume solto para transporte e bota-fora em $15,000 \times 1,25 = 18,750\text{ m³}$

### Requirement: Suporte a Estaqueamento Preliminar por Distribuição Percentual (RF-21)
Quando a linha de transmissão não dispuser de estaqueamento detalhado (arquivo PLS-CADD), o sistema SHALL (DEVE) permitir a estimativa paramétrica de fundações a partir da distribuição percentual de tipos de solo e tipos de fundação aplicada sobre a extensão e a quantidade estimada de estruturas.

#### Scenario: Cálculo paramétrico com distribuição percentual
- **WHEN** o usuário define que a linha possui 100 torres estimadas com 60% de Solo Tipo II e 40% de Solo Tipo III, distribuídas entre Sapata (70%) e Tubulão (30%)
- **THEN** o sistema calcula os quantitativos ponderados multiplicando as proporções das matrizes de fundação correspondentes

#### Scenario: Validação da soma de percentuais preliminares
- **WHEN** a soma dos percentuais informados para solos ou fundações diferir de 100,00%
- **THEN** o sistema rejeita o cálculo preliminar e alerta que a distribuição deve totalizar exatamente 100%

### Requirement: Detecção e Tratamento Explícito de Pendências Geotécnicas (RF-20, RNF-09)
O sistema SHALL (DEVE) validar o estaqueamento contra a base de solos e fundações, identificando torres sem solo atribuído, torres sem fundação atribuída e campos com valor nulo (`null`), distinguindo explicitamente "zero" de "não informado" ou "não aplicável".

#### Scenario: Torre sem atribuição de solo ou fundação
- **WHEN** uma torre do estaqueamento tem o campo `soilTypeId` ou `foundationTypeId` como nulo
- **THEN** o sistema inclui a torre na lista de inconsistências da linha e não inclui estimativas parciais no total final consolidado

#### Scenario: Distinção entre valor zero e valor não informado
- **WHEN** uma combinação de fundação possui um campo de estacas igual a `null` versus um campo igual a `0.00`
- **THEN** o sistema trata `null` como dado ausente/pendente e `0.00` como quantidade nula confirmada

### Requirement: Rastreabilidade Item a Item e Memória de Cálculo (RF-26, RF-27, RNF-06)
O sistema SHALL (DEVE) permitir rastrear, para cada material consolidado (concreto, aço, escavação, estacas), a lista exata de torres que originaram a quantidade, detalhando os parâmetros unitários e regras aplicadas.

#### Scenario: Consulta de rastreabilidade de volume de concreto
- **WHEN** o usuário solicita a memória de cálculo do quantitativo de Concreto da Linha
- **THEN** o sistema retorna o detalhamento torre a torre, indicando o número da estrutura, a estaca, o tipo de solo, a fundação, o volume unitário do catálogo, o fator de perda e a quantidade resultante

### Requirement: Aritmética Decimal e Determinismo (RNF-04, RNF-08, RNF-16)
O motor de cálculo SHALL (DEVE) executar em biblioteca pura em TypeScript, utilizando aritmética decimal de precisão fixa (`DecimalValue`), garantindo determinismo idêntico em qualquer ambiente de execução sem erros de arredondamento inerentes a números de ponto flutuante (`float`).

#### Scenario: Reprodutibilidade de cálculo em execuções repetidas
- **WHEN** o motor de cálculo processa a mesma lista de estruturas com a mesma tabela de volumes vigentes
- **THEN** os resultados quantitativos gerados são bit-a-bit idênticos, com 3 casas decimais para volumes (m³, m) e 2 casas decimais para massas (kg)

### Requirement: Detalhamento Analítico de Travessias, Acessos e Limpeza de Faixa (RF-20, RF-21, RNF-14)
O sistema SHALL disponibilizar na interface de Engenharia Civil e Fundações sub-tabelas dedicadas inspiradas nas abas `Travesias`, `Accesos` e `Limpieza` da planilha mestre, exibindo os quantitativos e custos de travessias especiais (rodovias, ferrovias, rios, linhas de transmissão), abertura/manutenção de acessos por tipologia de solo e supressão vegetal da faixa de servidão.

#### Scenario: Visualização de travessias e estruturas especiais
- **WHEN** o usuário visualiza o detalhamento de engenharia civil da linha
- **THEN** o sistema apresenta a tabela de travessias cadastradas com tipo de obstáculo, vão de travessia, medidas de segurança e custo consolidado

#### Scenario: Visualização de limpeza de faixa e acessos
- **WHEN** o usuário consulta os serviços de implantação preliminar
- **THEN** o sistema exibe os hectares de supressão vegetal (leve, média, pesada) e extensão de acessos classificados por terreno

