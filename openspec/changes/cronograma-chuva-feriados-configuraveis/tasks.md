## 1. Nomenclatura e modelo de dados

- [x] 1.1 Adicionar os termos novos ao mapa canônico pt-BR → inglês no README.md (parâmetros de chuva → rainfall parameters, faixa de severidade → severity band, calendário de trabalho → work calendar, feriado → holiday, dias úteis → working days, dia não laboral → non-working day, recorrente → recurring)
- [x] 1.2 Modelar no `prisma/schema.prisma` o catálogo singleton `RainfallParameterVersion` (versões com `effectiveDate`, autor) com filhas imutáveis `RainfallSeverityBand` (`upperLimitMm Decimal?` nulo na última faixa, `productivityFactor Decimal(5,4)`, ordem) e `RainfallUfRow` (27 UFs, colunas `janMm..decMm Decimal(6,1)`), conforme design D1
- [x] 1.3 Modelar no `prisma/schema.prisma` o catálogo singleton `WorkCalendarVersion` (`effectiveDate`, `standardWorkingDaysPerMonth Decimal(4,2)`, `nonWorkingWeekdays Int[]`) com filha imutável `Holiday` (`date @db.Date`, `name`, `recurring Boolean`, `uf String?`)
- [x] 1.4 Gerar a migration aditiva e conferir nomes de índice/unique gerados (limite de 63 caracteres do Postgres, nomes explícitos só onde estourar)
- [x] 1.5 Seed da versão inicial com vigência retroativa (2020-01-01): matriz 27 UFs × 12 meses, 5 faixas e fatores hoje hardcoded no motor (fonte única: constantes exportadas de `libs/domain`); calendário com sábado+domingo não laborais, 22,00 dias úteis padrão e feriados nacionais de data fixa como recorrentes

## 2. Contratos e funções puras de domínio

- [x] 2.1 Definir em `libs/domain` os contratos `RainfallParameters` (faixas + matriz) e `WorkCalendarParameters` (feriados, dias não laborais, dias padrão) e mover os valores default do motor para constantes exportadas (consumidas pelo seed e pelos testes golden)
- [x] 2.2 Funções puras de classificação de faixa por limites configuráveis (faixas estritamente crescentes, última aberta) e de validação estrutural dos parâmetros (fatores entre 0 e 1, precipitações não negativas, matriz completa das 27 UFs — violações tipadas, mensagens nas bordas)
- [x] 2.3 Funções puras de calendário sobre `civil-date.ts`: expansão de feriados recorrentes por ano, filtro por escopo de UF, derivação de dias úteis do mês civil sem dupla contagem (feriado em dia não laboral) e `addMonths` civil para ancoragem do mês do projeto
- [x] 2.4 Testes de unidade da domain cobrindo os cenários dos specs `catalogos/parametros-chuva` e `catalogos/calendario-trabalho` (incluindo round-trip de data inválida 2027-02-30 e feriado recorrente vs por ano)

## 3. Motor de cálculo (refit calc-engine)

- [ ] 3.1 Refit do `PrecipitationCalculator` para operar sobre `RainfallParameters` recebido por parâmetro, removendo `DEFAULT_PRECIPITATION_BY_UF`, `classifyLevel` com limites fixos e `PRODUCTIVITY_FACTORS_BY_LEVEL` (sem fallback interno — design D2), preservando escalas e arredondamentos atuais
- [ ] 3.2 Novo `WorkCalendarCalculator`: fator de calendário do mês civil = dias úteis ÷ dias padrão, arredondado a 4 casas half-up, a partir de `WorkCalendarParameters` e da UF da linha
- [ ] 3.3 Refit do `ScheduleCalculator`: ancoragem do mês 1 em `scheduleStartDate` (ausência = pendência explícita com alerta, cálculo cíclico sem fator de calendário — RNF-09), consumo do quantitativo mês a mês com produção efetiva composta (nominal × equipes × chuva × calendário ÷ acesso, 2 casas half-up por mês), produção mensal programada real na validação RN-15, guarda de mês com produção zero (alerta e avanço) e horizonte máximo de 600 meses com erro explícito
- [ ] 3.4 Testes golden comparando o método anterior (média fixa de 6 meses) com o novo consumo mês a mês, quantificando o desvio de duração; testes dos cenários do delta `cronograma` (fatores variáveis por mês, mês zerado, composição multiplicativa, grupos Indiretos/Canteiros fora da penalização)

## 4. API

- [ ] 4.1 Endpoints de configuração `GET/POST /schedule-parameters/rainfall` e `GET/POST /schedule-parameters/work-calendar` com `?referenceDate=` resolvida na borda, autor via `X-User`, DTOs com strings decimais e validação de calendário round-trip, imutabilidade de versões, `P2002` → 409 e mensagens em pt-BR (reutilizando pipes, `resolveAuthor`, `resolveReferenceDate` e `prisma-errors` da base de catálogos)
- [ ] 4.2 Teste de paridade DTO × contrato da domain (payload com todas as chaves inválidas → 1 erro por campo), evitando descarte silencioso pela whitelist do `ValidationPipe`
- [ ] 4.3 Contexto `schedule` (porta + adapter Prisma) e `field-factors` passam a resolver a versão vigente dos dois catálogos pela data de referência e injetar os parâmetros no motor, removendo o consumo das constantes; incluir módulos/providers novos no teste permanente `app/context-modules-di.spec.ts`
- [ ] 4.4 Testes de controller e use case cobrindo resolução por vigência (oferta fechada reproduz números originais), UF ausente na matriz → 400 identificando a UF, e alerta de `scheduleStartDate` ausente propagado na resposta

## 5. Interface web

- [ ] 5.1 Tela de parâmetros de chuva: grade UF × 12 meses e edição das faixas (limites + percentuais), criação de nova versão com vigência, callbacks de erro em toda leitura, prefill bloqueante e botão refletindo `form.disabled`
- [ ] 5.2 Tela de calendário de trabalho: feriados (data, nome, recorrente, UF opcional — recorrente exibido como mês-dia sem ano), dias não laborais da semana e dias úteis padrão, com as mesmas guardas de erro/prefill
- [ ] 5.3 Exibir no cronograma (Gantt) os alertas novos (data de início ausente, mês com produção zero) e o efeito dos fatores mensais aplicados
- [ ] 5.4 Testes dos componentes web cobrindo os cenários de interface (incluindo validação de percentual fora de 0–1 e data de feriado inválida)

## 6. Verificação final e paridade

- [ ] 6.1 Rodar `npx nx run-many -t test lint -p api web domain calc-engine`, `npx nx format:check --all` e `npx prisma migrate status`; corrigir pendências
- [ ] 6.2 Rodar as suítes de paridade numérica dos módulos a jusante (histograma, desembolso, resultado econômico) e documentar desvios de duração esperados decorrentes do método mês a mês
- [ ] 6.3 Executar a skill executar-qa sobre os cenários dos três specs da change e gerar `qa/qa.md` com evidências
