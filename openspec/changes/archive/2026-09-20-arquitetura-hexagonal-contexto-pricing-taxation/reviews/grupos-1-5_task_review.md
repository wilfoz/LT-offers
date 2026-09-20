# Review dos Grupos 1–5 — Arquitetura Hexagonal nos Contextos Pricing e Taxation

**Revisor**: AI Code Reviewer
**Data**: 2026-09-20
**Change / Grupo**: arquitetura-hexagonal-contexto-pricing-taxation / grupos 1–5 (14/14 tasks, incl. 5.4 de trabalho descoberto)
**Status**: APROVADO COM OBSERVAÇÕES

## Resumo

Migração dos módulos legados `apps/api/src/taxation/` e `apps/api/src/pricing/` para os bounded contexts `apps/api/src/contexts/taxation/` e `apps/api/src/contexts/pricing/` (domain/application/infrastructure, portas com tokens `Symbol`, fachada `TaxationFacadeService` consumida por pricing, `FoundationsFacadeService` preservada), com remoção do legado na mesma change. A comparação linha a linha com o código deletado (`git show HEAD:...`) confirma **contratos HTTP preservados byte a byte** nas rotas `/api/taxation/*` (envelopes com alíquotas em number, ordem de chaves idêntica) e `/api/lines/:lineId/pricing/*` (incluindo a mensagem 404 pt-BR "Linha de transmissão com ID X não encontrada", agora via exceção de domínio mapeada no controller — padrão foundations). Todas as asserções dos specs legados foram preservadas e a cobertura aumentou (6 testes legados → 22 testes novos nos arquivos migrados + DI).

O destaque da change é a task 5.4: um bug crítico real de bootstrap (construtores com união `PrismaService | Prisma.TransactionClient` emitem paramtype `Object` e o Nest não resolvia — a API não subia desde a migração hexagonal) foi corrigido nos 18 construtores afetados e blindado com o teste permanente `apps/api/src/app/context-modules-di.spec.ts`, que compila os 6 módulos de contexto com DI real. Essa classe de falha era invisível a testes puros e ao build — o teste fecha a lacuna de forma estrutural.

Verificação executada nesta review: `npx nx run-many -t test lint build -p api` (35 suítes, **161 testes verdes**, lint 0 erros/217 warnings pré-existentes fora dos arquivos novos, build webpack ok) e `npx nx format:check --all` limpo. Nenhum BOM UTF-8 nos arquivos novos (verificado `head -c3`). Nenhuma referência restante aos caminhos legados (`grep` limpo).

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `contexts/taxation/domain/entities/uf-state-tax-profile.ts` | ✅ Ok | 0 |
| `contexts/taxation/domain/services/tax-rules.ts` | ✅ Ok | 0 |
| `contexts/taxation/domain/ports/{tax-rules-query.port,tokens}.ts` | ✅ Ok | 0 |
| `contexts/taxation/application/usecases/{get-states,get-tax-rules-map}.usecase.ts` | ✅ Ok | 0 |
| `contexts/taxation/application/usecases/usecases.spec.ts` | ✅ Ok | 1 minor (MIN-5) |
| `contexts/taxation/application/services/taxation-facade.service.ts` | ✅ Ok | 0 |
| `contexts/taxation/infrastructure/static/static-tax-tables.adapter.ts` | ✅ Ok | 0 |
| `contexts/taxation/infrastructure/http/controllers/taxation.controller.{ts,spec.ts}` | ✅ Ok | 0 |
| `contexts/taxation/infrastructure/taxation.module.ts` | ⚠️ Problemas | 1 minor (MIN-2) |
| `contexts/pricing/domain/**` (entities, exceptions, ports, tokens) | ✅ Ok | 1 minor (MIN-4) |
| `contexts/pricing/application/usecases/calculate-line-pricing.usecase.ts` | ⚠️ Problemas | 1 minor (MIN-3) |
| `contexts/pricing/application/usecases/{get-quotes.usecase,usecases.spec}.ts` | ✅ Ok | 1 minor (MIN-5) |
| `contexts/pricing/infrastructure/database/prisma/prisma-pricing-data-query.adapter.ts` | ✅ Ok | 0 |
| `contexts/pricing/infrastructure/static/static-quotes.adapter.ts` | ✅ Ok | 0 |
| `contexts/pricing/infrastructure/http/controllers/pricing.controller.{ts,spec.ts}` | ✅ Ok | 0 |
| `contexts/pricing/infrastructure/pricing.module.ts` | ⚠️ Problemas | 2 minors (MIN-1, MIN-6) |
| `app/context-modules-di.spec.ts` | ✅ Ok | 0 |
| `app/app.module.ts` | ✅ Ok | 0 |
| 18 repositórios com `@Inject(PrismaService)` (catalogs ×13, offers ×2, staking ×2, pricing ×1) | ✅ Ok | 0 |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

**MIN-1 — Cada módulo de contexto re-provê `PrismaService` apesar do `PrismaModule` ser `@Global()`** — `contexts/pricing/infrastructure/pricing.module.ts:20`. O `PrismaModule` global (`app/prisma.module.ts`) já exporta o `PrismaService`; registrá-lo localmente cria uma **segunda instância de PrismaClient (e pool de conexões)** por módulo — hoje são 6+ instâncias no app (foundations, staking, catalogs, offers fazem o mesmo). Padrão pré-existente, apenas seguido aqui — não é regressão desta change, mas o PricingModule era a oportunidade de não propagar. Correção sugerida: remover `PrismaService` dos providers locais dos módulos de contexto e confiar no global (dívida transversal; validar com o `context-modules-di.spec.ts`, que já cobriria a mudança).

**MIN-2 — `TaxationModule` exporta mais que a fachada** — `contexts/taxation/infrastructure/taxation.module.ts:27`. A decisão 2 do design diz "módulos NestJS exportam a fachada, nunca repositórios ou adaptadores", mas o módulo exporta `TAX_RULES_QUERY_PORT_TOKEN` (que entrega o `StaticTaxTablesAdapter` a qualquer importador) e os dois use cases. O pricing consome apenas a `TaxationFacadeService` (verificado por grep) — a superfície extra é peso morto que convida a acoplamento futuro. Segue o precedente do `FoundationsModule` (que exporta tokens + use cases), então é o padrão da casa em conflito com a redação do design. Correção sugerida: restringir `exports` a `[TaxationFacadeService]` (e avaliar o mesmo aperto no foundations em change futura), ou ajustar a redação do design.

**MIN-3 — Métodos acima do limite de 50 linhas e números mágicos preservados do legado** — `contexts/pricing/application/usecases/calculate-line-pricing.usecase.ts:40` (`execute`, ~73 linhas) e `:117` (`buildMaterialPricingItems`, ~108 linhas, com as constantes paramétricas 25 t/km, 12 t/km, 1.05, 28, 3, 2400, 450, 5.5, 3200 e os defaults `'MG'`/`'SP'` inline). O código foi movido **verbatim** do `pricing.service.ts` legado — decisão correta para uma change de migração (zero risco de regressão numérica), mas a dívida deve ficar registrada: quando a estimativa paramétrica virar cálculo real, extrair as constantes nomeadas (ex.: `TOWER_STEEL_TONS_PER_KM`) e quebrar `buildMaterialPricingItems` por família de material.

**MIN-4 — Nomenclatura divergente da task e abreviação `Uf`** — `contexts/taxation/domain/entities/uf-state-tax-profile.ts:6`. A task 1.1 nomeia a entidade `UfState`; a implementação entregou `UfStateTaxProfile` (nome melhor, mas o tasks.md não foi ajustado). Além disso `Uf` é abreviação pt-BR em identificador inglês e "UF state" é redundante (UF = unidade federativa = state). Aceitável — UF é termo consagrado do domínio tributário (o próprio legado usava "UFs") — mas registre-se: `StateTaxProfile` diria o mesmo sem o híbrido.

**MIN-5 — Testes de aplicação usam adaptadores de infraestrutura como dublês** — `contexts/taxation/application/usecases/usecases.spec.ts:18` e `contexts/pricing/application/usecases/usecases.spec.ts:50,55`. As tasks 1.2/3.2 prometem "dublês de porta em memória", mas os specs instanciam `StaticTaxTablesAdapter`/`StaticQuotesAdapter` reais (application → infrastructure, e no caso do pricing, infraestrutura de **outro** contexto via barrel). A justificativa está em comentário no próprio spec (o adaptador é puro, sem I/O, e carrega as tabelas oficiais — é o que preserva as asserções de dados reais do spec legado) e o teste extra "dublê mínimo" (taxation `usecases.spec.ts:52`) prova que a derivação funciona com qualquer porta. Aceito com a justificativa; se as tabelas migrarem para Prisma, esses specs precisarão de fixtures próprias.

**MIN-6 — Adaptadores registrados duas vezes (classe + token `useClass`)** — `contexts/pricing/infrastructure/pricing.module.ts:21-30` e `taxation.module.ts:20-24`. Registrar a classe do adaptador E o token com `useClass` instancia cada adaptador duas vezes. Inócuo (adaptadores sem estado) e idêntico ao padrão do foundations, mas a instância avulsa da classe não tem consumidor — pode ser removida quando MIN-1 for tratado.

## ✅ Destaques Positivos

1. **Task 5.4 é o achado da change**: o bug de DI (união de tipos → paramtype `Object`) derrubava o bootstrap de TODOS os contextos hexagonais e era invisível aos testes puros e ao build. O fix (`@Inject(PrismaService)` explícito — verificados 18/18 construtores por grep, nenhum construtor de união sem o decorator) veio com o teste permanente `app/context-modules-di.spec.ts`, que compila os 6 módulos com DI real e comenta com precisão por que não precisa de banco (`PrismaService` só conecta no `onModuleInit`, que `Test.compile()` não dispara) e por que o `AuthModule` entra junto (é `@Global()` no app real). É exatamente o tipo de teste de regressão estrutural que faltava na série de migrações.
2. **Contratos preservados de verdade, com prova**: o envelope de `GET /api/taxation/states` mantém até a ordem de chaves do legado (`{code, name, internalRate, fecoepRate, difalMethod}` via `{code, ...data}`); a matriz ICMS e o catálogo IPI são idênticos; os testes de controller assertam envelopes por **igualdade completa** (`toEqual`) em vez de `toBeDefined` — lição institucional aplicada de primeira.
3. **Decisão 5 revisada com honestidade**: ao descobrir que as tabelas tributárias e cotações são estáticas em código, a implementação NÃO inventou um adaptador Prisma especulativo — criou `StaticTaxTablesAdapter`/`StaticQuotesAdapter` atrás das portas e documentou no design que só o adaptador muda quando a fonte migrar. As derivações (`buildIcmsRulesMap`, `resolvePisCofinsRule`) viraram funções puras em `taxation/domain/services/tax-rules.ts`, testáveis sem Nest.
4. **Coerções numéricas do legado preservadas na fronteira Decimal→string**: analisei os casos de borda (`Decimal(0)` truthy no legado vs `"0"` truthy no novo, fallbacks `|| 100`) — o comportamento é idêntico em todos os caminhos de `execute()`. O adaptador `PrismaPricingDataQueryAdapter` aplica RNF-08 (`.toString()` com `?? null`) e a porta `PricingLineData` tipa decimais como `string | null`, documentando o contrato.
5. **Limpeza colateral correta**: o `include` morto do legado (`offerRevision.offer` + `scopeMatrixItems`, carregados e nunca usados) foi removido do `findUnique` — menos I/O sem mudança observável.
6. **Cobertura ampliada além da paridade**: 404 de domínio no use case E no controller (com mensagem pt-BR assertada literalmente — sem gap título×asserção), ordem do catálogo de cotações, dublê mínimo da matriz ICMS (operação interna usa alíquota do destino), repasse das opções de simulação.
7. **Idiomas e formatação em dia**: identificadores em inglês, comentários/mensagens/`describe`/`it` em pt-BR (RNF-14); `nx format:check --all` limpo na primeira entrega (a série histórica de reincidências do gate segue quebrada); sem BOM UTF-8.

## Conformidade com Padrões

| Padrão | Status |
|--------|--------|
| Padrões de Código | ⚠️ Problemas (MIN-3/MIN-4, legado movido verbatim) |
| Typescript/Node.js | ✅ Ok |
| Angular/NestJS/React | ⚠️ Problemas (MIN-1/MIN-2/MIN-6, padrão herdado dos contextos anteriores) |
| REST/HTTP | ✅ Ok (contratos byte a byte, 404 pt-BR preservado) |
| Testes | ✅ Ok (asserções legadas preservadas + regressão de DI) |
| Logging/Monitoramento | ✅ Ok (sem mudanças; `catch {}` do fallback de fundações é comportamento legado preservado) |

## Recomendações

1. (MIN-2) Restringir `exports` do `TaxationModule` a `[TaxationFacadeService]` — pricing não usa mais nada; ou registrar no design que o padrão da casa (herdado do foundations) é exportar tokens + use cases.
2. (MIN-1/MIN-6) Abrir dívida transversal: remover `PrismaService` dos providers locais dos 6 módulos de contexto (confiar no `PrismaModule` global) e eliminar o registro duplicado classe+token dos adaptadores; o `context-modules-di.spec.ts` valida a mudança de graça.
3. (MIN-3) Quando o pricing paramétrico virar cálculo real (cotações no banco), extrair constantes nomeadas e quebrar `buildMaterialPricingItems`; aproveitar para reavaliar o `catch {}` silencioso do fallback de fundações (hoje engole também erros de programação).
4. (MIN-4) Ajustar a task 1.1 (`UfState` → `UfStateTaxProfile`) e a task 4.2 (menciona um "presenter" que não existe — o controller repassa o summary do calc-engine diretamente) para que o tasks.md reflita o entregue.
5. (MIN-5) Registrar que os specs de aplicação dependem dos adaptadores estáticos; ao migrar as tabelas para Prisma, criar fixtures em memória próprias dos specs.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero problemas críticos ou majors. A migração preserva os contratos HTTP byte a byte (verificado contra o código deletado), mantém todas as asserções dos testes legados, aumenta a cobertura e ainda corrige um bug crítico de bootstrap que afetava todos os contextos hexagonais — com teste de regressão permanente. Os seis minors são dívidas de padrão herdado (Prisma por módulo, superfície de exports) ou redação de artefatos; nenhum bloqueia commit. Próximos passos: aplicar as recomendações 1 e 4 (baratas, dentro da change) antes do commit se desejado; 2, 3 e 5 são dívidas registradas para changes futuras.
