## Purpose

Define os requisitos e regras de cálculo para o cronograma físico de Linhas de Transmissão (Módulo M07), abrangendo estrutura hierárquica de grupos de atividades, alocação e dimensionamento de equipes, redutor de produtividade por índice de precipitação pluviométrica (RN-16), validação de limites de produção (RN-15), marcos contratuais (LI/LO) e dimensionamento de canteiros de obra.

## ADDED Requirements

### Requirement: Estrutura Padronizada de Grupos de Atividades de Transmissão (RF-35)
O sistema SHALL estruturar o cronograma físico da linha de transmissão em grupos hierárquicos padronizados: Indiretos, Pátios e Canteiros, Obras Preliminares (Acessos, Supressão e Faixa), Obras Civis (Escavação, Concreto, Armadura e Reaterro), Montagem de Estruturas (Torres e Acessórios), Lançamento de Cabos (Condutores, Guarda e OPGW) e Comissionamento/Energização.

#### Scenario: Criação de cronograma por linha com vínculo aos quantitativos físicos
- **WHEN** uma linha de transmissão possui quantitativos físicos calculados (ex.: $120\text{ torres}$, $100\text{ km}$ de lançamento de cabo quádruplo e $150\text{ ha}$ de limpeza de faixa)
- **THEN** o sistema gera a estrutura padrão de atividades com as quantidades físicas herdadas automaticamente do motor de quantitativos M05

---

### Requirement: Alocação de Equipes e Cálculo Paramétrico de Duração (RF-36, RN-14, RN-15)
O sistema SHALL calcular a duração de cada atividade em meses e dias a partir da quantidade física de trabalho, da quantidade de equipes alocadas e da taxa de produção nominal cadastrada no catálogo de equipes vigentes (`WorkCrew`), distribuindo no tempo os custos de mobilização, os custos recorrentes mensais de mão de obra e equipamentos (calculados conforme RN-14) e a desmobilização.

#### Scenario: Cálculo de duração e custo temporal de equipe de montagem de torres
- **WHEN** a atividade de montagem possui 120 torres, e o usuário aloca 2 equipes de montagem com produção de 6 torres/mês por equipe
- **THEN** o sistema calcula a duração de $\frac{120}{2 \times 6} = 10\text{ meses}$, distribuindo a mobilização no mês inicial, o custo mensal das 2 equipes ao longo dos 10 meses e a desmobilização no mês final

---

### Requirement: Aplicação do Redutor de Produtividade por Precipitação Pluviométrica Regional (RF-37, RN-16)
O sistema SHALL aplicar um fator redutor de produtividade sobre a produção nominal das equipes de campo em função da precipitação pluviométrica histórica média da UF e do mês do calendário de execução da obra, classificada em 5 níveis de severidade de chuva.

#### Scenario: Redução de produtividade no período chuvoso
- **WHEN** uma equipe de escavação possui produção nominal de 20 fundações/mês em condições normais (fator 1,0), e nos meses de janeiro e fevereiro a UF da linha apresenta nível máximo de precipitação com fator de produtividade de 0,65
- **THEN** o sistema reduz a produção efetiva nesses meses para $20 \times 0,65 = 13\text{ fundações/mês}$, ajustando a duração total e alertando o impacto no cronograma

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
