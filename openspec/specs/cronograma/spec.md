## Purpose

Define os requisitos e regras de cálculo para o cronograma físico de Linhas de Transmissão (Módulo M07), abrangendo estrutura hierárquica de grupos de atividades, alocação e dimensionamento de equipes, redutor de produtividade por índice de precipitação pluviométrica (RN-16), validação de limites de produção (RN-15), marcos contratuais (LI/LO) e dimensionamento de canteiros de obra.

## Requirements

### Requirement: Estrutura Padronizada de Grupos de Atividades de Transmissão (RF-35)
O sistema SHALL estruturar o cronograma físico da linha de transmissão em grupos hierárquicos padronizados: Indiretos, Pátios e Canteiros, Obras Preliminares (Acessos, Supressão e Faixa), Obras Civis (Escavação, Concreto, Armadura e Reaterro), Montagem de Estruturas (Torres e Acessórios), Lançamento de Cabos (Condutores, Guarda e OPGW) e Comissionamento/Energização.

#### Scenario: Criação de cronograma por linha com vínculo aos quantitativos físicos
- **WHEN** uma linha de transmissão possui quantitativos físicos calculados (ex.: $120\text{ torres}$, $100\text{ km}$ de lançamento de cabo quádruplo e $150\text{ ha}$ de limpeza de faixa)
- **THEN** o sistema gera a estrutura padrão de atividades com as quantidades físicas herdadas automaticamente do motor de quantitativos M05

---

### Requirement: Alocação de Equipes e Cálculo Paramétrico de Duração (RF-36, RN-14, RN-15)
O sistema SHALL calcular a duração de cada atividade em meses a partir da quantidade física de trabalho, da quantidade de equipes alocadas, da taxa de produção nominal cadastrada no catálogo de equipes vigentes (`WorkCrew`) e do fator ponderado de dificuldade de acesso da linha de transmissão (`AccessDifficulty`), consumindo o quantitativo iterativamente mês a mês com a produção efetiva de cada mês civil — produção nominal × equipes × fator de chuva do mês × fator de calendário do mês ÷ dificuldade de acesso —, distribuindo no tempo os custos de mobilização, os custos recorrentes mensais de mão de obra e equipamentos (calculados conforme RN-14) e a desmobilização. Caso a produção efetiva de um mês seja zero (fator zerado ou mês sem dias úteis), o sistema SHALL avançar para o mês seguinte emitindo alerta explícito, abortando com erro caso a atividade ultrapasse o horizonte máximo de 600 meses.

#### Scenario: Cálculo de duração e custo temporal de equipe de montagem de torres
- **WHEN** a atividade de montagem possui 120 torres, o usuário aloca 2 equipes de montagem com produção de 6 torres/mês por equipe em trecho com fator de acesso neutro (1,00), e todos os meses do período têm fator de chuva e fator de calendário neutros (1,00)
- **THEN** o sistema calcula a duração de $\frac{120}{2 \times 6} = 10\text{ meses}$, distribuindo a mobilização no mês inicial, o custo mensal das 2 equipes ao longo dos 10 meses e a desmobilização no mês final

#### Scenario: Ajuste de duração pelo fator de dificuldade de acesso do trecho
- **WHEN** uma frente de escavação possui 100 fundações e o trecho apresenta fator de dificuldade de acesso ponderado de 1,25 (terreno difícil) com 2 equipes de capacidade 10 fundações/mês, com fatores de chuva e calendário neutros
- **THEN** o sistema ajusta a produtividade efetiva das equipes dividindo pela dificuldade de acesso ($\frac{20}{1,25} = 16\text{ fundações/mês}$), resultando em duração calculada de $\lceil \frac{100}{16} \rceil = 7\text{ meses}$

#### Scenario: Consumo mês a mês com fatores variáveis por mês civil
- **WHEN** uma atividade de 60 torres tem 1 equipe com produção nominal de 10 torres/mês e os meses civis do período apresentam fatores de chuva de 1,00, 1,00, 0,65, 0,65, 1,00, ... com calendário neutro
- **THEN** o sistema consome o quantitativo mês a mês ($10 + 10 + 6{,}5 + 6{,}5 + 10 + ...$) e a duração resulta dos meses efetivamente necessários para zerar o saldo, em vez da divisão do total por uma produção média fixa

#### Scenario: Mês com produção efetiva zero não trava o cálculo
- **WHEN** o usuário configura fator de produtividade 0 para a faixa de chuva mais severa e um mês do período cai nessa faixa
- **THEN** o sistema pula o mês sem consumir quantitativo, emite alerta explícito em português identificando o mês parado e prossegue o consumo no mês seguinte

---

### Requirement: Aplicação do Redutor de Produtividade por Precipitação Pluviométrica Regional (RF-37, RN-16)
O sistema SHALL aplicar um fator redutor de produtividade sobre a produção nominal das equipes de campo em função da precipitação pluviométrica histórica média da UF e do mês civil de execução da obra, utilizando a matriz de precipitação, as faixas de severidade e os fatores de produtividade da versão vigente do catálogo de parâmetros de chuva (resolvida pela data de referência da oferta), cobrindo todas as 27 UFs brasileiras. Os valores default (seed) reproduzem a planilha Calculo LT com 5 faixas de severidade calibradas de 0,65 (precipitação severa) a 1,00 (período seco), integralmente editáveis pelo usuário.

#### Scenario: Redução de produtividade no período chuvoso
- **WHEN** uma equipe de escavação possui produção nominal de 20 fundações/mês em condições normais (fator 1,0), e nos meses de janeiro e fevereiro a UF da linha apresenta nível máximo de precipitação com fator de produtividade vigente de 0,65
- **THEN** o sistema reduz a produção efetiva nesses meses para $20 \times 0,65 = 13\text{ fundações/mês}$, ajustando a duração total e alertando o impacto no cronograma

#### Scenario: Resolução para qualquer UF brasileira válida
- **WHEN** uma linha de transmissão é cadastrada em uma UF do Norte ou Nordeste (ex.: PA, MA, BA, RO)
- **THEN** o motor de cálculo recupera a curva pluviométrica dos 12 meses da UF na versão vigente do catálogo de parâmetros de chuva

#### Scenario: Percentual editado pelo usuário reflete no cálculo
- **WHEN** o usuário cria uma versão dos parâmetros de chuva alterando o fator da faixa mais severa de 0,65 para 0,80 com vigência anterior à data de referência da oferta
- **THEN** o cálculo do cronograma passa a aplicar 0,80 nos meses da faixa severa, e ofertas com data de referência anterior à vigência continuam reproduzindo 0,65

---

### Requirement: Validação de Limites de Produção e Consistência Temporal (RF-38, RN-15)
O sistema SHALL validar a produção exigida em cada período do cronograma contra a capacidade máxima teórica declarada no catálogo da equipe (`maxProduction`), emitindo alertas impeditivos explícitos caso a produção programada exceda a capacidade máxima ou caso as atividades não sejam concluídas antes do marco de energização da linha.

#### Scenario: Detecção de sobreprodução de equipe de lançamento
- **WHEN** o cronograma planeja o lançamento de 45 km de cabos em um mês com uma equipe cuja produção máxima declarada no catálogo é de 30 km/mês
- **THEN** o sistema sinaliza erro explícito de sobreprodução (`EXCEEDED_MAX_PRODUCTION`), bloqueando a aprovação do cronograma sem aceitar a inconsistência silenciosamente

---

### Requirement: Marcação e Controle de Marcos Contratuais de LI e LO (RF-39)
O sistema SHALL permitir o cadastro e a vinculação de marcos contratuais ao cronograma da linha, incluindo obrigatoriamente a Licença de Instalação (LI) como condição predecessora para início de obras de campo e a Licença de Operação / Entrada em Operação Comercial (LO) como marco final para comissionamento e faturamento da RAP.

#### Scenario: Validação de início de obra prévio à Licença de Instalação
- **WHEN** uma atividade de obra civil ou supressão de vegetação é agendada para início antes da data prevista de obtenção da Licença de Instalação (LI)
- **THEN** o sistema emite aviso impeditivo de conformidade socioambiental e contratual

---

### Requirement: Modelagem e Dimensionamento de Canteiros de Obra (RF-41)
O sistema SHALL modelar o dimensionamento e a distribuição orçamentária dos canteiros de apoio à obra, discriminando canteiro principal/central e canteiros avançados, computando custos de implantação/terraplenagem, infraestrutura modular, aluguel de área, quadro fixo de administração/apoio do canteiro, custo mensal de operação e desmobilização ao término das frentes.

#### Scenario: Dimensionamento de canteiro central e canteiro avançado
- **WHEN** uma linha de 200 km é configurada com 1 canteiro central (duração de 18 meses com custo mensal fixo de R$ 120.000) e 2 canteiros avançados (duração de 8 meses com custo mensal fixo de R$ 45.000 cada)
- **THEN** o sistema consolida o custo total dos canteiros distribuindo os custos fixos nos meses correspondentes e somando as taxas de mobilização e desmobilização

---

### Requirement: Ancoragem do Cronograma em Calendário Civil
O sistema SHALL ancorar o mês 1 do cronograma na data de início de obra da revisão da oferta (`scheduleStartDate`), mapeando cada mês do projeto ao mês civil correspondente para resolução do fator de chuva e do fator de calendário. Quando a data de início não estiver informada, o sistema SHALL tratar a ausência como pendência de primeira classe (RNF-09): calcula com meses cíclicos sem fator de calendário e emite alerta explícito de que feriados e dias não laborais não foram considerados — nunca assumindo um ano silenciosamente.

#### Scenario: Mês do projeto mapeado ao mês civil real
- **WHEN** a revisão da oferta tem `scheduleStartDate` em 2027-03-15 e uma atividade inicia no mês 4 do projeto
- **THEN** o sistema resolve o mês civil junho de 2027 para os fatores de chuva e de calendário dessa atividade

#### Scenario: Ausência da data de início gera pendência explícita
- **WHEN** a revisão da oferta não possui `scheduleStartDate` informada
- **THEN** o sistema calcula o cronograma sem o fator de calendário e emite alerta explícito em português informando que feriados e dias não laborais não foram considerados por falta da data de início de obra

---

### Requirement: Penalização da Produção por Feriados e Dias Não Laborais
O sistema SHALL aplicar sobre a produção nominal das equipes de campo um fator de calendário mensal igual aos dias úteis do mês civil (derivados da versão vigente do catálogo de calendário de trabalho e da UF da linha) divididos pela quantidade padrão de dias úteis configurada, compondo-o multiplicativamente com o fator de chuva e a dificuldade de acesso. Grupos de custo mensal fixo (Indiretos e Canteiros) permanecem fora da penalização.

#### Scenario: Mês com feriados reduz a produção efetiva
- **WHEN** uma equipe tem produção nominal de 22 torres/mês, o padrão configurado é de 22,00 dias úteis e o mês civil da atividade possui 19 dias úteis após descontar sábados, domingos e 2 feriados aplicáveis
- **THEN** o sistema aplica fator de calendário $\frac{19}{22}$ e a produção efetiva do mês resulta em $22 \times \frac{19}{22} = 19\text{ torres}$

#### Scenario: Composição multiplicativa com o fator de chuva
- **WHEN** no mesmo mês civil incidem fator de chuva 0,85 e fator de calendário $\frac{20}{22}$ sobre uma produção nominal de 10 fundações/mês com acesso neutro
- **THEN** o sistema calcula a produção efetiva $10 \times 0,85 \times \frac{20}{22} \approx 7,73\text{ fundações/mês}$ com arredondamento a 2 casas decimais half-up

#### Scenario: Grupos de custo fixo não são penalizados
- **WHEN** o cronograma contém atividades dos grupos Indiretos e Canteiros em meses com feriados
- **THEN** os custos mensais fixos desses grupos permanecem inalterados pelo fator de calendário
