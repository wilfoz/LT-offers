# Review do Grupo 2 — API: contexto viability e campo na revisão

**Revisor**: AI Code Reviewer
**Data**: 2026-09-29
**Change / Grupo**: viabilidade-lote-licitante / grupo 2 (tasks 2.1–2.5)
**Status**: Aprovado com observações

## Resumo

O grupo entrega o contexto hexagonal `viability` completo (3 portas com tokens, 3 use cases puros, 3 adapters Prisma, controller com DTOs e módulo registrado no app e no `context-modules-di.spec.ts`) e o trilho integral do `bidderCapex` no contexto offers (entidade, DTOs, mapper, 3 repositórios, 4 use cases, presenter, paridade DTO × contrato). Migration e schema vieram no commit do grupo 1 (`4c51a79`), como previsto.

Qualidade geral muito alta: os valores canônicos do spec são reassertados fim a fim no nível dos use cases (`365080751.22` / `496657825.69` / `34.88`), a resolução de parâmetros pela **data da oferta** (e não pela data atual) tem teste dedicado, e as duas dívidas estruturais herdadas do padrão de módulos ("exports além da fachada" e "adapter registrado classe+token = 2 instâncias") foram **evitadas de primeira** neste módulo. Único major: a validação de **escala 2** do `bidderCapex`, prometida na task 2.4 e no design D4, não foi implementada (o DTO usa só `POSITIVE_DECIMAL_PATTERN`, sem limite de casas — arredondamento silencioso no `Decimal(16,2)`).

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `contexts/viability/domain/ports/tokens.ts` | ✅ Ok | 0 |
| `contexts/viability/domain/ports/viability-parameters.repository.ts` | ✅ Ok | 0 (omissão de `list()` — ver MIN-1) |
| `contexts/viability/domain/ports/viability-auction-stats.port.ts` | ✅ Ok | 0 |
| `contexts/viability/domain/ports/viability-offer-query.port.ts` | ⚠️ Problemas | 1 minor (MIN-5) |
| `contexts/viability/domain/exceptions/viability.exceptions.ts` | ✅ Ok | 0 |
| `contexts/viability/application/usecases/*.usecase.ts` (3) | ✅ Ok | 0 |
| `contexts/viability/application/usecases/usecases.spec.ts` | ✅ Ok | lacunas pontuais (MIN-8) |
| `contexts/viability/infrastructure/adapters/prisma-viability-parameters.repository.ts` | ⚠️ Problemas | 2 minors (MIN-4, MIN-9) |
| `contexts/viability/infrastructure/adapters/prisma-viability-auction-stats.adapter.ts` | ✅ Ok | 0 |
| `contexts/viability/infrastructure/adapters/prisma-viability-offer-query.adapter.ts` | ✅ Ok | 0 |
| `contexts/viability/infrastructure/dto/viability-parameters.dto.ts` | ✅ Ok | 0 (análise do `DecimalUpTo100` abaixo) |
| `contexts/viability/infrastructure/controllers/viability.controller.ts` | ⚠️ Problemas | 2 minors (MIN-6, MIN-7) |
| `contexts/viability/infrastructure/controllers/viability.controller.spec.ts` | ✅ Ok | 0 |
| `contexts/viability/infrastructure/viability.module.ts` | ✅ Ok | dívida herdada conhecida (PrismaService re-provido) |
| `app/app.module.ts` + `app/context-modules-di.spec.ts` | ✅ Ok | 0 |
| Trilho offers do `bidderCapex` (10 arquivos) | ⚠️ Problemas | 1 major (MAJ-1) |
| `README.md` (mapa canônico) | ⚠️ Problemas | 1 minor (MIN-2 — pendência MIN-4 do grupo 1) |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

**MAJ-1 — `bidderCapex` sem validação de escala 2, contra a task 2.4 e o design D4** (`create-offer.dto.ts:143-148`, `update-offer-revision.dto.ts:116-122`)

A task 2.4 promete "decimal ≥ 0 **escala 2**, mensagem pt-BR" e o design D4 prescreve "`POSITIVE_DECIMAL_PATTERN` **+ escala 2**". O DTO implementou apenas o pattern (`/^\d+(\.\d+)?$/`, escala ilimitada): `'4110000000.005'` passa a validação e o Postgres arredonda em silêncio para `4110000000.01` no `Decimal(16,2)` — o valor persistido difere do informado sem erro nem aviso, exatamente a classe de problema que a disciplina decimal do projeto (RNF-08) policia. A coluna não participa de unique, então não há o risco de colisão pós-arredondamento da lição series-torres — o dano é só o arredondamento silencioso.

Atenuante real: o campo espelha **exatamente** os três irmãos pré-existentes (`estimatedCapex`/`maxRap`/`winningRap`), que têm a mesma lacuna — a simetria é defensável. Mas a task/design registraram a escala 2 explicitamente, e o campo é novo (sem compatibilidade a preservar).

Correção sugerida (sem tocar os irmãos nesta change):

```ts
@IsOptional()
@Validate(DecimalWithScale, [2], {
  message:
    'O investimento do licitante deve ser um número decimal não negativo com até 2 casas',
})
bidderCapex?: string | null;
```

E registrar o alinhamento dos três campos legados (mesma coluna `Decimal(16,2)`) como cleanup de change futura — mudar o contrato deles agora alteraria comportamento aceito da API fora do escopo. Alternativa: se a simetria for decisão consciente, atualizar task 2.4/design D4 removendo a promessa de escala — mas aí o arredondamento silencioso fica sancionado.

### 🟢 Problemas Minor

**MIN-1 — Design D3 promete `list()` no repositório; omitido deliberadamente** (`viability-parameters.repository.ts`)

Avaliação do ponto 1 solicitado: a omissão é **aceitável e correta** — nenhum consumidor existe (a tela do grupo 3, pelo design D5, mostra só a versão vigente; "histórico não é objetivo da tela"), e interface sem implementação consumida seria código morto especulativo. O problema é só a coerência dos artefatos: o design D3 lista `list()` como parte do contrato. Ajustar o design (remover ou marcar como "se a tela do grupo 3 precisar") via `/opsx:update` — artefato e código não devem divergir em silêncio.

**MIN-2 — Pendência MIN-4 do grupo 1 NÃO endereçada: célula `viability` do README sem qualificador** (`README.md:303`)

A resolução registrada na review do grupo 1 dizia "célula viability do README — qualificar **no grupo 2**", e o grupo 2 materializou a rota `/viability` — o gatilho combinado disparou. A linha segue `` `ViabilityAssessment` / `viability` `` sem o qualificador (ex.: `` `viability` (contexto/rota) ``), destoando das demais linhas onde o segundo termo é tabela snake_case. Correção de uma linha; fazer antes do commit (atenção à armadilha do Prettier: célula mais larga que a coluna realinha a tabela inteira).

**MIN-3 — Reuso cross-context da infra de catalogs: regra das três disparou** (`viability.controller.ts:22-28`, `viability-parameters.dto.ts:12-15`)

Avaliação do ponto 2 solicitado: **aceitável como está** — `schedule` e `auction-history` já importam `controller-shared`/`decimal-scale.validators`/`CivilDate` de `contexts/catalogs`; viability é o **3º contexto** a fazê-lo, seguindo precedente estabelecido. Mas com a 3ª ocorrência a regra das três do workspace dispara: esses helpers são kit de borda HTTP compartilhado, não infra "de catálogos" — registrar a extração (ex.: `apps/api/src/shared/http/`) para a próxima change que os tocar. Não bloquear este grupo por isso.

**MIN-4 — `new Date(string)` cru no repositório de parâmetros, divergindo do helper `toDbDate` do precedente** (`prisma-viability-parameters.repository.ts:29,41`)

O adapter schedule-parameters (o "padrão" citado na task 2.1) usa `toDbDate(isoDate)` = `new Date(`${isoDate}T00:00:00.000Z`)` — UTC explícito. Aqui, `new Date(referenceDate)` e `new Date(version.effectiveFrom)`. Para os inputs atuais é **equivalente** (strings date-only validadas por `CivilDate`/`DATE_PATTERN` são interpretadas como meia-noite UTC pela spec ES), então não há bug — mas a forma é frágil (um datetime que vazasse seria interpretado em hora local, a armadilha recorrente de datas do projeto) e inconsistente com o precedente. Sufixar `T00:00:00.000Z` como no schedule.

**MIN-5 — `lotNumber` no contrato da porta é buscado e nunca usado** (`viability-offer-query.port.ts:13`, `prisma-viability-offer-query.adapter.ts:28`)

O use case só consome `auctionNumber` da identidade; `lotNumber` não entra no `assessViability` nem na resposta. Campo morto no contrato — remover, ou consumi-lo (ex.: benchmark por lote) quando houver requisito. YAGNI.

**MIN-6 — Import duplicado de `@nestjs/common` no controller** (`viability.controller.ts:23`)

`BadRequestException` importado em statement separado (linha 23) quando o bloco principal de `@nestjs/common` (linhas 1-16) já existe. ESLint/Prettier não acusam; fundir no bloco principal.

**MIN-7 — Fallback 500 do `handleViabilityError` engole o erro original sem log** (`viability.controller.ts:60-64`)

Não vazar a mensagem crua no 500 é um **avanço** sobre o handler de catalogs (que degrada para 400 com `error.message`), mas o erro original desaparece sem rastro — um bug de adapter em produção viraria "Erro interno ao processar a viabilidade do lote." sem causa raiz em lugar nenhum. Adicionar `Logger.error(error)` (escopo `ViabilityController`) antes de lançar o 500.

**MIN-8 — Lacunas pontuais de teste no nível da API** (`usecases.spec.ts`, `viability.controller.spec.ts`)

- A origem **`BIDDER`** nunca é exercitada no fluxo da API (o `usecases.spec` só cobre `bidderCapex: null` → `ANEEL_ESTIMATE`). O branch vive em `assessViability` e está coberto na domain (grupo 1), então o risco real é baixo — mas um teste com `bidderCapex` informado no mock da porta travaria a passagem do campo pelo trilho novo (é o cenário-título do M13).
- `GET /viability/parameters?effectiveOn=2027-02-30` (data civil inválida em **GET**) não tem teste — o mapeamento `InvalidCivilDateException → 400` só é exercitado via POST; o GET compartilha o handler, cobertura indireta aceita.
- O mapeamento `ViabilityRevisionNotFoundException → 404` no controller não é assertado diretamente (coberto por transitividade: o use case testa a exceção, o handler testa o irmão `NoEffective...` → 404).

**MIN-9 — Comentário impreciso no catch de P2002** (`prisma-viability-parameters.repository.ts:55`)

"concorrência entre check e insert" — não há check prévio neste repositório; o P2002 é a **única** guarda (o que é bom: sem janela check-then-create). Ajustar o comentário (ex.: "unique de vigência: 409 via P2002, sem check prévio").

## Análise dos pontos solicitados

**Ponto 3 — `DecimalUpTo100` (`Number(value) <= 100`): sem brecha.** Os validadores do class-validator rodam todos, independentemente da ordem — a aprovação exige passar em `DecimalWithScale` **e** `DecimalUpTo100` simultaneamente. Varredura de bordas: `NaN <= 100` é `false` (não decimal reprova nos dois); `Number('') = 0` passaria no ≤100 mas `''` reprova no `DecimalWithScale`; `'1e2'`/`' 50 '`/`'0x1F'` idem (Number coage, pattern rejeita); `'-1'` passa no ≤100 mas o pattern `^\d+` rejeita negativo; `'1e400'` → Infinity reprova. Nenhum valor inválido passa. Único cosmético: entrada não decimal (ex.: `'abc'`) acumula **duas** mensagens no mesmo campo (formato + "no máximo 100%") — 1 `ValidationError` com 2 constraints; o teste de paridade asserta por propriedade, então segue válido. `'100.00'` exato é aceito no DTO e vira `minimumGrossRap: null` na derivação — coerente com o spec ("fora de 0 a 100%" rejeita; 100 exato é domínio da matemática, testado no grupo 1).

**Ponto 5 — `GetViabilityAssessmentUseCase` × cenários de benchmark: consistente.** `auctionNumber` null → `findByAuction` não é chamado (assertado com `not.toHaveBeenCalled()`) e `auctionStats: null`; leilão sem lotes no snapshot → `null` (o spec diz "quando houver"); `overallStats` sempre calculado ("e da base histórica completa" — sem condicional no spec), com `auctionBenchmark([])` devolvendo o benchmark vazio tipado se o snapshot inteiro estiver vazio. `Promise.all` paraleliza as duas consultas. A resolução dos parâmetros pela data da oferta (não pela atual) tem teste dedicado com duas versões vigentes.

**Ponto 6 — Cobertura dos cenários do spec delta (recorte API):**

| Cenário do spec | Cobertura |
|---|---|
| Edição cria versão preservando histórico | ✅ `usecases.spec` (duas versões, resolução por data) |
| Resolução pela data da oferta | ✅ teste dedicado (versão nova em 2026-09-15 não afeta oferta de 2026-09-01) |
| Vigência duplicada → 409 | ✅ mensagem exata no use case + `ConflictException` no controller |
| Sem vigência → 404 | ✅ mensagem exata + `NotFoundException` |
| PUT/PATCH → 405 imutável | ✅ dois métodos separados (lição METHOD_METADATA respeitada) |
| Data civil inválida → 400 | ✅ `2027-02-30` round-trip com mensagem exata (POST; GET indireto — MIN-8) |
| Validação dos parâmetros (WACC 0, prazo 0, fator >100) | ✅ paridade 1-erro-por-campo (6 campos) + mensagens exatas |
| Parecer canônico (anuidade/RAP mín/34.88) | ✅ reassertado fim a fim no use case |
| Origem ANEEL_ESTIMATE (fallback) | ✅ cenário canônico |
| Origem BIDDER | ⚠️ só na domain (grupo 1) — MIN-8 |
| missingInputs (nunca zero) | ✅ `['ESTIMATED_WINNING_RAP']` assertado |
| Revisão inexistente → 404 | ✅ tipo + mensagem exata citando proposta e revisão |
| `bidderCapex` gravado/limpo (spec ofertas) | ✅ paridade nos 2 DTOs; normalização undefined/null/'' no update |

## ✅ Destaques Positivos

- **As duas dívidas do padrão de módulos foram evitadas de primeira**: `exports: []` com comentário de fronteira (contra o padrão herdado de exportar tokens+use cases) e adapters registrados **só** sob o token (`useClass`) — sem a dupla instância classe+token dos módulos pricing/taxation. Este módulo é o novo exemplar a apontar.
- **Use cases livres de framework**: classes puras sem decorator, fiação via `useFactory`+`inject` de tokens — imunes por construção à armadilha do paramtype `Object` (união no construtor), e ainda assim cobertos pelo `context-modules-di.spec.ts` com DI real.
- **Valores canônicos reassertados na camada de aplicação**: o parecer da oferta-mestre (`365080751.22` / `496657825.69` / `34.88` / `viableAtMaxRap: true` / `missingInputs`) é travado de novo no use case com `InMemoryParametersRepository` — regressão em qualquer ponto do encadeamento domain→use case estoura aqui.
- **P2002 por `instanceof Prisma.PrismaClientKnownRequestError`** — tipagem mais forte que o cast `(error as { code: string })` do adapter schedule; sem check-then-create (a unique é a única guarda, zero janela de corrida).
- **Fallback 500 sem vazar mensagem crua** (RNF-14) — melhora sobre o handler de catalogs; só falta o log (MIN-7).
- **Trilho `bidderCapex` completo e simétrico**: os 3 pontos de escrita Prisma, clone e nova revisão carregando o valor, normalização undefined-ignora/null-limpa/''-vira-null comentada no ponto exato, presenter com `toFixed(2)`, e a paridade DTO × contrato estendida nos **dois** DTOs (`'quatro bilhões'` → 1 erro por campo) — o modo de falha silencioso da whitelist (lição foundation-volumes) segue vigiado.
- **Higiene impecável**: BOM ausente nos 18 arquivos novos (verificado byte a byte), código em inglês com comentários/mensagens/testes pt-BR, mensagens exatas assertadas, `X-User` com fallback `sistema` testado, ids de query validados com regex `^[1-9]\d*$` e mensagens pt-BR (sem o `ParseIntPipe` default em inglês).

## Conformidade com Padrões

| Padrão | Status |
|--------|--------|
| Padrões de Código | ✅ Ok (arquivos dentro dos limites; MIN-6/MIN-9 cosméticos) |
| Typescript/Node.js | ✅ Ok (sem `any`; contratos da domain em todas as fronteiras) |
| Angular/NestJS/React | ✅ Ok (PUT/PATCH em métodos separados; DI real testada) |
| REST/HTTP | ⚠️ Problemas (MAJ-1: escala 2 prometida e não validada no `bidderCapex`) |
| Testes | ✅ Ok (39 testes nos 4 specs tocados, verdes; lacunas pontuais em MIN-8) |
| Logging/Monitoramento | ⚠️ Problemas (MIN-7: 500 genérico sem log da causa raiz) |

Verificações executadas nesta review: `jest --testPathPatterns "viability|offers-dto-parity|context-modules-di"` (4 suítes / 39 testes verdes), checagem de BOM byte a byte nos 18 arquivos do contexto, comparação com os adapters/controllers do precedente schedule-parameters, conferência do mapa canônico do README e do migration/schema (commitados no grupo 1). Suíte completa, lint, build e `format:check --all` já evidenciados pelo implementador (52 suítes / 318 testes).

## Recomendações

1. **(MAJ-1, antes do commit)** Adicionar `@Validate(DecimalWithScale, [2])` ao `bidderCapex` nos dois DTOs (campo novo, sem compatibilidade a preservar) e estender o teste de paridade com um caso de escala (`'100.005'` → 1 erro); registrar o alinhamento dos três campos financeiros legados como cleanup de change futura. Se preferir manter a simetria sem escala, atualizar task 2.4/design D4 para não sancionar o arredondamento silencioso em silêncio.
2. **(MIN-2, antes do commit)** Qualificar a célula `viability` do README (`README.md:303`) — pendência registrada do grupo 1 cujo gatilho ("quando a rota existir") disparou neste grupo.
3. **(MIN-1, junto do commit)** Alinhar o design D3 à omissão deliberada de `list()` (remover do contrato ou condicionar ao grupo 3).
4. **(MIN-7 + MIN-4, baratos)** `Logger.error` no fallback 500 e sufixo `T00:00:00.000Z` nas duas conversões de data do repositório de parâmetros.
5. **(MIN-8, oportunista)** Teste do parecer com `bidderCapex` informado → origem `BIDDER` no `usecases.spec` — é o cenário-título do M13 e trava o trilho novo fim a fim.
6. **(MIN-3, registrar)** Extração do kit de borda HTTP (`controller-shared` + `decimal-scale.validators` + `CivilDate`) para fora de `contexts/catalogs` na próxima change que o tocar — 3ª ocorrência de import cross-context, regra das três disparada.
7. **(MIN-5/MIN-6/MIN-9, oportunistas)** Remover `lotNumber` morto da porta, fundir o import duplicado e corrigir o comentário do P2002.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero críticos. O contexto viability é a implementação mais limpa do padrão hexagonal no projeto até aqui (fronteira fechada, use cases puros, dívidas herdadas evitadas), a cobertura dos cenários do spec no recorte da API é quase completa e as decisões conscientes questionadas (omissão de `list()`, reuso cross-context, `DecimalUpTo100`) resistem ao escrutínio. Recomendo aplicar os itens 1 e 2 (escala 2 do `bidderCapex` + célula do README — ambos de minutos) **antes do commit do grupo**; os demais podem seguir como observações para os grupos 3-4.


## Resolução (pós-review)

- **MAJ-1** — `bidderCapex` nos dois DTOs de ofertas passou de `@Matches(POSITIVE_DECIMAL_PATTERN)` para `@Validate(DecimalWithScale, [2])` com mensagem "…com até 2 casas"; teste de regressão novo em `offers-dto-parity.spec.ts` assertando a constraint `decimalWithScale` com a mensagem exata para `4110000000.005`. Os irmãos legados (estimatedCapex/maxRap/winningRap) seguem sem escala — cleanup registrado para change futura.
- **MIN-1** — design D3 ajustado: repositório documentado sem `list()` enquanto não houver consumidor (a tela do D5 mostra só a vigente).
- **MIN-2** — README linha 303: célula qualificada como "rota `/viability`" (MIN-4 do grupo 1 encerrado).
- **MIN-3** — extração de kit de borda HTTP compartilhado (3º contexto importando `controller-shared`/`decimal-scale.validators`/`CivilDate` de catalogs) fica registrada para change futura; sem ação neste grupo.
- **MIN-5 (`new Date` cru no repo de parâmetros)** — mantido: `new Date('AAAA-MM-DD')` interpreta UTC-midnight, correto para coluna `@db.Date`; alinhamento com helper compartilhado fica para a extração do MIN-3.
- **MIN-6** — fallback 500 do controller agora faz `logger.error(error)` antes de responder (1º uso de `Logger` nos contextos; padrão a replicar nos demais catch-all quando tocados).
- **MIN-7 (`lotNumber` morto)** — removido da porta `ViabilityRevisionFinancials`, do select do adapter e da fixture do spec.
- **MIN-8** — teste novo no use case: `bidderCapex` informado prevalece sobre a estimativa ANEEL (origem `BIDDER` assertada no nível da API).
- Import duplicado de `@nestjs/common` no controller mesclado; comentário do catch P2002 corrigido (não há check-then-create).

Reverificação: `npx nx run-many -t test lint build -p api domain --skip-nx-cache` verde (api 320 testes, domain 171), `npx nx format:check --all` limpo.