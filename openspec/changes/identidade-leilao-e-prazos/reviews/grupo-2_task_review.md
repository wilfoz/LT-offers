# Review do Grupo 2 — API, contexto offers (tasks 2.1–2.6)

**Revisor**: AI Code Reviewer
**Data**: 2026-09-28
**Change / Grupo**: identidade-leilao-e-prazos / grupo 2
**Status**: APROVADO COM OBSERVAÇÕES

## Resumo

O grupo entrega a identidade normalizada do leilão e os prazos do edital em toda a pilha da API (entidade → DTOs → mapper/repositórios → use cases → presenter), as transições `WON`/`IN_EXECUTION` com máquina de estados explícita e auditoria com status anterior/novo, e a correção do diff inventado do `freeze-baseline`. Qualidade alta: zero críticos, todas as lições institucionais aplicadas de primeira (paridade DTO × contrato, data civil com round-trip, mensagens pt-BR assertadas por igualdade exata, remoção dos `status as any`, BOM ausente, `format:check --all` limpo). Verificação local: 272/272 testes da api, lint api/domain e gate de formatação verdes (`--skip-nx-cache`).

Um único major: o `PUT` de revisão em rascunho aceita `subLotCode: ""` e persiste string vazia — divergência de normalização entre create (`|| null`) e update (`?? undefined`), violando a regra do spec "nunca convertidos em zero ou texto vazio" (RNF-09).

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `apps/api/src/contexts/offers/domain/entities/offer-revision.entity.ts` | ✅ Ok | 0 |
| `apps/api/src/contexts/offers/domain/exceptions/offer-domain.exceptions.ts` | ✅ Ok | 0 |
| `apps/api/src/contexts/offers/domain/ports/audit-trail.port.ts` (novo) | ✅ Ok | 0 |
| `apps/api/src/contexts/offers/infrastructure/audit/audit-service-trail.adapter.ts` (novo) | ✅ Ok | 0 |
| `apps/api/src/contexts/offers/infrastructure/offers.module.ts` | ✅ Ok | 0 |
| `apps/api/src/contexts/offers/infrastructure/http/dto/create-offer.dto.ts` | ✅ Ok | 0 |
| `apps/api/src/contexts/offers/infrastructure/http/dto/update-offer-revision.dto.ts` | ⚠️ Problemas | 1 (compartilhado com M1) |
| `apps/api/src/contexts/offers/infrastructure/http/dto/clone-offer.dto.ts` | ✅ Ok | 0 |
| `apps/api/src/contexts/offers/infrastructure/http/dto/civil-date.validator.ts` (novo) | ✅ Ok | 0 |
| `apps/api/src/contexts/offers/infrastructure/http/dto/offers-dto-parity.spec.ts` (novo) | ✅ Ok | 0 |
| `apps/api/src/contexts/offers/infrastructure/database/prisma/prisma-offer.mapper.ts` | ✅ Ok | 0 |
| `apps/api/src/contexts/offers/infrastructure/database/prisma/prisma-offer-revisions.repository.ts` | ✅ Ok | 0 |
| `apps/api/src/contexts/offers/infrastructure/database/prisma/prisma-offers.repository.ts` | ✅ Ok | 0 |
| `apps/api/src/contexts/offers/application/usecases/create-offer.usecase.ts` | ✅ Ok | 0 |
| `apps/api/src/contexts/offers/application/usecases/clone-offer.usecase.ts` | ✅ Ok | 1 minor |
| `apps/api/src/contexts/offers/application/usecases/create-revision.usecase.ts` | ✅ Ok | 0 |
| `apps/api/src/contexts/offers/application/usecases/update-revision.usecase.ts` | ⚠️ Problemas | 1 major, 3 minors |
| `apps/api/src/contexts/offers/application/usecases/usecases.spec.ts` | ✅ Ok | 0 |
| `apps/api/src/contexts/offers/infrastructure/http/offers.controller.ts` | ✅ Ok | 1 minor |
| `apps/api/src/contexts/offers/infrastructure/http/offers.controller.spec.ts` | ✅ Ok | 0 |
| `apps/api/src/contexts/offers/infrastructure/http/presenters/offer.presenter.ts` | ✅ Ok | 0 |
| `apps/api/src/contexts/baseline/**` (port, adapter, freeze, spec) | ✅ Ok | 1 minor |
| `libs/domain/src/lib/offers/offers.ts` | ✅ Ok | 0 |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

**M1 — `PUT` de revisão em rascunho persiste `subLotCode` como string vazia (normalização divergente entre create e update)**
`apps/api/src/contexts/offers/application/usecases/update-revision.usecase.ts:75`

O DTO aceita `subLotCode: ""` (`@IsOptional() @IsString() @MaxLength(3)` — todos passam com string vazia) e o use case faz:

```ts
subLotCode: payload.subLotCode?.trim().toUpperCase() ?? undefined,
```

`""` (ou `"   "`) resulta em `""`, que `updateParameters` grava e o repositório persiste (`revision.subLotCode ?? null` não converte `""`). O create normaliza corretamente (`payload.subLotCode?.trim().toUpperCase() || null` → null). O spec é explícito: os campos "permanecem como 'não informado', **nunca convertidos em zero ou texto vazio** (RNF-09)". Correção sugerida (que de quebra resolve o MIN-1 para este campo):

```ts
subLotCode:
  payload.subLotCode === undefined
    ? undefined
    : payload.subLotCode?.trim().toUpperCase() || null,
```

Adicionar teste: `PUT` com `subLotCode: ''` em rascunho → campo volta/permanece "não informado" (null no envelope).

### 🟢 Problemas Minor

**MIN-1 — Campos anuláveis novos não podem ser limpos via `PUT` (null → ignorado em silêncio)**
`apps/api/src/contexts/offers/application/usecases/update-revision.usecase.ts:73-78`

`payload.auctionNumber ?? undefined` (idem `lotNumber`, `contractSigningDate`, `constructionDeadlineMonths`) converte `null` explícito em "não tocar": uma vez informado, não há como voltar o campo a "não informado" pela API — o valor antigo persiste sem erro. É o mesmo padrão pré-existente de `auctionDate`/`scheduleStartDate`/etc. (dívida herdada, não introduzida pelo grupo), mas a aba de parâmetros do grupo 3 (`[readonly]="!isDraft()"`) vai esbarrar nisso quando o usuário apagar um campo. O contrato `UpdateOfferRevisionPayload` já tipa `string | null`, e `updateParameters` já aceita null — o fix é passar o null adiante (padrão do M1, campo a campo). Tema análogo no clone (`clone-offer.usecase.ts:85-94`): `target*` vazio recai na origem, logo não existe "clonar sem sublote" — mitigado pelo diálogo pré-preenchido do grupo 3 (risco já registrado no design), mas vale registrar.

**MIN-2 — Dois eventos de auditoria `REVISION/UPDATE` por transição nova**
`apps/api/src/contexts/offers/infrastructure/http/offers.controller.ts:154-158` + `update-revision.usecase.ts:96-118`

A rota já tem `@Audited({ resource: 'REVISION', action: 'UPDATE' })` (interceptor da borda) e o use case agora emite um segundo evento `UPDATE` com os diffs. Um `PUT { status: 'WON' }` gera duas entradas na trilha (uma genérica "Edição de revisão de oferta", outra com o diff de status). O docstring do port justifica (a borda não conhece o estado anterior) e a informação não se perde, mas a duplicação polui a trilha — considerar suprimir/condicionar o evento da borda para essa rota, ou registrar a decisão.

**MIN-3 — Atalho `DRAFT → DELIVERED` preservado, mas não documentado no delta spec**
`update-revision.usecase.ts:201-213` vs `specs/ofertas/cadastro-revisoes-linhas/spec.md:49`

O spec lista as transições válidas em ordem estrita e diz que "uma transição fora dessa ordem SHALL ser rejeitada". O atalho (rascunho → congela + entrega no mesmo ato) é comportamento pré-existente com testes, passa pelos estados na ordem correta atomicamente e a task 2.6 não o lista como rejeição — decisão de preservar é razoável. Porém, como o spec é a autoridade que será sincronizada no archive, o delta deve ganhar um cenário documentando o atalho (via `opsx:update`) para o QA 4.4 e a review de sync não apontarem drift.

**MIN-4 — Fallback de auditoria `userRole: 'ADMIN'` para autor "sistema"**
`update-revision.usecase.ts:102-104`

Sem usuário resolvido, o evento sai como `sistema` com papel `ADMIN`, distorcendo a leitura da trilha. O union `UserRole` não tem valor neutro e o precedente do `freeze-baseline` (`user-admin`/`Administrador`) é análogo — aceito como dívida da futura change de autenticação; registrar.

**MIN-5 — Cosméticos no `UpdateRevisionUseCase`**
(a) `?? undefined` redundante após `?.` em `subLotCode` (linha 75 — o optional chaining já devolve undefined); some com o fix do M1. (b) `execute()` está com ~150 linhas (limite do projeto: 50) — pré-existente, mas o grupo o fez crescer; extrair a emissão de auditoria para um `private emitStatusTransitionAudit(...)` já ajudaria.

**MIN-6 — Diff de auditoria do freeze com `previousValue === newValue`**
`apps/api/src/contexts/baseline/application/usecases/freeze-baseline.usecase.ts:85-107`

Registrar o status real (`revisionStatus`, prev==new) atende à D4 ("sem inventar DELIVERED → WON") e é honesto, mas um "diff" sem mudança é semanticamente estranho para consumidores da trilha — alternativa seria citar o status na `description` e omiti-lo dos `diffs`. Aceito como está; apenas observação.

## ✅ Destaques Positivos

1. **Máquina de estados exemplar** (`applyStatusTransition`): `switch` exaustivo com guarda `never` em compilação, no-op explícito para status igual, `DRAFT` como alvo rejeitado com racional em comentário — a API nunca aceita e ignora um status em silêncio, exatamente como o spec exige.
2. **`status as any` eliminados** no mapper e nos dois repositórios — o compilador agora acusa divergência entre enum do Prisma e da domain (dívida apontada no design, fechada).
3. **`IsCivilDate` com round-trip via `isValidCivilDate` da domain** fecha o achado recorrente nº 1 do projeto (datas): `2027-02-30` rejeitado sem rollover, com teste assertando a mensagem exata.
4. **Teste de paridade DTO × contrato de primeira** (`offers-dto-parity.spec.ts`): 1 erro por campo novo nos 3 DTOs + prova de que os derivados (`discountPercent`, `contractualDeadlineDate`, `scheduleWarnings`) são descartados pela whitelist — o modo de falha silencioso registrado em catalogo-solos-fundacoes está coberto.
5. **Testes de transição fortes**: auditoria assertada por diff exato e ordem (`toHaveBeenNthCalledWith`), rejeições por mensagem pt-BR completa, estado inalterado verificado re-lendo o repositório, no-op sem auditoria (`not.toHaveBeenCalled` sustentado).
6. **Derivados apertados para obrigatórios** em `OfferRevisionItem` (fecha o C1 da review do grupo 1) e derivação exclusivamente em leitura no presenter, com teste "ausência → null" (RNF-09).
7. **Porta de auditoria fina** espelhando o precedente baseline, com docstring explicando por que o interceptor da borda não basta; `freeze-baseline` deixa de inventar a transição `DELIVERED → WON`.
8. **Higiene institucional completa**: BOM ausente nos 4 arquivos novos (verificado byte a byte), `format:check --all` limpo, 272/272 testes e lint verdes com `--skip-nx-cache`, mensagens pt-BR por igualdade exata, código em inglês com textos pt-BR.

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ⚠️ Problemas (M1 normalização `""`; método `execute` acima do limite — pré-existente) |
| Typescript/Node.js | ✅ Ok (`as any` removidos onde a task pedia; `dto as any` do controller é pré-existente) |
| Angular/NestJS/React | ✅ Ok (DI por factory + port, `AuditModule` importado, `@CurrentUser` opcional) |
| REST/HTTP | ✅ Ok (`InvalidStatusTransitionException` → 409 Conflict; 400 com mensagens pt-BR) |
| Testes | ✅ Ok (25+ testes novos cobrindo os cenários do delta spec) |
| Logging/Monitoramento | ⚠️ Problemas (MIN-2 evento duplicado; MIN-4 fallback ADMIN) |

## Recomendações

1. **(M1)** Normalizar `subLotCode` no `update-revision` com `|| null` guardado por `undefined` (padrão sugerido acima) e adicionar teste de regressão para `PUT { subLotCode: '' }`. Corrigir antes do commit do grupo.
2. **(MIN-1)** Decidir agora se a limpeza de campos (`null` explícito) entra neste grupo ou fica para o grupo 3 — a UI de edição em rascunho vai precisar; se aplicar o padrão do item 1 campo a campo, os dois problemas somem juntos.
3. **(MIN-3)** Rodar `opsx:update` para documentar o atalho `DRAFT → DELIVERED` no delta spec antes do QA/archive.
4. **(MIN-2)** Registrar (ou suprimir) o evento duplicado de auditoria na rota `PUT` de revisão.
5. **(MIN-5b)** Na próxima passada pelo arquivo, extrair `emitStatusTransitionAudit` do `execute`.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero críticos; um major pontual de normalização (`subLotCode: ""` no update) com correção de uma linha + teste, e minors majoritariamente de registro/documentação. Corrigir o M1 antes do commit do grupo; MIN-1 e MIN-3 podem ser absorvidos pelo grupo 3 e pelo `opsx:update` respectivamente. As três decisões destacadas pelo implementador (atalho DRAFT→DELIVERED, `revisionStatus` prev==new no freeze, ação `UPDATE` na auditoria) foram escrutinadas e aceitas — a primeira condicionada à documentação no delta spec.

---

## Resolucao (pos-review, antes do commit do grupo)

- **M1 corrigido**: update-revision normaliza os campos novos (undefined ignora, null limpa, texto vazio/espacos vira null — RNF-09); teste de regressao 'sublote com texto vazio persiste null e null explicito limpa o campo' adicionado (273 testes verdes).
- **MIN-1 corrigido junto** (null explicito passa a limpar os cinco campos novos).
- **MIN-3 resolvido**: atalho DRAFT→DELIVERED documentado no delta spec (congela e entrega no mesmo ato, passando por FROZEN atomicamente).
- MIN-2 (evento duplicado @Audited + port), MIN-4 (fallback ADMIN — divida da change de autenticacao) e MIN-5/6 registrados sem acao nesta change.
