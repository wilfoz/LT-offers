## Why

O redutor de produtividade por precipitação pluviométrica (RN-16, RF-37) já está implementado no motor de cálculo, porém com todas as constantes hardcoded em código: a matriz de precipitação histórica (27 UFs × 12 meses), os limites das 5 faixas de severidade e os fatores de produtividade de cada faixa. Esses valores foram extraídos da planilha Calculo LT e ainda não foram confirmados com os autores (§02 do levantamento) — o usuário precisa poder corrigi-los e calibrá-los sem alteração de código. Além disso, o cronograma físico ignora feriados e dias não laborais: um mês com Carnaval e um mês cheio produzem a mesma quantidade, superestimando a produção real das equipes. Requisito novo do usuário, não coberto pelo levantamento original.

Fase do roadmap: F4 (Cronograma, histograma e canteiros — M07).

## What Changes

- **Parâmetros de chuva viram catálogo versionado por vigência (RNF-05)**: matriz de precipitação UF×mês, limites das faixas (mm) e fatores de produtividade por faixa passam a ser dados editáveis pelo usuário, com histórico imutável — uma oferta fechada reproduz seus números originais. A versão inicial (seed) reproduz exatamente os valores hoje hardcoded, preservando paridade numérica.
- **Novo catálogo de calendário de trabalho**: feriados (datas civis), dias não laborais da semana (ex.: sábado/domingo) e quantidade padrão de dias úteis mensais, tudo configurável pelo usuário e versionado por vigência.
- **Cronograma ancorado em calendário civil real**: o mês 1 do cronograma passa a ser ancorado em `scheduleStartDate` da revisão da oferta (campo já existente, hoje não utilizado pelo motor). O motor deriva os dias úteis de cada mês civil e aplica um fator de calendário (dias úteis do mês ÷ dias úteis padrão) sobre a produção nominal das equipes, compondo com o fator de chuva e a dificuldade de acesso.
- **Cálculo de duração mês a mês**: a duração das atividades deixa de usar a média de fator de chuva de janela fixa de 6 meses e passa a consumir o quantitativo iterativamente mês a mês, com os fatores reais de cada mês civil.
- **Motor de cálculo deixa de ler constantes internas**: `PrecipitationCalculator` recebe os parâmetros como entrada (mantendo-se puro e determinístico, RNF-04/RNF-16); a resolução da versão vigente acontece na borda (API), pelo padrão de data de referência dos catálogos.
- `field-factors` e o contexto `schedule` da API passam a resolver os parâmetros vigentes do banco em vez das constantes do motor.

**BREAKING** (comportamento de cálculo): durações calculadas podem mudar em relação ao método atual de média fixa de 6 meses; a validação de paridade numérica da fase F4 define a tolerância aceita.

## Capabilities

### New Capabilities

- `catalogos/parametros-chuva`: catálogo versionado por vigência dos parâmetros de precipitação pluviométrica — matriz histórica UF×mês, faixas de severidade (limites em mm) e fatores de produtividade por faixa (RN-16, RF-37, RNF-05).
- `catalogos/calendario-trabalho`: catálogo versionado por vigência do calendário de trabalho — feriados por data civil, dias não laborais da semana e dias úteis padrão do mês, usados para penalizar a produção mensal das equipes.

### Modified Capabilities

- `cronograma`: o redutor de chuva (RF-37, RN-16) passa a usar parâmetros configuráveis vigentes em vez de constantes; novo requisito de penalização por feriados/dias não laborais com ancoragem do cronograma em `scheduleStartDate`; cálculo de duração passa a ser mês a mês com fatores compostos (chuva × calendário ÷ acesso).

## Impact

- **Banco/Prisma**: dois pares item+versões novos no `prisma/schema.prisma` (padrão de catálogo versionado), migration e seed com os valores atuais como versão inicial.
- **Motor (`libs/calc-engine`)**: refit de `precipitation-calculator.ts` (parâmetros injetados), novo calculador de dias úteis/fator de calendário, `schedule-calculator.ts` iterativo mês a mês ancorado em data civil (helper de data civil existente, fuso `America/Sao_Paulo`).
- **Domain (`libs/domain`)**: contratos dos dois catálogos e funções puras de classificação de faixa e derivação de dias úteis.
- **API (`apps/api`)**: CRUD dos dois catálogos no padrão versionado; `field-factors` e contexto `schedule` resolvem versão vigente por data de referência na borda.
- **Web (`apps/web`)**: duas telas de catálogo novas (parâmetros de chuva, calendário de trabalho); exibição do impacto dos fatores no cronograma.
- **README.md**: termos novos no mapa canônico pt-BR → inglês (feriado → holiday, calendário de trabalho → work calendar, parâmetros de chuva → rainfall parameters, dias úteis → working days).
- **Requisitos cobertos**: RF-37, RN-16, RNF-04, RNF-05, RNF-08, RNF-09, RNF-16; requisito novo (feriados) sem ID no levantamento — proposto como extensão do M07.
