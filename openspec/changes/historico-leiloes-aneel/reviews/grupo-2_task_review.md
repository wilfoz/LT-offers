# Review do Grupo 2 — API, contexto auction-history (tasks 2.1–2.4)

**Revisor**: AI Code Reviewer
**Data**: 2026-09-28
**Change / Grupo**: historico-leiloes-aneel / grupo 2
**Status**: Aprovado com observações

## Resumo

O grupo entrega o contexto hexagonal `apps/api/src/contexts/auction-history` completo: porta da fonte externa + adapter CKAN com paginação e timeout, repositório Prisma com replace-all transacional (design D1), três use cases (sync/list/benchmark), controller com DTOs de query validados em pt-BR, módulo com factories registrado no app e no `context-modules-di.spec.ts`, e quatro suítes de teste sem nenhum acesso à rede ou ao banco. As lições institucionais vieram aplicadas de primeira: nenhuma leitura de relógio ou `new Date()` sem entrada validada (a armadilha recorrente de datas foi evitada — data civil validada por round-trip na domain, escrita/leitura simétrica em UTC), `where` assertado por igualdade total, aborts assertados por estado (snapshot/importações/auditoria intocados), paridade 1 erro por campo nos DTOs e `@Inject(PrismaService)` com cobertura de DI real. A guarda de deságio 0–100% fecha o MIN-3 da review do grupo 1 com teste dedicado.

Verificação independente: `npx nx run-many -t test lint -p api domain` verde (api: 298 testes, 50 suítes; lint 0 erros), `npx nx format:check --all` limpo, sem BOM nos 21 arquivos novos.

Encontrei 1 problema major (caminho defensivo do adapter que persiste dataset truncado em silêncio) e minors de robustez; nada crítico.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `domain/ports/tokens.ts` | ✅ Ok | 0 |
| `domain/ports/aneel-auction-results.port.ts` | ✅ Ok | 0 |
| `domain/ports/auction-history.repository.ts` | ✅ Ok | 0 |
| `domain/ports/audit-trail.port.ts` | ⚠️ Problemas | 1 (3ª cópia — extração devida) |
| `domain/exceptions/auction-history.exceptions.ts` | ✅ Ok | 0 |
| `application/usecases/sync-auction-results.usecase.ts` | ⚠️ Problemas | 2 minors |
| `application/usecases/list-auction-results.usecase.ts` | ✅ Ok | 0 |
| `application/usecases/get-auction-benchmark.usecase.ts` | ✅ Ok | 0 |
| `infrastructure/adapters/ckan-aneel-auction-results.adapter.ts` | ⚠️ Problemas | 1 major, 1 minor |
| `infrastructure/adapters/prisma-auction-history.repository.ts` | ⚠️ Problemas | 2 minors |
| `infrastructure/adapters/audit-service-trail.adapter.ts` | ✅ Ok | 0 |
| `infrastructure/controllers/auction-history.controller.ts` | ⚠️ Problemas | 1 minor |
| `infrastructure/dto/auction-history-query.dto.ts` | ✅ Ok | 0 |
| `infrastructure/auction-history.module.ts` | ✅ Ok | 0 (dívida herdada: re-provê `PrismaService`) |
| `application/usecases/usecases.spec.ts` | ✅ Ok | 0 |
| `infrastructure/adapters/ckan-aneel-auction-results.adapter.spec.ts` | ✅ Ok | 0 |
| `infrastructure/adapters/prisma-auction-history.repository.spec.ts` | ✅ Ok | 0 (lacuna registrada em MIN-4) |
| `infrastructure/controllers/auction-history.controller.spec.ts` | ✅ Ok | 0 |
| `apps/api/src/app/app.module.ts` + `context-modules-di.spec.ts` | ✅ Ok | 0 |
| `libs/domain/src/lib/audit/audit-event.ts` | ✅ Ok | 0 (union sem consumidor exaustivo, verificado) |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

**MAJ-1 — Freio `MAX_PAGES` persiste snapshot truncado em silêncio**
`infrastructure/adapters/ckan-aneel-auction-results.adapter.ts:40-50`

Se o loop de paginação esgota `MAX_PAGES` (50 páginas × 500 = 25.000 registros) sem acumular `total`, o `fetchAll` retorna os registros parciais normalmente e o sync **substitui o snapshot por um dataset truncado**, sem erro e sem sinal. Isso contradiz o próprio comentário do freio ("contra uma resposta com `total` absurdo"), a docstring do use case ("nunca deixamos o snapshot pela metade") e o cenário do spec "o snapshot vigente passa a refletir **integralmente** o dataset importado". O cenário exige um servidor patológico (50 páginas cheias com `total` > 25.000) — probabilidade baixa, mas é exatamente a situação que o freio existe para tratar, e hoje ele a trata persistindo dado errado.

Correção sugerida (o `return` após o loop vira exceção):

```typescript
for (let page = 0; page < MAX_PAGES; page++) {
  // ...
}
throw new AneelDatasetInvalidException(
  `a paginação excedeu o limite de ${MAX_PAGES * PAGE_SIZE} registros sem esgotar o total informado`,
);
```

E um teste no adapter spec cobrindo o caminho (mock devolvendo sempre página cheia com `total` alto).

### 🟢 Problemas Minor

**MIN-1 — Catch-all do controller converte erro interno em 400 com mensagem crua**
`infrastructure/controllers/auction-history.controller.ts:40-43`

`handleAuctionHistoryError` mapeia qualquer `Error` não-domínio para `BadRequestException(error.message)`. Uma falha de banco dentro do `replaceSnapshot` (a transação faz rollback, o snapshot fica íntegro) responderia HTTP 400 com a mensagem interna do Prisma em inglês — semântica errada (falha do servidor, não do cliente) e vazamento de mensagem não-pt-BR (RNF-14). O padrão vem do `handleCatalogDomainError` (fallback idêntico), então é dívida institucional, não desvio novo — mas nos catálogos o fallback é quase inalcançável (o domínio tipa tudo), enquanto aqui os únicos erros não tipados alcançáveis são exatamente os internos. Sugestão: fallback `InternalServerErrorException('Erro interno ao processar o histórico de leilões')` (deixando o Nest logar o original), a aplicar também no helper dos catálogos quando for tocado.

**MIN-2 — Timeout do adapter não cobre a leitura do corpo**
`infrastructure/adapters/ckan-aneel-auction-results.adapter.ts:70-72`

O `clearTimeout` no `finally` dispara assim que os headers chegam; o `await response.json()` (linha 82) roda sem timeout — um corpo que trava depois dos headers pende o sync indefinidamente. Correção: mover o `clearTimeout` para depois do `json()` (o `signal` já abortaria a leitura do corpo) ou envolver o `json()` no mesmo try do abort.

**MIN-3 — `normalized as AuctionResultItem[]` em vez de type guard**
`application/usecases/sync-auction-results.usecase.ts:38`

O cast é seguro (o `invalidCount > 0` acima garante ausência de nulls), mas `records.map(...).filter((item): item is AuctionResultItem => item !== null)` eliminaria a asserção e sobreviveria a refatorações que movam a checagem.

**MIN-4 — Repositório: só `findResults` tem teste unitário**
`infrastructure/adapters/prisma-auction-history.repository.spec.ts`

`replaceSnapshot` (a ordem `deleteMany → create → createMany` dentro do `$transaction`, coração do D1) e os mappers `toResultItem`/`toImportItem` (conversões `Decimal → toFixed` na escala da coluna e `auctionDate` UTC) não têm teste direto — os specs de use case usam repositório em memória e não exercitam o Prisma. Registro como minor, não major, porque isto já **excede** a baseline institucional (nenhum outro repositório Prisma de contexto tem spec de adapter; este é o primeiro a aplicar a lição do `where` por igualdade a um contexto). Um teste com tx mockada assertando a ordem das chamadas e o payload do `createMany` (com `Prisma.Decimal` real) pinaria as duas coisas barato.

**MIN-5 — Checagens de nulo por truthiness em strings decimais**
`infrastructure/adapters/prisma-auction-history.repository.ts:47-61`

`item.lineLengthKm ? new Decimal(...) : null` etc. dependem de o contrato nunca emitir `""` (verdade hoje: a normalização da domain produz string decimal válida ou `null`). `item.lineLengthKm !== null` seria à prova da armadilha null ≠ zero (RNF-09) sem depender dessa invariante à distância. Nas leituras (`row.x ? ...`) não há risco — `Prisma.Decimal(0)` é objeto, sempre truthy.

**MIN-6 — `auditTrail?` opcional no construtor do sync**
`application/usecases/sync-auction-results.usecase.ts:21`

Dependência opcional significa que um erro de fiação no módulo (inject esquecido) pularia a auditoria em silêncio. Segue o precedente de `offers/update-revision.usecase.ts` (aceito), e a fiação real está coberta pelo `context-modules-di.spec.ts` + factory explícita — registro apenas para vigiar o padrão.

**MIN-7 — 3ª cópia da porta fina de auditoria: regra das três ocorrências disparada**
`domain/ports/audit-trail.port.ts`

`AuctionHistoryAuditTrailPort` é estruturalmente idêntica às portas de `baseline` e `offers` (mesmo `logEvent(Omit<AuditEvent, 'id' | 'timestamp'>)`), e o adapter é a 3ª casca de delegação ao `AuditService`. Pela regra institucional das três ocorrências, a extração está **devida**: uma porta `AuditTrailPort` + adapter compartilhados (em `contexts/shared/` ou no próprio módulo de auditoria) na próxima change que tocar auditoria — não nesta (o custo/risco de refit não pertence ao escopo do grupo).

## ✅ Destaques Positivos

1. **A armadilha recorrente de datas foi evitada por construção**: nenhuma leitura de relógio no contexto; `auctionDate` chega como data civil `AAAA-MM-DD` validada por round-trip na domain (`isValidCivilDate`), é gravada como `new Date('AAAA-MM-DD')` (meia-noite UTC, dia correto em qualquer fuso na coluna `@db.Date`) e lida com `toISOString().slice(0, 10)` — escrita e leitura simétricas.
2. **Aborts do sync assertados por estado, não só por exceção**: os testes verificam snapshot inalterado, log de importações sem entrada nova e auditoria não chamada — o cenário do spec "falha da fonte não corrompe o snapshot" coberto literalmente, incluindo o caso com snapshot pré-existente.
3. **Guarda da coluna DECIMAL(5,2)** (deságio fora de 0–100% aborta com mensagem clara antes da inserção) fecha o MIN-3 da review do grupo 1, com teste do caso real ("48" publicado já em percentual → 4800.00) e uso de `Number()` restrito ao range check (nada persiste como float — RNF-08 preservado).
4. **Auditoria emitida pelo use case via porta, sem `@Audited` no controller** — aplica a lição do MIN-2 da change de offers (evento duplicado) e leva a contagem importada, que a borda não conhece. Decisão correta para este endpoint.
5. **Adapter CKAN sem rede nos testes**, com offsets de paginação assertados (`offset=0`, `offset=500`), mensagens pt-BR exatas para HTTP ≠ 2xx, falha de rede, JSON inválido, esquema fora do esperado e timeout.
6. **`where` por igualdade total** no spec do repositório (com e sem filtros, ordenação incluída) — lição institucional aplicada pela primeira vez a um repositório de contexto (nenhum outro contexto tem spec de adapter Prisma).
7. **Paridade DTO × contrato** no controller spec (todas as chaves inválidas → 1 erro por campo) — lição do MIN-1 de foundations aplicada a query DTOs.
8. **DI real coberta**: `@Inject(PrismaService)` no repositório, módulo com factories por token e entrada no `context-modules-di.spec.ts` (lição da change pricing-taxation).
9. Filtro de UF por `contains insensitive` sobre `mainUf` — decisão correta para o formato multi-UF do dataset (`CE/PI`): filtrar por `PI` encontra o lote.
10. Benchmark distingue `auctionStats: null` (leilão ausente) de estatísticas zeradas (base vazia) — null ≠ zero (RNF-09) respeitado na resposta, com os três estados testados com valores exatos.

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ✅ Ok |
| Typescript/Node.js | ⚠️ Problemas (MIN-3 cast; MIN-5 truthiness) |
| Angular/NestJS/React | ✅ Ok |
| REST/HTTP | ⚠️ Problemas (MIN-1 catch-all 400) |
| Testes | ✅ Ok (298/298 verdes; lacunas MIN-4 e caminho MAX_PAGES) |
| Logging/Monitoramento | ✅ Ok (auditoria via porta; `userRole: 'ADMIN'` fixo é dívida conhecida da change de autenticação, comum aos demais contextos) |

## Recomendações

1. **(MAJ-1)** Trocar o `return` silencioso após o loop de `MAX_PAGES` por `AneelDatasetInvalidException`, com teste do caminho no adapter spec — 3 linhas, fecha a única contradição com o spec.
2. **(MIN-2)** Mover o `clearTimeout` para depois do `response.json()` para o timeout cobrir a leitura do corpo.
3. **(MIN-1)** Na próxima passada pelos helpers de erro HTTP (este e `handleCatalogDomainError`), trocar o fallback `Error → 400` por 500 com mensagem pt-BR genérica.
4. **(MIN-4)** Adicionar teste de `replaceSnapshot` com tx mockada assertando a ordem `deleteMany → create → createMany` e o payload com `Prisma.Decimal` real.
5. **(MIN-3/MIN-5)** Preferir type guard no filter do sync e `!== null` nos mapeamentos de escrita do repositório.
6. **(MIN-7)** Registrar no backlog: extrair `AuditTrailPort` + adapter compartilhados na próxima change que tocar auditoria (regra das três ocorrências disparada com esta 3ª cópia).

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero problemas críticos; um major em caminho defensivo de baixíssima probabilidade (MAX_PAGES truncando o snapshot em silêncio) com correção trivial, e minors de robustez. A arquitetura segue fielmente o design D1/D3, todos os cenários de API do spec têm teste correspondente com asserções por estado e mensagem exata, e as lições institucionais (datas, where por igualdade, paridade de DTO, DI real, evento de auditoria único) vieram aplicadas de primeira. Recomendo corrigir MAJ-1 e MIN-2 (ambos no adapter, ~10 linhas com testes) antes do commit do grupo; os demais minors podem seguir com a change ou para o backlog. Decisões escrutinadas e aceitas: auditoria via porta sem `@Audited` (correta — evita evento duplicado), `userRole 'ADMIN'` fixo (dívida conhecida da autenticação), `year` string + `Number()` na borda (coerente com ValidationPipe sem `transform`, validado por `^\d{4}$`), sem RolesGuard (precedente schedule-parameters).

---

## Resolucao (pos-review, antes do commit do grupo)

- **MAJ-1 corrigido**: estourar MAX_PAGES agora lanca AneelDatasetInvalidException em vez de devolver snapshot truncado; teste do caminho adicionado (50 paginas cheias com total inalcancavel).
- **MIN-1 corrigido**: catch-all do controller vira 500 com mensagem generica pt-BR (nao vaza erro cru do Prisma).
- **MIN-2 corrigido**: timeout do AbortController passou a cobrir o corpo da resposta (json dentro do try/finally; AbortError no json vira fonte indisponivel).
- **MIN-3 corrigido**: cast substituido por filter com type guard.
- **MIN-5 corrigido**: null-checks de escrita no repositorio por !== null.
- MIN-4 (testes de replaceSnapshot/mappers), MIN-6 (auditTrail opcional) e MIN-7 (3a copia da porta de auditoria — extracao devida na proxima change que tocar auditoria) registrados sem acao nesta change.
