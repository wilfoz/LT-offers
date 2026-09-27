# Review do Grupo 4 — API (catálogos de configuração do cronograma)

**Revisor**: AI Code Reviewer
**Data**: 2026-09-27
**Change / Grupo**: cronograma-chuva-feriados-configuraveis / grupo 4 (tasks 4.1–4.4)
**Status**: APROVADO COM OBSERVAÇÕES

## Resumo

O grupo entrega os quatro endpoints de configuração (`GET/POST /schedule-parameters/rainfall` e `/schedule-parameters/work-calendar`) sobre uma porta nova do contexto `schedule` (`ScheduleParametersPort`, catálogos singleton do design D1), com validação estrutural delegada às funções puras da domain (violações tipadas traduzidas para pt-BR na borda em `schedule-parameters-messages.ts`), adapter Prisma com resolução de vigência `lte`+`desc`, nested create atômico e P2002 → 409 com mensagem distinta por catálogo. O `GetLineScheduleUseCase` remove o TEMPORÁRIO do grupo 3: resolve as versões vigentes pela `referenceDate` da oferta (offerDate) e repassa `scheduleStartDate` ao motor — as duas condições herdadas da review do grupo 3 (MIN-1 escala travada nos DTOs e MIN-3 porta expondo `scheduleStartDate`) foram **atendidas e testadas**, e os dois oportunistas (MIN-2 fallback de UF → throw; MIN-4 mensagem neutra do mês parado) também foram fechados. `field-factors` passou a resolver a versão vigente via use case do `ScheduleModule` com `?effectiveOn=` na borda.

Zero problemas críticos; **1 major**: os endpoints GET de precipitação do `field-factors` não mapeiam as exceções de domínio novas — `?effectiveOn=2027-02-30` e data sem versão vigente respondem **500 Internal Server Error** em vez de 400/404 pt-BR (confirmado ao vivo). 6 minors. Suítes verdes sem cache (api 45 suítes/249 testes, +2/+25 sobre o grupo 3), lint 0 erros (nenhum warning em arquivo do grupo), Prettier limpo nos 26 arquivos, sem BOM nos 11 novos, migrations em dia. Smoke real executado nos 4 endpoints novos + `GET /api/lines/17/schedule/summary` (todos os cenários dos specs conferidos ao vivo; versões de teste criadas no smoke foram removidas do banco ao final).

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| contexts/schedule/domain/ports/schedule-parameters.port.ts | ✅ Ok | 0 |
| contexts/schedule/domain/ports/schedule-data-query.port.ts | ✅ Ok | 0 |
| contexts/schedule/domain/ports/tokens.ts, index.ts | ✅ Ok | 0 |
| contexts/schedule/domain/exceptions/schedule-parameters.exceptions.ts | ⚠️ Problemas | 1 minor |
| contexts/schedule/application/usecases/rainfall-parameters.usecases.ts | ✅ Ok | 0 |
| contexts/schedule/application/usecases/work-calendar.usecases.ts | ✅ Ok | 0 |
| contexts/schedule/application/usecases/schedule-parameters-messages.ts | ✅ Ok | 0 |
| contexts/schedule/application/usecases/get-line-schedule.usecase.ts | ✅ Ok | 0 |
| contexts/schedule/application/usecases/usecases.spec.ts | ✅ Ok | 0 |
| contexts/schedule/infrastructure/adapters/prisma-schedule-parameters.adapter.ts | ⚠️ Problemas | 2 minors |
| contexts/schedule/infrastructure/adapters/prisma-schedule-data-query.adapter.ts | ✅ Ok | 0 |
| contexts/schedule/infrastructure/controllers/schedule-parameters.controller.ts | ✅ Ok | 1 nota |
| contexts/schedule/infrastructure/controllers/schedule-parameters.controller.spec.ts | ✅ Ok | 0 |
| contexts/schedule/infrastructure/dto/create-rainfall-parameters-version.dto.ts | ✅ Ok | 0 |
| contexts/schedule/infrastructure/dto/create-work-calendar-version.dto.ts | ⚠️ Problemas | 1 minor |
| contexts/schedule/infrastructure/dto/schedule-parameters-dto-parity.spec.ts | ✅ Ok | 1 nota |
| contexts/schedule/infrastructure/schedule.module.ts | ⚠️ Problemas | 1 minor |
| contexts/schedule/infrastructure/controllers/schedule.controller.ts (não alterado) | ⚠️ Problemas | 1 minor (novo modo de falha) |
| field-factors/field-factors.controller.ts | ❌ Major | 1 major |
| field-factors/field-factors.service.ts | ✅ Ok | 0 |
| field-factors/field-factors.module.ts | ✅ Ok | 0 |
| field-factors/field-factors.controller.spec.ts | ✅ Ok | 0 |
| app/context-modules-di.spec.ts | ✅ Ok | 0 |

## Verificações Executadas

| Verificação | Resultado |
|-------------|-----------|
| `npx nx run-many -t test lint -p api --skip-nx-cache` | ✅ 45 suítes / 249 testes verdes; lint 0 erros (240 warnings pré-existentes; nos diretórios do grupo só os 4 `any` pré-existentes do data-query adapter e do schedule.controller.spec) |
| `npx prettier --check` nos 26 arquivos alterados | ✅ todos no estilo |
| BOM UTF-8 nos 11 arquivos novos (`head -c3 \| od`) | ✅ ausente |
| `npx prisma migrate status` | ✅ 14 migrations, schema em dia |
| Smoke real (nx serve api, banco com seed) | ✅ GET rainfall/work-calendar vigentes; `?effectiveOn=2019-01-01` → 404 pt-BR; `?effectiveOn=2027-02-30` → 400 pt-BR; POST fator "1.2" → 400 "entre 0 e 1"; limite "49.95" → 400 de escala; matriz sem BA → 400 identificando a UF; criação válida (201, autor do X-User) → 409 na duplicata → vigência 2099-12-30 resolve v1 e 2099-12-31 resolve v2; PUT/PATCH → 405; feriado 2027-02-30 → 400 sem rollover; `GET /api/lines/17/schedule/summary` → 200 sem alerta de pendência, breakdown com fatores mensais (mês 2 do projeto → agosto/2026, calendarFactor 0,9545 = 21/22 conferido) — ❌ exceto field-factors (M1 abaixo). Versões de smoke removidas do banco ao final |
| Condições herdadas do grupo 3 | ✅ MIN-1: escala travada nos DTOs (`DecimalWithScale [1]` p/ mm e limites, `[4]` p/ fator, `PositiveNonZeroDecimal [2]` p/ dias padrão) com comentário registrando o porquê (49.95 → erro, não arredondamento silencioso) e teste de paridade usando exatamente `'49.95'`; ✅ MIN-3: porta expõe `referenceDate` (obrigatório) e `scheduleStartDate` (opcional), use case repassa ao motor, testes cobrem "com data não emite pendência" e "sem data propaga alerta"; ✅ oportunistas MIN-2 (fallback de metadado de UF → throw pt-BR) e MIN-4 (mensagem neutra "sem produção efetiva") também fechados |
| DI (ponto 5 do escopo) | ✅ não piorou: `ScheduleModule` já re-provia `PrismaService` (dívida conhecida ×6); nenhum provider novo de PrismaService; adapter novo usa `@Inject(PrismaService)` com união de tipos (lição pricing-taxation aplicada); `FieldFactorsModule` incluído no teste permanente de DI com a cadeia `FieldFactorsModule → ScheduleModule` completa |

## Análise dos Pontos Solicitados

1. **Cross-context import (schedule → catalogs)**: o lint de fronteiras aceita — as `depConstraints` do Nx operam por tag de projeto (`scope:app` etc.), não por contexto dentro da api; lint 0 erros. Não há alternativa melhor disponível hoje: `CivilDate`, `controller-shared` e os validadores de escala vivem apenas no contexto catalogs, e a task 4.1 sanciona a reutilização (design D1: "reutilizando apenas as peças que servem"). Com este grupo o catalogs passa a ter **2 consumidores externos** (schedule e field-factors) — na 3ª ocorrência, extrair essas peças transversais (CivilDate, resolveAuthor/resolveReferenceDate, validadores de escala, mensagens) para um módulo compartilhado da api (ou libs), pela regra das três ocorrências.
2. **Cenários dos specs**: todos cobertos por teste e/ou smoke — edição cria versão preservando histórico (create imutável + 409 + resolução por vigência conferida ao vivo com v1/v2); resolução por data de referência (teste de controller e de use case com a `referenceDate` da oferta); fator > 1 rejeitado (400 pt-BR, teste da domain + smoke); matriz incompleta identifica a UF (teste com asserção da mensagem exata + smoke); 2027-02-30 rejeitada sem rollover em três bordas (`effectiveOn` de consulta, `effectiveFrom` de criação via CivilDate round-trip e data de feriado via domain); recorrente vs por ano e escopo UF são semântica do motor/domain (grupos 2–3) — a API persiste e devolve `recurring`/`uf` fielmente (smoke com feriado estadual BA recorrente).
3. **Adapter**: mapeamento correto e sem fuso — `toDbDate` fixa meia-noite UTC (convenção `@db.Date`) e `toIsoDate` faz `toISOString().slice(0,10)`; como `offerDate`/`scheduleStartDate`/`holiday.date`/`effectiveFrom` são todos `@db.Date` e nenhum `new Date()` de relógio participa, a janela BRT 21h–24h não é alcançável. Decimal→string via `.toString()` (nota: solta zeros à direita — "22.00" volta "22"; ver Recomendação 5). Nested create atômico (bandas + 27 linhas UF numa operação). P2002 → `DuplicateScheduleParametersDateException` com mensagem distinta por catálogo, assertada por mensagem exata (lição series-torres). `ITEM_INCLUDE satisfies Prisma.XInclude` + `GetPayload` no padrão foundation-types.
4. **HolidayDto.uf com null explícito**: razoável e mantido — espelha exatamente o contrato da domain (`uf: string | null`), coerente com RNF-09 (nacional é uma escolha explícita, não uma omissão) e com `validateWorkCalendar`, que compara `!== null`. Aceitar `undefined` criaria dois estados para "nacional" e um caminho não validado. O custo é só de mensagem: omissão responde a mesma mensagem de UF malformada, sem dizer que `null` é aceito (MIN-4).
5. **DI/PrismaService**: não piorou (ver tabela acima).
6. **Desvio `?referenceDate=` → `?effectiveOn=` (task 4.1)**: desvio consciente correto. O README canoniza "vigente em (consulta)" → `effectiveOn` e todos os 10+ catálogos existentes usam `?effectiveOn=`; seguir o texto literal da task criaria a única rota destoante da convenção. Registrar a grafia atual nos artefatos no archive (tasks.md/design.md ainda dizem `?referenceDate=`).

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

**M1 — Endpoints de precipitação do field-factors respondem 500 para `effectiveOn` inválida e para data sem versão vigente**
`apps/api/src/field-factors/field-factors.controller.ts:45, 56`
O controller chama `resolveReferenceDate(effectiveOn)` e o service propaga `NoEffectiveScheduleParametersException`, mas **nenhuma das duas exceções de domínio é mapeada** — ambas estendem `Error`, não `HttpException`, e viram 500 "Internal server error". Confirmado ao vivo: `GET /api/field-factors/precipitation/ufs?effectiveOn=2027-02-30` → 500 (deveria ser 400 pt-BR "Data inválida...", como responde o `/schedule-parameters/rainfall` para a mesma entrada) e `?effectiveOn=2019-01-01` → 500 (deveria ser 404 "Não há versão de parâmetros de chuva vigente..."). Viola RNF-14 (mensagem some, sobra inglês genérico) e o padrão de datas do projeto; é o mesmo grupo de rotas que a task 4.3 mandou migrar, então o modo de falha é novo deste grupo. Correção sugerida: envolver os dois handlers em try/catch delegando ao mesmo mapeador do controller novo (extrair `handleScheduleParametersError` para um módulo compartilhável ou repetir o mapeamento mínimo InvalidCivilDate→400 / NoEffective→404), com dois testes de controller:

```typescript
@Get('precipitation/ufs')
async getAllPrecipitationUfs(@Query('effectiveOn') effectiveOn?: string) {
  try {
    const refDate = resolveReferenceDate(effectiveOn);
    return await this.fieldFactorsService.getAllPrecipitationUfs(
      refDate.toIsoDateString(),
    );
  } catch (error) {
    handleScheduleParametersError(error);
  }
}
```

### 🟢 Problemas Minor

**MIN-1 — `GET /lines/:id/schedule/summary` também não mapeia `NoEffectiveScheduleParametersException` (500)**
`apps/api/src/contexts/schedule/infrastructure/controllers/schedule.controller.ts:28-33`
O `GetLineScheduleUseCase` agora pode lançar a exceção nova (oferta com `offerDate` anterior a 2020-01-01 ou banco sem seed), e o controller só mapeia `LineScheduleNotFoundException` — o resto sobe como 500 genérico, engolindo a mensagem pt-BR explícita. Menos alcançável que o M1 (o seed retroativo cobre as datas reais), mas o mapeamento é uma linha: `NoEffective...` → 404 (ou 422), com teste. Mesmo fix serve para o `field-factors` se o mapeador for extraído.

**MIN-2 — Adapter novo sem teste unitário; mapeamento posicional jan..dez duplicado com o seed**
`apps/api/src/contexts/schedule/infrastructure/adapters/prisma-schedule-parameters.adapter.ts:31-104` × `prisma/seed.ts:1123-1136`
Segue o precedente dos contextos hexagonais (nenhum adapter Prisma tem spec), mas este adapter carrega mais lógica que os demais: mapeamento posicional `MONTH_FIELDS` ↔ `monthlyMm[0..11]` (um mês trocado seria silencioso e numérico), Decimal→string, datas e P2002. A cobertura hoje é só o smoke manual desta review + QA futuro. Sugestão barata: teste dos mappers puros (`toRainfallRecord`/`toWorkCalendarRecord`) com linha Prisma fake usando `Prisma.Decimal` real, e round-trip create→record da série de 12 meses. A lista jan..dez agora tem 2 cópias (adapter + seed) — na 3ª, exportar da domain junto ao contrato.

**MIN-3 — Discriminador de exceção em pt-BR (`kind: 'chuva' | 'calendário'`)**
`apps/api/src/contexts/schedule/domain/exceptions/schedule-parameters.exceptions.ts:7, 18`
Valores de união com acento circulam como "código" pelas camadas (adapter e testes instanciam com `'calendário'`). Não é identificador, mas roça a convenção código-em-inglês. Sugestão: `kind: 'rainfall' | 'work-calendar'` com o rótulo pt-BR resolvido dentro da exceção (mapa de 2 entradas). Cosmético.

**MIN-4 — Omissão de `uf` no feriado responde mensagem que não menciona `null`**
`apps/api/src/contexts/schedule/infrastructure/dto/create-work-calendar-version.dto.ts:35-39`
Decisão de exigir `null` explícito avaliada e aprovada (ver Análise item 4), mas o payload sem a chave `uf` recebe "A UF do feriado deve ter duas letras maiúsculas (ex.: BA)" — o usuário não descobre que `uf: null` é o jeito de dizer "nacional". Enriquecer: "…ou nula para feriado nacional". Junto: o prefixo de validação aninhada (`holidays.0.` / `bands.0.`) reaparece nas mensagens — aceito pela mesma condição registrada em series-torres (a UI do grupo 5 deve validar por linha antes do submit; condição a verificar na review do grupo 5).

**MIN-5 — `isUniqueViolation` não discrimina o alvo do P2002**
`apps/api/src/contexts/schedule/infrastructure/adapters/prisma-schedule-parameters.adapter.ts:13-20`
O create aninhado do rainfall tem **3 uniques** (effective_from; version+position; version+uf) e qualquer um deles vira "Já existe uma versão ... com vigência em X". Hoje inalcançável: `validateRainfallParameters` rejeita posição/UF duplicadas antes do Prisma (a ordem validação→persistência é o que sustenta a mensagem) — mas a dependência é implícita. Registrar em comentário ou checar `error.meta.target` (lição do P2002 ambíguo de series-torres).

**MIN-6 — Export de use case cru contorna a fachada do contexto**
`apps/api/src/contexts/schedule/infrastructure/schedule.module.ts:44`
`exports: [ScheduleFacadeService, GetEffectiveRainfallParametersUseCase]` — o design hexagonal do projeto prevê a fachada como única superfície entre contextos (dívida "exports além da fachada" já registrada ×6 módulos; aqui ela cresce um item). Preferível: método `getEffectiveRainfallParameters(referenceDate)` na `ScheduleFacadeService` e `field-factors` consumindo a fachada. Poucas linhas; alinhar antes que o grupo 5 (web) fixe o consumo.

**Notas (não contabilizadas)**: (a) o fallback final de `handleCatalogDomainError` transforma qualquer erro desconhecido em 400 com a mensagem crua (falha de infraestrutura viraria 400 em inglês) — herdado da base de catálogos, não introduzido aqui; tratar na base se incomodar. (b) O teste de paridade DTO×contrato usa listas de campos mantidas à mão — o precedente aceita; derivar as chaves esperadas de um objeto completo do contrato da domain o tornaria à prova de campo novo esquecido.

## ✅ Destaques Positivos

- **Todas as condições herdadas do grupo 3 fechadas de primeira e com teste**: escala travada nos DTOs com o exemplo exato da condição (`'49.95'` no teste de paridade) e comentário explicando a fronteira histórica protegida; porta expõe `referenceDate`/`scheduleStartDate` e os testes cobrem os dois lados da pendência (com data não emite; sem data propaga). Os dois oportunistas (fallback de UF → throw; mensagem neutra do mês parado) também entraram.
- **PUT/PATCH em métodos separados** com comentário do porquê no controller — a lição do METHOD_METADATA (decoradores empilhados não criam duas rotas) aplicada e testada para os 4 handlers de 405.
- **Arquitetura de mensagens limpa**: domain devolve violações tipadas (union discriminada exaustiva — o `switch` sem `default` obriga o TypeScript a acusar código de violação novo sem tradução), borda traduz para pt-BR em um único lugar (`schedule-parameters-messages.ts`).
- **Datas sem fuso por construção**: nenhuma leitura de relógio fora de `resolveReferenceDate` (borda); `@db.Date` + meia-noite UTC + `slice(0,10)` round-trip em todos os pontos; 2027-02-30 rejeitado em três bordas distintas com mensagens pt-BR.
- **DI blindada**: `@Inject(PrismaService)` no adapter novo (lição da change pricing-taxation) e `FieldFactorsModule` adicionado ao teste permanente `context-modules-di.spec.ts` com comentário explicando a cadeia — exatamente o teste que pegaria a regressão de união de tipos.
- **Smoke integral batendo com os specs**: os números do summary ao vivo conferem manualmente (mês 2 do projeto → agosto/2026; fator de calendário 0,9545 = 21/22; fatores de chuva variando 1,0000 → 0,9500 → 0,8500 mês a mês na UF MS).
- **Testes de use case assertando a data exata de resolução** (`findEffectiveRainfall` chamado com a `offerDate` da oferta) — é o teste que materializa "oferta fechada reproduz seus números" (RNF-05).
- **Desvio consciente bem escolhido** (`?effectiveOn=` mantendo a convenção do README em vez do literal da task) e formatação limpa de primeira (terceira entrega consecutiva sem o major histórico de format:check).

## Conformidade com Padrões

| Padrão | Status |
|--------|--------|
| Padrões de Código | ✅ Ok (inglês no código, pt-BR nas mensagens/comentários/testes; MIN-3 cosmético) |
| Typescript/Node.js | ✅ Ok (zero `any` novo; `satisfies` + `GetPayload`; unions discriminadas exaustivas) |
| NestJS | ⚠️ Problemas (M1: exceções de domínio não mapeadas no field-factors → 500; MIN-1 idem no summary) |
| REST/HTTP | ✅ Ok nos endpoints novos (200/201/400/404/405/409 verificados ao vivo) |
| Decimal nunca float (RNF-08) | ✅ Ok (strings decimais no JSON, `Prisma.Decimal` no banco, escala travada nos DTOs) |
| Vigência/imutabilidade (RNF-05) | ✅ Ok (histórico imutável, 405 em PUT/PATCH, resolução lte+desc, seed retroativo resolve) |
| null ≠ zero / pendência explícita (RNF-09) | ✅ Ok (uf null explícito; matriz incompleta identifica a UF; pendência de scheduleStartDate propagada) |
| Testes | ⚠️ Problemas (cenários dos specs cobertos; falta cobertura dos modos de falha do field-factors — M1 — e do adapter — MIN-2) |
| Formatação | ✅ Ok (Prettier limpo, sem BOM) |

## Recomendações

1. **(M1, bloqueia produção)** Mapear `InvalidCivilDateException` → 400 e `NoEffectiveScheduleParametersException` → 404 nos dois endpoints de precipitação do `field-factors`, com testes de controller para os dois casos (o mock atual do use case facilita: basta `mockRejectedValue`).
2. (MIN-1) No mesmo passo, mapear `NoEffectiveScheduleParametersException` no `schedule.controller.ts` (summary) — extrair `handleScheduleParametersError` do controller novo para um ponto importável evita a terceira cópia.
3. (MIN-6) Expor `getEffectiveRainfallParameters` pela `ScheduleFacadeService` e remover o use case dos exports do módulo, antes que o grupo 5 fixe consumidores.
4. (MIN-2) Teste dos mappers do adapter com `Prisma.Decimal` real e round-trip da série de 12 meses; ao surgir a 3ª cópia da lista jan..dez, movê-la para a domain.
5. (Grupo 5) Lembrar que `Prisma.Decimal.toString()` solta zeros à direita ("22.00" → "22", "1.00" → "1") — a UI não deve assumir escala fixa nas strings devolvidas (mesma armadilha do falso negativo "5200.50 vs 5200.5" do QA de series-torres); e verificar a condição do prefixo aninhado (validação por linha antes do submit, MIN-4).
6. (Archive) Ajustar a grafia `?referenceDate=` → `?effectiveOn=` em tasks.md/design.md ao arquivar, registrando o desvio consciente.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero críticos; as tasks 4.1–4.4 estão integralmente entregues, os cenários dos dois specs de catálogo estão cobertos por teste e conferidos ao vivo, e as duas condições herdadas da review do grupo 3 foram atendidas com evidência. O único major (M1) é um mapeamento de exceção ausente em dois endpoints do `field-factors` — correção de poucas linhas com dois testes — que deve ser feito **antes do commit do grupo** (junto, se possível, do MIN-1 e do MIN-6, que compartilham o mesmo fix estrutural). Os demais minors não bloqueiam o avanço para o grupo 5.
