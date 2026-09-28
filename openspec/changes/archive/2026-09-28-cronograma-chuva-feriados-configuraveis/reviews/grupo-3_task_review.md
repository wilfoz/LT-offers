# Review do Grupo 3 — Motor de cálculo (refit calc-engine)

**Revisor**: AI Code Reviewer
**Data**: 2026-09-27
**Change / Grupo**: cronograma-chuva-feriados-configuraveis / grupo 3 (tasks 3.1–3.4)
**Status**: APROVADO COM OBSERVAÇÕES

## Resumo

O grupo entrega o refit completo do motor: `PrecipitationCalculator` passa a operar sobre `RainfallParameters` injetado (sem constantes internas, sem fallback de UF — UF desconhecida é throw em pt-BR, design D2), novo `WorkCalendarCalculator` (dias úteis ÷ dias padrão, 4 casas half-up, erro explícito com padrão zero), e `ScheduleCalculator` reescrito para consumo do quantitativo mês a mês com produção efetiva composta (nominal × equipes × chuva × calendário ÷ acesso, 2 casas half-up por mês), ancoragem civil do mês 1 em `scheduleStartDate` com pendência de primeira classe quando ausente/inválida (RNF-09), guarda de mês zerado com alerta e avanço, horizonte máximo de 600 meses com erro explícito, breakdown mensal no contrato (`ActivityMonthlyPlanEntry`) e validação RN-15 pelo pico programado real quando a duração é calculada.

Fidelidade aos cenários do delta `cronograma` confirmada um a um contra os testes (composição 7,73 com fator 20/22 = 0,9091 conferido manualmente para junho/2026; ancoragem 2027-03-15 mês 4 → junho/2027; mês parado com alerta identificando o mês; INDIRECTS fora dos fatores; 600 meses → throw; pendência sem rollover para 2027-02-30). Os testes golden quantificam e documentam o desvio do método legado (fixture curta coincide em 7 meses; fixture longa: legado 21 × novo 23, +2 meses ao cruzar duas estações chuvosas) — exatamente o que o risco do design pedia. Duas observações da review dos grupos 1-2 foram endereçadas (MIN-2: `band-position-duplicated` com teste; MIN-4: `UF_METADATA_MAP` importado da domain, cópia local removida); MIN-1 (assinatura decimal-segura do `classify`) não foi adotada como recomendado — aceita nesta review com condição registrada (ver MIN-1 abaixo).

Zero problemas críticos e zero majors; 5 minors. Suítes verdes sem cache: domain 12/89, calc-engine 19/92, api 43/224; lint 0 erros; Prettier limpo em todos os arquivos alterados; BOM ausente nos 2 arquivos novos.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| libs/domain/src/lib/schedule/activity.ts | ✅ Ok | 0 |
| libs/calc-engine/src/lib/schedule/precipitation-calculator.ts | ⚠️ Problemas | 2 minors |
| libs/calc-engine/src/lib/schedule/work-calendar-calculator.ts | ✅ Ok | 0 |
| libs/calc-engine/src/lib/schedule/schedule-calculator.ts | ⚠️ Problemas | 1 minor |
| libs/calc-engine/src/index.ts | ✅ Ok | 0 |
| libs/calc-engine/src/lib/schedule/precipitation-calculator.spec.ts | ✅ Ok | 1 nota |
| libs/calc-engine/src/lib/schedule/schedule-calculators.spec.ts | ✅ Ok | 0 |
| libs/calc-engine/src/lib/schedule/schedule-duration-golden.spec.ts | ✅ Ok | 0 |
| libs/calc-engine/src/lib/parity/business-rules-boundary.spec.ts | ✅ Ok | 0 |
| apps/api/src/field-factors/field-factors.service.ts | ⚠️ Problemas | 1 minor (compartilhado) |
| apps/api/src/contexts/schedule/application/usecases/get-line-schedule.usecase.ts | ⚠️ Problemas | 1 minor (compartilhado) |

## Verificações Executadas

| Verificação | Resultado |
|-------------|-----------|
| `npx nx run-many -t test lint -p calc-engine domain api --skip-nx-cache` | ✅ domain 12 suítes/89 testes; calc-engine 19/92; api 43/224; lint 0 erros (241 warnings pré-existentes na api, nenhum em arquivo deste grupo) |
| `npx prettier --check` nos 11 arquivos alterados | ✅ todos no estilo |
| BOM UTF-8 nos 2 arquivos novos (`head -c3 \| od`) | ✅ ausente (`69 6d 70`) |
| Composição multiplicativa conferida manualmente | ✅ junho/2026: 30 dias − 8 fins de semana − 2 feriados em dia laboral = 20 úteis; 20/22 = 0,9091 (4 casas half-up); 10 × 0,85 × 0,9091 = 7,727... → 7,73 (2 casas half-up) |
| Ancoragem conferida manualmente | ✅ 2027-03-15, mês 4 do projeto → junho/2027 (`civilMonthOfProjectMonth` com aritmética de meses zero-based) |
| Regressão RN-15 (sobreprodução com duração fixada) | ✅ ambos os cenários existentes usam `durationMonths` fixado → caminho linear preservado; asserções `warnings[0]` → `warnings.some` justificadas (o alerta de pendência de data agora ocupa o índice 0) |
| Follow-ups da review grupos 1-2 | ✅ MIN-2 endereçado (`band-position-duplicated` em `rainfall-parameters.ts:585` + teste em `rainfall-parameters.spec.ts:139`); ✅ MIN-4 endereçado (`UF_METADATA_MAP` importado de `@lt-offers/domain`, duplicata do calc-engine removida); ⚠️ MIN-1 não adotado como recomendado (ver abaixo) |
| Constantes removidas | ✅ nenhuma ocorrência restante de `classifyLevel`, `PRODUCTIVITY_FACTORS_BY_LEVEL` ou `DEFAULT_PRECIPITATION_BY_UF` no repositório |

## Análise dos Pontos Solicitados

1. **Fidelidade ao delta `cronograma`**: todos os cenários MODIFICADOS e ADICIONADOS têm teste com os números exatos do spec (fatores 1/1/0,65/0,65 → 7 meses; mês zerado com alerta pt-BR identificando o mês; 7,73 com arredondamento 2 casas half-up; INDIRECTS/CAMPS fora via `FIXED_COST_GROUPS`; ancoragem junho/2027; pendência explícita sem fator de calendário).
2. **RN-15**: a troca linear → pico programado real vale só quando a duração é calculada (`validationMonthlyProd = monthlyBreakdown ? peakPlannedProduction : requiredMonthlyProd`, `schedule-calculator.ts:223-225`); com duração fixada pelo usuário o comportamento original é intocado — os dois cenários existentes de sobreprodução usam duração fixada e passam sem alteração de asserção de valor. O pico usa `plannedProduction` (≤ efetiva; o último mês parcial não infla a exigência) — semanticamente correto.
3. **Aritmética decimal**: todo o caminho de composição/consumo usa `DecimalValue` (decimal.js, precisão 34); `Number()` aparece apenas na classificação de faixa e nos metadados de exibição (ver MIN-1) — nenhum float em aritmética de negócio.
4. **Idiomas**: código em inglês; comentários, warnings e mensagens de erro em pt-BR; descrições de teste em pt-BR. Conforme.
5. **Loop de consumo**: terminação garantida (mês produtivo consome > 0; mês zerado avança com o guarda de 600 disparando antes de laço infinito — coberto por teste); breakdown consistente (entrada empurrada antes do guarda de zero, `plannedProduction` 0,00 no mês parado, parcial no último mês); duração = `projectMonth - startMonth` inclui meses parados (teste: fevereiro zerado → duração 3).

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

**MIN-1 — Recomendação de assinatura decimal-segura do `classifyRainfallBand` não adotada; `Number()` na fronteira de classificação**
`libs/calc-engine/src/lib/schedule/precipitation-calculator.ts:56, 80, 116` × `libs/domain/src/lib/schedule/rainfall-parameters.ts:529-538`
A review dos grupos 1-2 recomendou mudar a assinatura para aceitar string decimal (comparação via `DecimalValue`); o refit manteve `precipitationMm: number` e o calc-engine converte com `Number(mm)`. **Avaliação: aceito com condição.** A conversão string→double é monotônica e exata na escala persistida (`Decimal(6,1)` para matriz e limites — valores com 1 casa decimal têm representação distinta e ordem preservada em IEEE 754), então não há bug alcançável hoje. A exatidão porém depende de o grupo 4 **travar a escala nos DTOs** (limite/mm a 1 casa, conforme Recomendação 3 da review anterior): um limite persistido com escala maior reabriria a discussão. Registrar a decisão (ou adotar a assinatura string na extração futura).

**MIN-2 — Fallback silencioso de metadado de UF contradiz o contrato do arquivo**
`libs/calc-engine/src/lib/schedule/precipitation-calculator.ts:51-53`
`UF_METADATA_MAP[upperUf] ?? { name: upperUf, region: 'SUDESTE' }` inventa a região SUDESTE para uma UF presente na matriz configurada mas fora das 27 conhecidas. Inalcançável com parâmetros validados (`validateRainfallParameters` exige exatamente as 27 UFs), mas o próprio cabeçalho do arquivo declara "sem fallback" e o padrão da change é violação explícita, nunca default silencioso (RNF-09). Sugestão: lançar erro pt-BR como as demais guardas do arquivo, ou tipar `series.uf` como `BrazilianUf` no contrato e eliminar o `??`.

**MIN-3 — Transição do D2 na API: `scheduleStartDate` não é passado ao motor e toda resposta da API carrega o alerta de pendência**
`apps/api/src/contexts/schedule/application/usecases/get-line-schedule.usecase.ts:28-38` (e `field-factors.service.ts:31-46`)
O uso TEMPORÁRIO de `DEFAULT_RAINFALL_PARAMETERS`/`DEFAULT_WORK_CALENDAR` está bem sinalizado (comentário citando a task 4.3 — adequado). Porém o use case também **não repassa `scheduleStartDate`** (a porta `schedule-data-query.port.ts` não o expõe): até a task 4.3/4.4, todo cronograma servido pela API emite "Data de início do cronograma não informada..." **mesmo quando a revisão tem a data preenchida** — e nesse caso o texto "não informada" é impreciso. O alerta é transitório e a task 4.4 cobre a propagação, mas o comentário do desvio consciente deveria mencionar também essa segunda lacuna, para que a task 4.3 não feche só o eixo dos catálogos. Nenhuma ação no motor; ação nas tasks 4.3/4.4.

**MIN-4 — Mensagem do mês parado atribui a causa exclusivamente aos fatores**
`libs/calc-engine/src/lib/schedule/schedule-calculator.ts:193`
"(fator de chuva ou calendário zerado)" — a produção efetiva também zera quando `nominal × equipes ÷ acesso` arredonda a 0,00 em 2 casas (ex.: nominal 0,004 com fatores neutros), caso em que a atividade estagna até o erro de 600 meses com diagnóstico enganoso. Cenário rebuscado (o guarda funciona e o erro de horizonte já manda verificar os parâmetros), mas a mensagem poderia ser neutra: "sem produção efetiva no período".

**MIN-5 — `PrecipitationUfData`/`PrecipitationMonthData` seguem com `number` (floats no JSON do endpoint de field-factors)**
`libs/domain/src/lib/field-factors/field-factors.types.ts:70-85` (consumido em `precipitation-calculator.ts:55-63`)
Contrato legado de exibição preservado pelo refit (mudar a forma quebraria a web) — dívida pré-existente, não introduzida pelo grupo, registrada porque o refit tocou o produtor. Exceção de RNF-08 na borda de apresentação; alinhar quando a tela de parâmetros de chuva (grupo 5) redefinir o consumo.

**Nota (não contabilizada)** — a fronteira 200 mm não é assertada no spec do calc-engine (`precipitation-calculator.spec.ts:79-87` cobre 100 e 300; 150 e 250 são interiores). Está coberta na domain (`rainfall-parameters.spec.ts`), onde a semântica da fronteira mora — sem ação.

## ✅ Destaques Positivos

- **Testes golden como artefato de decisão**: `schedule-duration-golden.spec.ts` reimplementa o método legado a partir do `getAverageProductivityFactor` preservado, prova a coincidência na fixture curta (7 = 7) e **quantifica o desvio na longa (21 → 23, +2 meses)** com o porquê comentado (janela fixa de 6 meses cega às estações chuvosas seguintes) — exatamente a evidência que o risco do design pediu para a decisão de paridade da F4.
- **Follow-ups da review anterior fechados de primeira**: `UF_METADATA_MAP` unificado na domain (MIN-4 anterior) e `band-position-duplicated` com teste (MIN-2 anterior).
- **RNF-09 exemplar na ancoragem**: ausência e invalidez de `scheduleStartDate` são pendências distintas com mensagens pt-BR distintas; `2027-02-30` não sofre rollover (usa `isValidCivilDate` da domain, lição recorrente de datas do projeto) e o summary devolve `scheduleStartDate: undefined` em vez de propagar a data inválida.
- **Guarda anti-loop correta na ordem certa**: entrada do breakdown registrada antes do guarda (mês parado aparece no plano com 0,00), horizonte de 600 meses testado, alerta por mês pulado em `statusNotes` E `warnings` globais.
- **RN-15 com semântica precisa**: pico do `plannedProduction` (não do `effectiveProduction`) — o último mês parcial não gera falso positivo de sobreprodução; caminho linear intocado para duração fixada.
- **`FIXED_COST_GROUPS` nomeado** substituiu três comparações inline duplicadas de grupo — pequena melhoria de manutenção aproveitando o refit.
- **Contrato `ActivityMonthlyPlanEntry` bem documentado** (civilYear/civilMonth opcionais só com ancoragem; planned ≤ effective comentado no próprio campo) e todos os valores como strings decimais (RNF-08).
- **Formatação limpa de primeira** (Prettier ok nos 11 arquivos, sem BOM) — segunda entrega de motor consecutiva sem o major histórico de format:check.

## Conformidade com Padrões

| Padrão | Status |
|--------|--------|
| Padrões de Código | ✅ Ok |
| Typescript/Node.js | ✅ Ok (`any` remanescentes em `ScheduleCalculationInput.quantitySource`/`predecessors.type` são pré-existentes, não introduzidos) |
| Decimal nunca float (RNF-08) | ✅ Ok no caminho de cálculo (MIN-1 aceito com condição; MIN-5 dívida pré-existente de exibição) |
| Determinismo do motor (RNF-04/RNF-16) | ✅ Ok (nenhum relógio/aleatoriedade; parâmetros injetados; datas via funções puras da domain) |
| null ≠ zero / pendência explícita (RNF-09) | ✅ Ok (UF desconhecida = throw; data ausente/ inválida = alerta; mês zerado = alerta) |
| Mensagens/comentários pt-BR, código em inglês | ✅ Ok |
| Testes | ✅ Ok (92 verdes no calc-engine; cenários do delta cobertos um a um; golden de desvio) |
| Formatação | ✅ Ok |

## Recomendações

1. (Task 4.1/4.2 — condição do MIN-1) Travar a escala nos DTOs dos parâmetros de chuva: limites e mm a 1 casa (`Decimal(6,1)`), fator a 4 casas (`Decimal(5,4)`) — é o que mantém a comparação via `Number()` exata na fronteira de faixa. Registrar em comentário no `classifyRainfallBand` que a exatidão depende da escala persistida, ou adotar a assinatura string na próxima passada.
2. (Task 4.3/4.4 — MIN-3) Ao resolver a versão vigente dos catálogos, expor `scheduleStartDate` na porta `schedule-data-query.port.ts` e repassar ao motor; testar que oferta com data preenchida NÃO emite o alerta de pendência e que a resposta o propaga quando ausente (já previsto na task 4.4).
3. (Oportunista, grupo 4) Trocar o fallback de metadado de UF por erro explícito ou tipagem `BrazilianUf` no contrato (MIN-2) e neutralizar a causa na mensagem do mês parado (MIN-4) — mudanças de poucas linhas.
4. (Task 6.2) Usar os números dos golden (+2 meses na fixture longa) como referência ao documentar os desvios esperados nos módulos a jusante (histograma, desembolso, resultado econômico).

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero críticos e zero majors. O refit cumpre integralmente as tasks 3.1–3.4 e o delta de spec `cronograma`, com a paridade tratada por testes golden que quantificam o desvio do método legado — e o método antigo preservado de forma auditável para essa comparação. Os 5 minors não bloqueiam: MIN-1 e MIN-3 têm ponto natural de resolução no grupo 4 (com condições explícitas registradas), MIN-2/MIN-4 são correções de poucas linhas, MIN-5 é dívida pré-existente. Pode prosseguir para o grupo 4 (API).
