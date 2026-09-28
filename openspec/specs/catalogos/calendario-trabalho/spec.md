## Purpose

Define o catálogo versionado do calendário de trabalho — feriados, dias não laborais da semana e quantidade padrão de dias úteis mensais — usado para penalizar a produção mensal das equipes no cronograma físico, configurável pelo usuário com histórico imutável por vigência (RNF-05).

## Requirements

### Requirement: Manutenção Versionada do Calendário de Trabalho (RNF-05)
O sistema SHALL permitir ao usuário consultar e editar o calendário de trabalho — lista de feriados, dias não laborais da semana (ex.: sábado e domingo) e quantidade padrão de dias úteis por mês —, criando uma nova versão com data de início de vigência a cada edição, sem jamais alterar ou excluir versões anteriores, com resolução da versão vigente por data de referência.

#### Scenario: Edição cria nova versão preservando o histórico
- **WHEN** o usuário adiciona um feriado estadual e altera os dias úteis padrão de 22,00 para 21,00 com vigência a partir de 2027-01-01
- **THEN** o sistema cria uma nova versão do calendário e mantém a versão anterior intacta para cálculos com data de referência anterior a 2027-01-01

#### Scenario: Resolução da versão vigente por data de referência
- **WHEN** um cálculo de cronograma é executado com data de referência 2026-11-10
- **THEN** o sistema utiliza a versão do calendário com a maior vigência menor ou igual a 2026-11-10

---

### Requirement: Cadastro de Feriados com Data Civil Válida
O sistema SHALL permitir o cadastro de feriados com data civil validada por round-trip de calendário (rejeitando datas inexistentes como 2027-02-30), nome, indicador de recorrência anual (feriado fixo repete todo ano pelo par mês-dia; feriado móvel vale apenas na data cadastrada) e escopo opcional de UF (sem UF = nacional; com UF = aplicável somente a linhas daquela UF).

#### Scenario: Data de calendário inexistente é rejeitada
- **WHEN** o usuário tenta cadastrar um feriado na data "2027-02-30"
- **THEN** o sistema rejeita com erro 400 e mensagem em português indicando data de calendário inválida, sem rollover silencioso para março

#### Scenario: Feriado recorrente aplica-se a todos os anos
- **WHEN** o feriado "Confraternização Universal" está cadastrado em 2026-01-01 como recorrente
- **THEN** o sistema o considera dia não trabalhável em 1º de janeiro de qualquer ano do horizonte do cronograma

#### Scenario: Feriado estadual aplica-se apenas à UF correspondente
- **WHEN** um feriado com escopo UF = BA está cadastrado e o cronograma calcula linhas na BA e em MG
- **THEN** o feriado reduz os dias úteis apenas nos meses do cronograma da linha na BA

---

### Requirement: Derivação de Dias Úteis do Mês Civil
O sistema SHALL derivar a quantidade de dias úteis de um mês civil como o total de dias do mês, menos os dias que caem nos dias não laborais da semana configurados, menos os feriados aplicáveis que caem em dia que seria laboral — sem dupla contagem quando o feriado coincide com dia não laboral.

#### Scenario: Mês com feriados em dias laborais
- **WHEN** um mês civil possui 30 dias, 8 dias caem em sábados e domingos configurados como não laborais e 2 feriados aplicáveis caem em dias de semana
- **THEN** o sistema deriva 20 dias úteis para o mês

#### Scenario: Feriado em dia não laboral não desconta duas vezes
- **WHEN** um feriado aplicável cai em um domingo já configurado como dia não laboral
- **THEN** o sistema não desconta o feriado novamente, mantendo a contagem de dias úteis inalterada por esse feriado

---

### Requirement: Versão Inicial do Calendário (seed)
O sistema SHALL prover uma versão inicial do calendário de trabalho com vigência retroativa contendo sábado e domingo como dias não laborais, 22,00 dias úteis padrão por mês e os feriados nacionais brasileiros de data fixa como recorrentes, integralmente editável pelo usuário.

#### Scenario: Consulta sem edições retorna o calendário padrão
- **WHEN** nenhuma edição foi feita e o usuário consulta o calendário vigente
- **THEN** o sistema retorna sábado e domingo como não laborais, 22,00 dias úteis padrão e os feriados nacionais fixos cadastrados como recorrentes
