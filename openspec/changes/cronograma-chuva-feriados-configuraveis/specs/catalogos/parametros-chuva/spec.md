## Purpose

Define o catálogo versionado dos parâmetros de precipitação pluviométrica usados pelo redutor de produtividade do cronograma (RN-16, RF-37): matriz histórica de precipitação por UF e mês, faixas de severidade e fatores de produtividade, todos editáveis pelo usuário com histórico imutável por vigência (RNF-05).

## ADDED Requirements

### Requirement: Manutenção Versionada dos Parâmetros de Chuva (RN-16, RNF-05)
O sistema SHALL permitir ao usuário consultar e editar os parâmetros de precipitação pluviométrica — matriz de precipitação média histórica das 27 UFs × 12 meses, limites das faixas de severidade (mm/mês) e fator de produtividade de cada faixa — criando uma nova versão com data de início de vigência a cada edição, sem jamais alterar ou excluir versões anteriores.

#### Scenario: Edição cria nova versão preservando o histórico
- **WHEN** o usuário altera o fator de produtividade da faixa mais severa de 0,65 para 0,70 com vigência a partir de 2026-10-01
- **THEN** o sistema cria uma nova versão dos parâmetros com a alteração e mantém a versão anterior intacta e consultável para datas de referência anteriores a 2026-10-01

#### Scenario: Resolução da versão vigente por data de referência
- **WHEN** um cálculo de cronograma é executado com data de referência 2026-09-15 e existem versões com vigência a partir de 2020-01-01 e 2026-10-01
- **THEN** o sistema resolve e utiliza a versão vigente em 2026-09-15 (a de 2020-01-01), garantindo que uma oferta fechada reproduza seus números originais mesmo após novas edições

### Requirement: Validação dos Parâmetros de Chuva
O sistema SHALL validar cada nova versão dos parâmetros: fatores de produtividade como decimais entre 0 e 1 (strings decimais, nunca float — RNF-08), precipitações não negativas, faixas de severidade com limites estritamente crescentes e a última faixa aberta (sem limite superior), e matriz completa cobrindo as 27 UFs × 12 meses, rejeitando versões incompletas ou inválidas com mensagem em português.

#### Scenario: Fator de produtividade fora do intervalo é rejeitado
- **WHEN** o usuário tenta gravar uma versão com fator de produtividade "1.20" em uma faixa
- **THEN** o sistema rejeita a gravação com erro 400 e mensagem em português indicando que o fator deve estar entre 0 e 1

#### Scenario: Matriz incompleta é rejeitada
- **WHEN** o usuário tenta gravar uma versão sem a série de precipitação de uma das 27 UFs
- **THEN** o sistema rejeita a gravação com erro 400 identificando a UF ausente, sem assumir zero silenciosamente (RNF-09)

### Requirement: Versão Inicial com os Valores da Planilha (RN-16)
O sistema SHALL prover uma versão inicial (seed) dos parâmetros de chuva com vigência retroativa, reproduzindo exatamente a matriz de precipitação por UF, as 5 faixas de severidade e os fatores de produtividade extraídos da planilha Calculo LT, de modo que cálculos existentes permaneçam numericamente idênticos antes de qualquer edição do usuário.

#### Scenario: Consulta sem edições retorna os valores originais
- **WHEN** nenhuma edição foi feita e o usuário consulta os parâmetros vigentes de MG
- **THEN** o sistema retorna a série de precipitação original da planilha para MG e as 5 faixas com fatores 1,00 / 0,95 / 0,85 / 0,75 / 0,65
