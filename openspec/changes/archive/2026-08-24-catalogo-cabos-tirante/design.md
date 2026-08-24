# Design: catalogo-cabos-tirante

## Context

Ver `proposal.md — Why`. Dois catálogos completos existem (`conductor-cables`, `ground-wires`) com padrão idêntico por convenção; as reviews de catalogo-cabos-guarda-opgw inventariaram a duplicação: patterns de validação em 3 lugares, `isUniqueViolation` e boilerplate de controller em 2, `pendingFields` em 2 formas, serviços de API web quase idênticos, services devolvendo linhas Prisma cruas. Este design fixa **o que** extrair (e o que deliberadamente não extrair) e o desenho do terceiro catálogo sobre essa base.

## Goals / Non-Goals

**Goals:**

- Extração comprovada pelos dois precedentes: código novo do terceiro catálogo contém apenas o que é específico dele (schema, rótulos, rotas, campos).
- Refit de `conductor-cables` e `ground-wires` **sem mudança de comportamento observável** (mesmas rotas, status, mensagens) — garantido pelos testes existentes, que não devem mudar de asserção, só de fiação.
- Contratos da `domain` como única forma dos payloads: services tipados contra eles nas respostas.

**Non-Goals:**

- Abstração de UI (componentes Angular genéricos de listagem/formulário/histórico): os templates divergem de verdade (filtro por tipo, blocos condicionais) — extração aqui seria especulativa. Um componente por catálogo continua.
- Base class de controller/service NestJS: herança de controllers com decoradores é frágil no Nest (metadata por classe); a extração é por **funções e helpers puros**, não por hierarquia.
- Generalizar o modelo de dados (tabela única de catálogos): cada catálogo mantém suas tabelas — RNF-05 e clareza de schema valem mais que DRY no banco.

## Decisions

### D1 — Patterns de validação em `libs/domain`

`libs/domain/src/lib/catalogs/validation.ts` com `POSITIVE_DECIMAL_PATTERN`, `POSITIVE_INT_PATTERN`, `DATE_PATTERN` (e nada mais — mensagens ficam em cada consumidor, pois pt-BR/RNF-14 é responsabilidade da borda). DTOs da API e forms do web importam da `domain`; as constantes locais somem. Alternativa — lib nova `validation`: rejeitada, os patterns são vocabulário dos contratos de catálogo e a `domain` já é dependência de api e web.

### D2 — Helpers compartilhados no módulo `catalogs` da API

- `catalogs/prisma-errors.ts`: `isUniqueViolation` (duck-typing P2002, mock-friendly) — some das duas cópias.
- `effectiveness.ts` ganha `missingFields(version, labels)` genérico (mapa campo→rótulo pt-BR); o `pendingFields`/`RequiredFields` específico de condutor sai de lá — cada service declara seus mapas de rótulos e chama o genérico (condutor inclui descrição; guarda por tipo; tirante com o conjunto do spec). `resolveEffectiveVersion` fica como está.
- `catalogs/controller-shared.ts`: `createIdPipe()` (ParseIntPipe com exceptionFactory pt-BR), `resolveAuthor(user?)` (X-User → "sistema"), `resolveReferenceDate(effectiveOn?)` (borda, data civil), `versionImmutableException()` (mensagem do 405). Controllers continuam declarando as rotas (incl. PUT/PATCH separados) e chamam os helpers.

### D3 — Services retornam os contratos da `domain`

Cada service ganha um mapper privado (`toVersionContract`) que converte a linha Prisma para a interface da `domain`: `Decimal`→`string` (`.toString()`), `Date`→ISO string, sem FKs internas. Assinaturas: `list(): Promise<XSummary[]>`, `get(): Promise<XSummary>`, `listHistory(): Promise<XHistory>`; `createVersion` devolve o contrato da versão criada e `create` devolve o `XSummary` do item recém-criado (a versão criada como vigente) — o id do item importa para o chamador. `conductor-cables` passa a importar a `domain` (fecha o drift). Efeito observável único e aceito: FKs internas (`conductorCableId`/`groundWireId`) deixam de aparecer no JSON — nunca fizeram parte dos contratos nem foram consumidas pelo web. Alternativa — interceptor de serialização global: rejeitada, esconde a conversão e não dá tipo de retorno.

### D4 — Web: base de API service e utilitários de form

- `catalogs/versioned-catalog-api.ts`: classe genérica `VersionedCatalogApi<TSummary, THistory, TNew, TNewVersion>` com `list(search?)`, `history(id)`, `create(input)`, `createVersion(id, input)` sobre uma `base` URL; `ConductorCablesApi` estende; `GroundWiresApi` estende e **sobrescreve** `list` para aceitar o filtro de tipo (variação real fica no filho).
- `catalogs/form-utils.ts`: `orNull(text)` e `intOrNull(text)`; forms existentes passam a importar (o comportamento é idêntico ao atual).

### D5 — Catálogo de tirantes sobre a base extraída

- Prisma: `GuyWire` (id, código único) e `GuyWireVersion` (descrição, peso 12,4, bobina 12,2, diâmetro 10,3, UTS 12,2, `galvanization_class`, `strength_grade`, `wire_count Int?`, vigência `@db.Date`, autoria; `@@unique([guyWireId, effectiveFrom])`, índice desc) — precisões espelhando os catálogos existentes. Sem discriminador de tipo (decisão do usuário; consolidação separada na planilha, RF-23).
- API: `guy-wires.controller/service` em `/catalogs/guy-wires` usando D1–D3; DTOs com mensagens pt-BR; pendências: comuns + galvanização/grau/fios (descrição fora, conforme spec).
- Web: `guy-wire-list/-form/-history` (sem filtro de tipo, sem blocos condicionais), rotas lazy sob `/catalogs/guy-wires`, link na navegação; contratos em `libs/domain/src/lib/catalogs/guy-wires.ts`.

### D6 — Nomenclatura

Mapa do README antes do código: tirante (cabo de aço) → `GuyWire` / `guy_wire` / `guy-wires` (termo consagrado em linhas de transmissão para cabo de estaiamento; alternativa "stay wire" rejeitada por ser menos usual no setor). Demais atributos já mapeados pelas changes anteriores.

## Risks / Trade-offs

- [Refit dos catálogos existentes pode regredir comportamento] → os testes atuais de api e web (104 asserções relevantes) permanecem com as mesmas asserções; qualquer mudança de asserção no refit é sinal de quebra de contrato e deve ser tratada como bug, não ajuste. Suíte completa + smoke E2E dos três catálogos no QA.
- [Remoção das FKs internas do JSON é tecnicamente uma mudança de payload] → aceita e documentada: contratos da `domain` são a fonte de verdade publicada; nenhum consumidor conhecido usa as FKs (web importa os contratos). Registrada no proposal (Impact).
- [Extração insuficiente ou excessiva] → critério: só entra o que tem 2+ usos reais hoje e 3º uso imediato no tirante; qualquer generalização adicional espera o 4º catálogo (torres/isoladores, que têm forma diferente e testarão o limite do padrão).
- [Atributos de `DB_CTI` não confirmados (§02)] → modelo aditivo, mesmo tratamento das changes anteriores.

## Migration Plan

Ordem que protege o comportamento: (1) extração com refit dos dois catálogos existentes + suíte verde (nenhuma feature nova junto); (2) migration aditiva do `GuyWire`; (3) contratos; (4) API; (5) UI; (6) QA da change com smoke dos três catálogos. Rollback: a extração é reversível por git (sem migration); o catálogo novo reverte migration + arquivos. Rotina: review do `task-reviewer` por grupo, commit por grupo, `/executar-qa` antes do archive.

## Open Questions

- Nenhuma bloqueante. Rótulos/unidades seguem os catálogos anteriores; pendências de unidade (UTS, I²t) continuam na validação §02 já registrada.
