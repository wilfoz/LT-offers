# Review dos Grupos 1–4 - Arquitetura Hexagonal no Contexto Baseline

**Revisor**: AI Code Reviewer
**Data**: 2026-09-20
**Change / Grupo**: arquitetura-hexagonal-contexto-baseline / grupos 1–4 (14/14 tasks)
**Status**: Aprovado com observações

## Resumo

Migração do módulo F7 (`apps/api/src/baseline/`, ~1,5k linhas em 3 services acoplados) para o bounded context `apps/api/src/contexts/baseline/` com 13 casos de uso, 6 portas de domínio e 6 adaptadores. A descoberta central do apply — o legado era **inteiramente em memória** (`Map` + seeds; não existem tabelas de baseline no schema Prisma, que permanece intocado) — foi tratada corretamente: as decisões 4–6 do design foram revisadas por escrito, o tasks.md ganhou nota explicativa, e a implementação seguiu a realidade em vez do plano original (repositórios in-memory preservando seeds e regras de ID, unit of work eliminado, imutabilidade garantida pela ausência estrutural de `update`/`delete` na porta `BaselinesRepository`).

A verificação de contrato foi feita rota a rota contra `git show HEAD:apps/api/src/baseline/*`: as 10 rotas de `/api/offers/:offerId/{baseline, baseline/freeze, curve-s, progress-records GET/POST, change-orders GET/POST/PUT, cwe, erp-package, erp-package/export-xlsx}` estão **byte a byte idênticas** em guards (`@UseGuards(RolesGuard)` de classe + `@Roles` por rota), defaults de usuário (incl. a assimetria herdada `diretoria.comercial@` no freeze vs `diretor.comercial@` no PUT de change order), resolução de `baselineId` default via baseline ativa, headers do XLSX (Content-Type e `Carga_ERP_<sistema>_Oferta_<id>.xlsx`), mensagens 404 pt-BR exatas e fallback do seed adaptado (`{...seed, offerId}`). Os 5 pontos de emissão de auditoria foram comparados campo a campo (userId/userName/userRole/resource/resourceId/offerId/action/description/diffs) — idênticos ao legado, incluindo quirks preservados de propósito. Zero problemas críticos ou major; os minors são dívidas herdadas documentadas e pequenos desalinhamentos de artefato.

**Verificação executada**: `npx nx run-many -t test lint -p api --skip-nx-cache` (37 suítes, 185 testes verdes), `npx nx build api --skip-nx-cache` (webpack ok), `npx nx format:check --all` (limpo), BOM ausente em todos os arquivos novos (`head -c3 | od`), `npx prisma`/schema intocado, grep sem nenhum import residual do caminho legado `src/baseline/`.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `domain/exceptions/baseline.exceptions.ts` | ✅ Ok | 0 |
| `domain/ports/baseline-repositories.port.ts` | ✅ Ok | 0 |
| `domain/ports/baseline-offer-query.port.ts` | ✅ Ok | 0 |
| `domain/ports/audit-trail.port.ts` | ✅ Ok | 0 |
| `domain/ports/erp-spreadsheet.port.ts` | ✅ Ok | 0 |
| `domain/ports/tokens.ts` + barrels (`domain/`, `ports/`, `application/`, `infrastructure/`, raiz) | ✅ Ok | 0 |
| `application/usecases/freeze-baseline.usecase.ts` | ⚠️ Problemas | 1 minor |
| `application/usecases/get-baselines.usecases.ts` | ⚠️ Problemas | 2 minors |
| `application/usecases/change-orders.usecases.ts` | ⚠️ Problemas | 1 minor |
| `application/usecases/progress-tracking.usecases.ts` | ⚠️ Problemas | 1 minor |
| `application/usecases/erp-integration.usecases.ts` | ✅ Ok | 0 |
| `application/usecases/usecases.spec.ts` | ⚠️ Problemas | 1 minor |
| `infrastructure/database/in-memory/in-memory-baselines.repository.ts` | ✅ Ok | 0 |
| `infrastructure/database/in-memory/in-memory-change-orders.repository.ts` | ✅ Ok | 0 |
| `infrastructure/database/in-memory/in-memory-progress-records.repository.ts` | ✅ Ok | 0 |
| `infrastructure/database/prisma/prisma-baseline-offer-query.adapter.ts` | ✅ Ok | 0 |
| `infrastructure/audit/audit-service-trail.adapter.ts` | ✅ Ok | 0 |
| `infrastructure/spreadsheet/excel-erp-spreadsheet.adapter.ts` | ⚠️ Problemas | 1 minor (herdado) |
| `infrastructure/http/controllers/baseline.controller.ts` | ✅ Ok | 0 |
| `infrastructure/http/controllers/baseline.controller.spec.ts` | ⚠️ Problemas | 1 minor |
| `infrastructure/baseline.module.ts` | ✅ Ok | 0 |
| `apps/api/src/app/app.module.ts` + `context-modules-di.spec.ts` | ✅ Ok | 0 |
| `openspec/.../design.md` (revisões 4–6) | ⚠️ Problemas | 1 minor |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

**MIN-1 — Seção Risks do design.md ficou desatualizada após a revisão das decisões 4–6** — `openspec/changes/arquitetura-hexagonal-contexto-baseline/design.md:43`
O risco de divergência da curva S afirma que "a fachada devolve strings decimais (RNF-08) e o caso de uso converte com `DecimalValue`, sem float". A implementação real de `GetCurveSUseCase` (`progress-tracking.usecases.ts:117-134`) preserva **de propósito** o `parseFloat`/aritmética float/`toFixed(2)` do legado para manter o output idêntico — e a curva S nem consome a fachada de economics (só o freeze consome, como strings sem conversão). A decisão de preservar é correta para a paridade; o texto do design é que não foi ajustado junto com as decisões 4–6. Sugestão: reescrever o parágrafo do risco registrando o float herdado como dívida RNF-08 explícita, a quitar quando a persistência real de baseline chegar (mesma janela dos adaptadores Prisma).

**MIN-2 — Gap título×asserção (recorrente no projeto)** — `infrastructure/http/controllers/baseline.controller.spec.ts:158-164`
O teste "deve converter exceção de domínio em 404 com mensagem em português" asserta apenas `rejects.toThrow(NotFoundException)` — a mensagem prometida no título não é verificada. Como o `toHttp` faz `new NotFoundException(err.message)`, a asserção da mensagem exata fecharia o contrato:

```typescript
await expect(controller.getBaseline(99)).rejects.toThrow(
  'Linha de Base ID 99 não encontrada.',
);
```

**MIN-3 — ID do seed hardcoded no caso de uso** — `application/usecases/get-baselines.usecases.ts:27`
`GetActiveBaselineUseCase` faz `this.baselines.findById(1)` para o fallback do seed adaptado. O número mágico `1` é o ID do seed que vive no adaptador in-memory — o conhecimento da infraestrutura vazou para a aplicação. Paridade com o legado (`this.baselines.get(1)`), mas numa arquitetura de portas o vínculo merece no mínimo uma constante nomeada (`const SEED_BASELINE_ID = 1`) com comentário apontando o adaptador, ou uma operação de porta dedicada (ex.: `findDefaultSeed()`), para não quebrar em silêncio quando o adaptador Prisma substituir o in-memory.

**MIN-4 — Quirk de auditoria herdado sem sinalização no código** — `application/usecases/change-orders.usecases.ts:156-157`
No `UpdateChangeOrderUseCase`, o evento de auditoria emite `resourceId: String(baselineId)` e `offerId: String(baselineId)` — o campo `offerId` recebe o **baselineId** (bug do legado preservado para eventos idênticos; `CreateChangeOrderUseCase` usa corretamente `baseline.offerId`). A preservação é a decisão certa nesta change, mas diferentemente dos outros quirks (IDs de boletim e de aditivo, que ganharam comentário "herdado do legado"), este ficou sem marcação — quem ler depois vai achar que é bug novo. Adicionar o mesmo comentário de uma linha.

**MIN-5 — Warning novo de lint: non-null assertion herdada do spec legado** — `application/usecases/usecases.spec.ts:168`
`newOrder.id!` gera o único warning novo do contexto (`@typescript-eslint/no-non-null-assertion`). Herdado byte a byte do `baseline.service.spec.ts` legado (linha 135), e há `expect(newOrder.id).toBeDefined()` logo antes. Trocar por uma guarda tipada ou `expect(...).toEqual(expect.any(Number))` + variável local eliminaria o warning sem alterar a asserção.

**MIN-6 — Métodos acima de 50 linhas movidos sem reescrita (aceito pela decisão 6, registrar)** — `application/usecases/freeze-baseline.usecase.ts:30-107` (~78 linhas) e `infrastructure/spreadsheet/excel-erp-spreadsheet.adapter.ts:40-172` (`buildWorkbook`, ~130 linhas)
Ambos ultrapassam o limite de 50 linhas por método, mas são código movido do legado sob o critério move-don't-rewrite (decisão 6) — reescrever agora aumentaria o risco de regressão numérica/visual sem benefício de contrato. Fica registrado para a change de persistência real, quando o freeze será reestruturado de qualquer forma.

**MIN-7 — `ListBaselinesUseCase` sem rota (código morto de paridade)** — `application/usecases/get-baselines.usecases.ts:52-67` e `baseline.module.ts`
O legado tinha `listBaselines` no service sem nenhuma rota consumindo; a migração preservou a paridade criando o caso de uso, registrando-o no DI e testando-o. É superfície pública sem consumidor HTTP — aceitável como contrato futuro (a task 2.1 o lista explicitamente), mas vale registrar que a rota `GET /baselines` não existe nem existia.

## ✅ Destaques Positivos

1. **Desvio de design tratado da forma exemplar**: em vez de implementar o plano original (Prisma + unit of work) contra uma realidade que não o comporta, a descoberta foi verificada (schema Prisma sem nenhuma tabela de baseline — confirmado nesta review), documentada como revisão explícita das decisões 4–6 no design.md, anotada no tasks.md, e a implementação seguiu a realidade. A decisão 5 (imutabilidade arquitetural pela ausência de `update`/`delete` na porta, com comentário justificando em `baseline-repositories.port.ts:7-11`) é mais robusta que a invariante de entidade planejada.
2. **Zero regressão de contrato detectada**: comparação rota a rota com o legado via `git show HEAD:` — paths, verbos, guards, roles, defaults de usuário (incluindo a assimetria `diretoria.comercial@`/`diretor.comercial@` que seria tentador "corrigir"), mensagens 404, headers do XLSX e fallbacks todos idênticos.
3. **Eventos de auditoria idênticos campo a campo** nos 5 pontos de emissão (freeze, create/update de change order, boletim, ERP), via `AuditTrailPort` fino tipado com `Omit<AuditEvent, 'id' | 'timestamp'>` — exatamente a assinatura do `AuditService.logEvent` global.
4. **Quirks do legado preservados conscientemente e (quase todos) documentados**: ID de boletim = `records.length + 1` mesmo em substituição (comentário em `progress-tracking.usecases.ts:45`), ID global sequencial + `AD-XX` com `padStart` nos aditivos (comentário na porta), seeds byte a byte idênticos nos 3 adaptadores in-memory.
5. **Limpeza correta de código morto**: a checagem inalcançável `if (!baseline)` após `getBaselineById` (mensagem "Linha de base ID" com b minúsculo, que nunca era emitida) foi removida; o `include` morto de `revisions.transmissionLines` no freeze do legado desapareceu com a porta `BaselineOfferQueryPort` de superfície mínima (`id`/`code`/`name` — os únicos campos consumidos).
6. **Relógio resolvido na borda (RNF-04)** em todas as rotas que carimbam datas — freeze, aditivos, boletins, ERP e ano-base da curva S — com teste dedicado (`expect.any(Date)` no controller.spec e `NOW` fixo nos testes de caso de uso, incl. `frozenAt`/`approvedAt` assertados contra `NOW.toISOString()`).
7. **Testes preservam e ampliam**: as asserções do spec legado de 184 linhas estão todas no `usecases.spec.ts` (com os adaptadores in-memory puros como dublês — os seeds oficiais sustentam as mesmas asserções), mais cenários novos: fallback do seed adaptado (`offerId 42 → id 1`), exceções de domínio com mensagem exata, dublê da porta XLSX recebendo o pacote estruturado. Controller.spec foi de 3 para 6 testes.
8. **DI verificada de ponta a ponta**: `@Inject(PrismaService)` no construtor com tipo de união do adaptador Prisma (armadilha conhecida do projeto), `BaselineModule` como 8º módulo do `context-modules-di.spec.ts`, e `PrismaService` provido localmente seguindo o padrão dos outros 7 contextos.

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ⚠️ Problemas (MIN-3, MIN-6 — herdados/registrados) |
| TypeScript/Node.js | ✅ Ok (zero `any` novo; 1 warning herdado, MIN-5) |
| Angular/NestJS/React | ✅ Ok (tokens `Symbol`, portas, guards preservados) |
| REST/HTTP | ✅ Ok (10 rotas byte a byte; 404 pt-BR exatos via `toHttp`) |
| Testes | ✅ Ok (185 verdes skip-cache; asserções legadas preservadas) |
| Logging/Monitoramento | ✅ Ok (auditoria idêntica ao legado via porta) |

RNF-14 (pt-BR nas mensagens/comentários/testes, código em inglês): ✅. RNF-08 (Decimal, sem float): ⚠️ float herdado na curva S e no XLSX (células numéricas), preservado por paridade — dívida a registrar (MIN-1). RNF-04 (motor sem relógio): ✅ nos casos de uso; `new Date()` restante só na borda (controller) e no metadado `workbook.created` do adaptador ExcelJS (infraestrutura, sem efeito no contrato).

## Recomendações

1. **(MIN-1)** Atualizar a seção Risks do design.md para refletir a decisão real: float herdado na curva S preservado por paridade, dívida RNF-08 vinculada à futura change de persistência de baseline.
2. **(MIN-2)** Assertar a mensagem exata no teste de 404 do controller.spec — fecha o gap título×asserção recorrente do projeto.
3. **(MIN-4)** Adicionar o comentário "quirk herdado do legado" no `offerId: String(baselineId)` do `UpdateChangeOrderUseCase`, como já feito nos demais quirks.
4. **(MIN-3)** Nomear o `1` do fallback do seed (`SEED_BASELINE_ID`) ou promover a operação à porta, deixando o vínculo aplicação↔seed explícito.
5. **(MIN-5)** Eliminar o `newOrder.id!` do usecases.spec.ts para zerar os warnings novos do contexto.
6. Registrar no arquivamento: quando as tabelas de baseline existirem, entram juntos (a) adaptadores Prisma + unit of work, (b) correção do quirk de auditoria do MIN-4, (c) IDs de boletim/aditivo com regra sã, (d) quitação do float da curva S — os quatro estão hoje amarrados pela paridade com a simulação da F7.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero problemas críticos ou major. A migração é a mais fiel da série hexagonal até aqui: a superfície HTTP, os eventos de auditoria e até os quirks de ID do legado foram preservados byte a byte, e o desvio do plano (in-memory em vez de Prisma/unit of work) foi descoberto, verificado, documentado nos artefatos e implementado com coerência — as portas ficam como contrato para a persistência futura, que trocará apenas os adaptadores. Os 7 minors são dívidas herdadas documentadas ou ajustes de artefato/teste de baixo custo; recomendo aplicar MIN-1, MIN-2 e MIN-4 antes do commit do grupo (são edições de minutos) e seguir para o QA das jornadas de congelamento/aditivos/ERP previsto no design.

Verificação executada nesta review: `npx nx run-many -t test lint -p api --skip-nx-cache` (37 suítes / 185 testes ✅), `npx nx build api --skip-nx-cache` ✅, `npx nx format:check --all` ✅, BOM ausente nos arquivos novos ✅, schema Prisma e migrations intocados ✅, nenhum import residual de `apps/api/src/baseline/` ✅.
