# Review dos Grupos 1–4 — Arquitetura Hexagonal no Contexto Economics

**Revisor**: AI Code Reviewer
**Data**: 2026-09-20
**Change / Grupo**: arquitetura-hexagonal-contexto-economics / grupos 1–4 (14/14 tasks)
**Status**: Aprovado com observações

## Resumo

Migração dos módulos legados `service-budget` (M09), `economic-result` (M10) e `cashflow` (M11) para o bounded context único `apps/api/src/contexts/economics/` com três agregados (decisão 1 do design), porta única `EconomicsDataQueryPort`, 8 casos de uso, mascaramento RNF-17 como função pura de domínio (decisão 2) e fachada `EconomicsFacadeService` de superfície mínima como único export do módulo (decisão 3). `export` e `baseline` religados à fachada; injeção morta de `CashflowService` removida de `progress-tracking.service.ts`; pastas legadas removidas sem referência órfã.

A verificação byte a byte contra o legado deletado (`git show HEAD:...`) confirma **zero regressão de contrato HTTP**: as 9 rotas dos 3 controllers idênticas, mensagens 404 pt-BR exatas ("Linha de transmissão ID X não encontrada." / "Oferta ID X não encontrada."), mascaramento idêntico campo a campo (incl. `bdiMultiplier: '1.0000'`), decorators `@UseGuards(RolesGuard)`/`@RequireScopes`/`@Audited` preservados com os mesmos escopos e descrições, e todos os comportamentos herdados deliberados intactos (última revisão sem `orderBy`, fallback `getLine*(1)`, `lineSummaries[0].lines` no consolidado, custos paramétricos e curvas mensais verbatim). Os dois achados major são de cobertura de teste, não de comportamento.

**Verificação executada**: `npx nx run-many -t test lint build -p api --skip-nx-cache` verde (lint 0 errors / 218 warnings pré-existentes, build webpack ok); recorte economics+export+baseline: 8 suítes, 41 testes passando; `npx nx format:check --all` exit 0; nenhum BOM nos arquivos novos; grep sem referências aos caminhos legados.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `contexts/economics/domain/entities/economics-line-data.ts` | ✅ Ok | 0 |
| `contexts/economics/domain/entities/default-coefficients.ts` | ✅ Ok | 0 |
| `contexts/economics/domain/exceptions/economics.exceptions.ts` | ✅ Ok | 0 |
| `contexts/economics/domain/services/mask-economic-result.ts` (+spec) | ✅ Ok | 0 |
| `contexts/economics/domain/ports/` (port, tokens, barrel) | ✅ Ok | 0 |
| `contexts/economics/application/usecases/*.usecase.ts` (8 arquivos) | ✅ Ok | 0 |
| `contexts/economics/application/usecases/usecases.spec.ts` | ⚠️ Problemas | 1 major |
| `contexts/economics/application/services/economics-facade.service.ts` | ✅ Ok | 0 |
| `contexts/economics/infrastructure/database/prisma/prisma-economics-data-query.adapter.ts` | ✅ Ok | 1 minor |
| `contexts/economics/infrastructure/http/controllers/service-budget.controller.ts` | ⚠️ Problemas | 1 major (compartilhado) |
| `contexts/economics/infrastructure/http/controllers/cashflow.controller.ts` | ⚠️ Problemas | 1 major (compartilhado) |
| `contexts/economics/infrastructure/http/controllers/economic-result.controller.ts` (+spec) | ✅ Ok | 0 |
| `contexts/economics/infrastructure/economics.module.ts` | ⚠️ Problemas | 2 minors |
| `contexts/economics/index.ts` + barrels | ✅ Ok | 0 |
| `export/export.service.ts` / `export.module.ts` | ✅ Ok | 0 |
| `export/export.service.spec.ts` | ⚠️ Problemas | 1 minor |
| `baseline/baseline.service.ts` / `baseline.module.ts` / `progress-tracking.service.ts` | ✅ Ok | 0 |
| `baseline/baseline.service.spec.ts` | ⚠️ Problemas | 1 minor (compartilhado) |
| `app/app.module.ts` / `app/context-modules-di.spec.ts` | ✅ Ok | 0 |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

**M1 — `ServiceBudgetController` e `CashflowController` sem spec: o mapeamento exceção de domínio → 404 está sem teste em 2 dos 3 controllers**

- `apps/api/src/contexts/economics/infrastructure/http/controllers/service-budget.controller.ts:24-31, 38-45`
- `apps/api/src/contexts/economics/infrastructure/http/controllers/cashflow.controller.ts:34-45, 58-72`

O bloco `try/catch` que traduz `EconomicsLineNotFoundException`/`EconomicsOfferNotFoundException` em `NotFoundException` HTTP é o único código genuinamente **novo** desses controllers (no legado o service lançava `NotFoundException` direto) — e não tem nenhum teste. Só o `EconomicResultController` ganhou spec. A task 3.2 prometia "testes de controller preservando as asserções do legado" para os três; e o legado tinha a garantia HTTP do 404 assertada (`service-budget.service.spec.ts` legado: `rejects.toThrow(NotFoundException)`), que agora existe apenas em nível de domínio (mensagem da exceção no `usecases.spec.ts:46-53`). Se alguém remover o catch ou errar o `instanceof` num refactor, a rota passa a devolver 500 e nenhum teste quebra.

Correção sugerida: specs `service-budget.controller.spec.ts` e `cashflow.controller.spec.ts` no padrão do `economic-result.controller.spec.ts:91-102` (assertando tipo **e** mensagem exata), cobrindo no cashflow consolidado também o caso `EconomicsOfferNotFoundException`:

```typescript
it('deve converter exceção de domínio em 404 com mensagem em português', async () => {
  getLineServiceBudgetMock.execute.mockRejectedValue(
    new EconomicsLineNotFoundException(99),
  );
  await expect(controller.getServiceBudget(99)).rejects.toThrow(
    NotFoundException,
  );
  await expect(controller.getServiceBudget(99)).rejects.toThrow(
    'Linha de transmissão ID 99 não encontrada.',
  );
});
```

**M2 — Asserções relacionais dos specs legados descartadas na migração (equivalência não preservada)**

- `apps/api/src/contexts/economics/application/usecases/usecases.spec.ts:36-44` — o legado (`service-budget.service.spec.ts`) assertava `totalDirectCost > 0`, `totalSalePrice > totalDirectCost` e `ratios.costPerKm` definido; o novo asserta apenas `totalSalePrice > 0`.
- `apps/api/src/contexts/economics/application/usecases/usecases.spec.ts:66-74` — o legado (`economic-result.service.spec.ts`) assertava `lines.length >= 3`, `totalSalePrice > totalCostWithTaxes` e `coefficients` definido; o novo asserta `totalSalePrice > 0` e `totalCostWithTaxes > 0` isolados.

As asserções relacionais (venda > custo) são as que pegam erro de fiação dos inputs do calculador (trocar custo por venda mantém ambos positivos). O critério da change era preservação de cobertura; aqui houve afrouxamento sistemático em 2 dos 3 agregados. No cashflow o saldo foi positivo (asserção de soma 2× é mais forte que o legado), faltando só `financialExposure.recommendedWorkingCapital` — tratado como parte deste item.

Correção sugerida: reincorporar as asserções descartadas nos `it`s existentes — são 6 linhas:

```typescript
expect(Number(summary.totalDirectCost)).toBeGreaterThan(0);
expect(Number(summary.totalSalePrice)).toBeGreaterThan(
  Number(summary.totalDirectCost),
);
expect(summary.ratios.costPerKm).toBeDefined();
// M10:
expect(result.lines.length).toBeGreaterThanOrEqual(3);
expect(Number(result.totalSalePrice)).toBeGreaterThan(
  Number(result.totalCostWithTaxes),
);
expect(result.coefficients).toBeDefined();
```

### 🟢 Problemas Minor

**MIN-1 — Mocks dos consumidores mantêm nomes do legado fornecendo a fachada**

- `apps/api/src/export/export.service.spec.ts:34, 56, 92` — `mockEconomicResultService` e `mockCashflowService` são fundidos (`{ ...a, ...b }`) como `useValue` da `EconomicsFacadeService`; o merge esconde a superfície real da fachada e os nomes referenciam classes que não existem mais.
- `apps/api/src/baseline/baseline.service.spec.ts:27, 45-47` — idem (`mockEconomicResultService` → fachada).

Sugestão: um único `mockEconomicsFacade` com os 3 métodos da fachada nomeados explicitamente. Cosmético; as asserções continuam válidas.

**MIN-2 — `EconomicsFacadeService` listado dentro do array `useCases` do módulo**

- `apps/api/src/contexts/economics/infrastructure/economics.module.ts:20-30` — a fachada não é caso de uso; o nome do agrupador mente. Separar (`providers: [..., ...useCases, EconomicsFacadeService]`) documenta melhor a fronteira que o próprio comentário das linhas 47-48 descreve.

**MIN-3 — Adaptador registrado duas vezes gera duas instâncias**

- `apps/api/src/contexts/economics/infrastructure/economics.module.ts:40-44` — `PrismaEconomicsDataQueryAdapter` aparece como provider de classe **e** como `useClass` do token (o `useClass` cria instância própria, não reutiliza a do provider de classe). Inócuo (adaptador sem estado) e idêntico ao padrão de pricing/foundations/staking — registrado aqui para a limpeza transversal futura (trocar por `useExisting`), não para correção nesta change.

**MIN-4 — Fachada sem teste direto**

- `apps/api/src/contexts/economics/application/services/economics-facade.service.ts` — delegação pura sem spec próprio; cobertura indireta via `context-modules-di.spec.ts` e specs de export/baseline. Precedente aceito em refits (catalogo-cabos-tirante); registrado por completude.

## ✅ Destaques Positivos

1. **Contratos HTTP byte a byte**: diff mental contra `git show HEAD:` confirma as 9 rotas, escopos (`OFFER_READ`, `COMMERCIAL_WRITE`, `COMMERCIAL_READ_SENSITIVE`), descrições `@Audited` e parse de query params (`parseFloat`/`parseInt` com defaults 10/5/1 e 0/1) idênticos ao legado. O import morto `Roles` do legado foi corretamente descartado.
2. **Comportamentos herdados preservados e documentados**: última revisão sem `orderBy` comentada no adapter (`prisma-economics-data-query.adapter.ts:52-53`) e na porta; `lines: lineSummaries[0].lines` do consolidado mantido com o comentário original (`get-consolidated-economic-result.usecase.ts:82`) — a tentação de "corrigir" o envelope foi resistida; fallback `execute(1, ...)` para oferta sem linhas intacto nos dois consolidados.
3. **Sem N+1 novo**: o consolidado preserva exatamente o padrão do legado (1 query da oferta + 1 por linha via caso de uso de linha, em `Promise.all`); o adapter até enxugou um join inútil do legado (`offer: true` dentro de `offerRevision` era buscado e nunca usado) sem mudança observável.
4. **Mascaramento como domínio (decisão 2) exemplar**: função pura idêntica campo a campo ao legado; spec deriva os papéis de `CANONICAL_USERS` via `canViewSensitiveCommercialData` (não hardcoda papel) e asserta que custos não sensíveis permanecem visíveis (`mask-economic-result.spec.ts:60-61`).
5. **Lições institucionais aplicadas de primeira**: `@Inject(PrismaService)` no construtor de união do adaptador (bug de DI de contextos anteriores); `EconomicsModule` adicionado ao teste de regressão de DI (7 módulos); spec de controller asserta tipo **e** mensagem exata do 404 (sem gap título×asserção); `format:check --all` limpo antes da entrega; nenhum BOM (arquivos gerados no Windows).
6. **Decisão 3 cumprida à risca**: fachada com exatamente os 3 métodos que export/baseline consomem, módulo exporta apenas a fachada (diferente de pricing, que exporta use cases — aqui a fronteira é mais estrita, como o design pede); consumidores importam pelo barrel do contexto, consistente com pricing→foundations.
7. **Limpeza completa**: grep confirma zero referência aos caminhos legados; injeção morta de `CashflowService` em `progress-tracking.service.ts` removida junto com o mock morto (`getCashflowSummary` — método que nunca existiu no service real — sumiu do codebase).

## Conformidade com Padrões

| Padrão | Status |
|--------|--------|
| Padrões de Código | ✅ Ok |
| Typescript/Node.js | ✅ Ok |
| Angular/NestJS/React | ✅ Ok |
| REST/HTTP | ✅ Ok (contratos preservados byte a byte) |
| Testes | ⚠️ Problemas (M1, M2) |
| Logging/Monitoramento | ✅ Ok (sem mudança de superfície) |

Notas: código 100% em inglês com comentários/mensagens/describes em pt-BR (RNF-14); Decimal→string no adapter (RNF-08, `?.toString() ?? null`); nenhuma leitura de relógio nas camadas internas. As linhas >80 colunas existentes são imports/identificadores longos que o Prettier não quebra — `format:check --all` passa (o gate do CI está verde; não é o major de formatação recorrente).

## Recomendações

1. **(M1)** Criar `service-budget.controller.spec.ts` e `cashflow.controller.spec.ts` cobrindo o mapeamento domínio→404 com tipo e mensagem exata, no padrão do spec do economic-result (incluir o caso de oferta inexistente no cashflow consolidado).
2. **(M2)** Reincorporar em `usecases.spec.ts` as asserções relacionais do legado (venda > custo direto, venda > custo com impostos, `ratios.costPerKm`, `lines.length >= 3`, `coefficients`, `recommendedWorkingCapital`).
3. **(MIN-1)** Renomear/fundir os mocks de export/baseline num `mockEconomicsFacade` explícito com os 3 métodos da fachada.
4. **(MIN-2)** Tirar a fachada do array `useCases` do módulo.
5. **(MIN-3, futuro)** Na próxima limpeza transversal dos contextos, trocar o padrão duplo classe+`useClass` por `useExisting` em todos os módulos (6 ocorrências no repo).

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero problemas críticos e zero regressão de contrato: a migração é fiel ao legado deletado nos 9 endpoints, no mascaramento RNF-17 e em todos os comportamentos herdados deliberados, com as três decisões do design cumpridas e todos os gates verdes (test/lint/build, format:check --all, DI real). Os dois majors são lacunas de cobertura de teste introduzidas na migração (404 sem teste em 2 controllers; asserções relacionais afrouxadas) — corrigíveis em minutos, recomendo fechá-los antes do commit do grupo, junto com os minors 1 e 2 se conveniente. MIN-3 fica registrado como dívida transversal dos contextos, fora desta change.
