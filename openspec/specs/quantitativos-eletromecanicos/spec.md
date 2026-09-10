# quantitativos-eletromecanicos Specification

## Purpose
Define os requisitos e regras de cálculo para quantitativos de engenharia eletromecânica de Linhas de Transmissão (Módulo M05), abrangendo torres metálicas treliçadas e estaiadas, cabos condutores, cabos de guarda (aço e OPGW), tirantes, cadeias de isoladores, aterramento, sinalização aeroespacial, acessos, limpeza de faixa e travessias, com discriminação entre teóricos, extras e sobressalentes.
## Requirements
### Requirement: Inventário e Quantitativos de Torres por Altura e Peso (RF-23, RN-10)
O sistema SHALL calcular o inventário consolidado de torres e estruturas da linha de transmissão a partir do estaqueamento executivo ou distribuição preliminar. Para cada torre, o sistema DEVE recuperar a massa nominal (kg) por altura/extensão de pé (*leg extension*) do catálogo vigente `TowerType`, aplicar o percentual de perdas e quebras da obra (0,5% de margem extra conforme RN-10) e calcular a tonelagem total de aço estrutural e conexões.

#### Scenario: Cálculo de massa total de torres treliçadas com extensão de pé
- **WHEN** a linha possui 120 torres da série "SL-20" tipo "SL-SUSP" com altura nominal de 35 m (peso unitário de 14.500 kg) e extensões de perna adicionando 800 kg por estrutura
- **THEN** o sistema calcula o peso teórico como $120 \times (14.500 + 800) = 1.836.000\text{ kg}$ e aplica o extra de 0,5% totalizando $1.845.180\text{ kg}$ ($1.845,18\text{ t}$)

#### Scenario: Detecção de torre sem massa cadastrada na vigência
- **WHEN** uma torre do estaqueamento faz referência a um tipo ou altura de estrutura não cadastrada no catálogo de torres vigentes
- **THEN** o sistema sinaliza a inconsistência como pendência impeditiva de engenharia sem assumir massa zero silenciosamente

---

### Requirement: Quantitativos de Condutores e Cabos de Guarda com Flecha e Descidas (RF-23, RN-10, RN-11)
O sistema SHALL calcular a extensão linear total (km) e a massa total (toneladas) de cabos condutores (por fase e feixe), cabos de guarda de aço e cabos OPGW. O cálculo DEVE considerar a extensão da linha, o número de circuitos, o número de subcondutores por fase, o fator de acréscimo geométrico por flecha/catemária (sag) configurado na oferta, as descidas verticais do cabo OPGW até a caixa de emenda e ancoragens em pórticos, e o percentual de perdas de lançamento (3% para cabos de aço e condutores conforme RN-10).

#### Scenario: Cálculo de cabo condutor de alumínio com 4 subcondutores por fase
- **WHEN** a linha possui 100 km de extensão, circuito simples (3 fases), 4 subcondutores por fase (feixe quadruplo), cabo condutor com peso de 1.850 kg/km, acréscimo de flecha de 2,5% e perda de lançamento de 3,0%
- **THEN** o sistema calcula a extensão teórica como $100 \times 3 \times 4 \times 1,025 = 1.230\text{ km}$, aplica a perda de 3,0% ($1.266,9\text{ km}$) e a massa total como $2.343,765\text{ toneladas}$

#### Scenario: Cálculo de cabo de guarda OPGW com descidas de torre e caixas de emenda
- **WHEN** a linha de 100 km possui cabo de guarda OPGW com descidas verticais de 40 m em 25 torres de emenda e fator de flecha de 1,5%
- **THEN** o sistema adiciona $25 \times 0,040\text{ km} = 1,000\text{ km}$ às descidas, computando a extensão e bobinas com os percentuais de perda e sobressalentes aplicáveis

---

### Requirement: Quantitativos de Ferragens, Tirantes, Isoladores e Acessórios (RF-23, RN-10)
O sistema SHALL quantificar os conjuntos de ferragens, cadeias de isoladores (unidades de discos de vidro/porcelana ou bastões poliméricos para suspensão e ancoragem), tirantes e cabos de estaiamento para estruturas estaiadas (*guyed towers* / *cross-rope*), sistemas de amortecimento (amortecedores Stockbridge por vão e tipo de cabo), esferas e balizadores de sinalização aeroespacial diurna/noturna, e malhas de aterramento de pé de torre (hastes de cobreado e contrapesos de aço cobreado).

#### Scenario: Quantificação de cadeias de isoladores e discos por torre
- **WHEN** uma linha 500 kV possui 100 torres de suspensão (3 fases com cadeia dupla, 28 discos por cadeia) e 20 torres de ancoragem (3 fases com cadeia quádrupla, 30 discos por cadeia)
- **THEN** o sistema calcula $100 \times 3 \times 2 \times 28 = 16.800$ discos de suspensão e $20 \times 3 \times 4 \times 30 = 7.200$ discos de ancoragem, aplicando 2,0% de extra para quebras de montagem

#### Scenario: Dimensionamento de tirantes e cabos de aço para torres estaiadas
- **WHEN** uma linha possui 80 torres estaiadas com 4 estais cada, comprimento médio de estai de 45 m e cabo de aço galvanizado 3/8" (peso 0,45 kg/m)
- **THEN** o sistema calcula $80 \times 4 \times 45 = 14.400\text{ m}$ ($14,40\text{ km}$) e $6.480\text{ kg}$ de cabo de tirante antes dos acréscimos de sobras e fixações

---

### Requirement: Serviços Preliminares, Acessos, Limpeza de Faixa e Travessias (RF-25)
O sistema SHALL quantificar os serviços e insumos de acessos e obras preliminares, incluindo: extensão de acessos existentes a recuperar (km), abertura de acessos novos por classe de terreno/dificuldade (km), área de supressão vegetal e limpeza de faixa de servidão (ha) por densidade de vegetação (rasa, média, densa) e quantidade de travessias especiais (rodovias federais/estaduais, ferrovias, rios navegáveis e outras linhas de transmissão).

#### Scenario: Cálculo de limpeza de faixa de servidão por largura e extensão
- **WHEN** a linha possui 100 km de extensão com largura de faixa de servidão de 50 m (área total de $500\text{ ha}$) e o estaqueamento indica 30% de vegetação densa, 50% de vegetação média e 20% de pastagem/rasa
- **THEN** o sistema computa $150\text{ ha}$ de desmatamento denso, $250\text{ ha}$ de limpeza média e $100\text{ ha}$ de roçado raso para a orçamentação dos serviços civis

---

### Requirement: Consolidação de Quantitativos Teóricos, Extras e Sobressalentes (RF-26, RN-10)
O sistema SHALL consolidar a matriz de materiais da linha de transmissão agrupando por família (`TOWERS`, `CONDUCTORS`, `GROUND_WIRES`, `INSULATORS`, `HARDWARE`, `ACCESSORIES`, `GROUNDING`, `LOGISTICS`), discriminando para cada código padronizado a quantidade teórica de projeto, a margem de extra/perda construtiva configurada na oferta e o lote de peças sobressalentes (*spare parts*) requerido pelo edital contratual.

#### Scenario: Matriz consolidada de suprimentos com separação de extras e sobressalentes
- **WHEN** o orçamentista consolida o quantitativo de amortecedores com quantidade teórica de 2.400 peças, extra de obra de 2,0% (48 peças) e sobressalentes contratuais de 5,0% (120 peças)
- **THEN** o sistema apresenta a decomposição exata: 2.400 teóricos, 48 extras, 120 sobressalentes e 2.568 peças no volume total de aquisição

---

### Requirement: Rastreabilidade Item a Item e Memória de Cálculo Eletromecânica (RF-27, RNF-06, RNF-08)
O sistema SHALL disponibilizar a memória de cálculo completa e auditável para qualquer item eletromecânico, listando a fórmula utilizada, as torres do estaqueamento que originaram as parcelas, as premissas de catálogo adotadas e os parâmetros de linha aplicados, executando em precisão decimal exata (`DecimalValue`).

#### Scenario: Consulta da rastreabilidade de toneladas de torres
- **WHEN** o usuário solicita o memorial de cálculo do aço de estruturas
- **THEN** o sistema exibe a tabela analítica torre a torre com número da estrutura, tipo, altura de projeto, massa nominal, adicionais e somatório acumulado

