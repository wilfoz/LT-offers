# Review do Grupo 3 — Interface web (tasks 3.1–3.3)

**Revisor**: AI Code Reviewer
**Data**: 2026-09-28
**Change / Grupo**: historico-leiloes-aneel / grupo 3
**Status**: Aprovado com observações

## Resumo

O grupo entrega a tela "Histórico de Leilões ANEEL" (rota lazy `auction-history`, item novo no menu da casca na 2ª posição) e o painel "Benchmark ANEEL" na aba de parâmetros do detalhe da oferta, conforme design D4/D5 e os cenários do spec `historico-leiloes-aneel`. A implementação é enxuta e fiel: `AuctionHistoryApi` com filtros condicionais via `HttpParams`, dois estados vazios distintos (sem importação × filtros sem resultado), badge "deserto" e "não informado" para nulos (RNF-09), sincronização com confirmação + snackbar de contagem/erro pt-BR preservando a tela, e o benchmark com os três estados do spec (sem identidade → orientação sem chamada à API; leilão ausente → aviso + base completa; lote publicado → resultado oficial lado a lado com o deságio derivado). Todas as lições institucionais de UI vieram aplicadas de primeira: callback de erro em toda leitura (testado), botão refletindo estado, mock default no `beforeEach`, sem BOM, `format:check --all` limpo.

Verificação executada nesta review: `npx nx run-many -t test lint -p web --skip-nx-cache` (375 testes / 68 arquivos, verde; 0 erros de lint), `npx nx format:check --all` (limpo), BOM ausente nos 8 arquivos tocados (`head -c3 | od`).

Único major: a coluna "Data" da tabela exibe a data crua em ISO `AAAA-MM-DD`, destoando da convenção institucional (`DatePipe 'dd/MM/yyyy' : 'UTC'` em 100% das demais telas) e de RNF-14.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| apps/web/src/app/auction-history/auction-history-api.service.ts | ✅ Ok | 0 |
| apps/web/src/app/auction-history/auction-history.component.ts | ⚠️ Problemas | 1 major, 3 minors |
| apps/web/src/app/auction-history/auction-history.component.spec.ts | ✅ Ok | 0 |
| apps/web/src/app/offers/offer-detail.component.ts | ⚠️ Problemas | 4 minors |
| apps/web/src/app/offers/offer-detail.component.spec.ts | ✅ Ok | 0 |
| apps/web/src/app/app.ts / app.routes.ts / app.spec.ts | ✅ Ok | 0 |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

**M1 — Data do leilão exibida em ISO cru, fora da convenção pt-BR do projeto**
`auction-history.component.ts:124` — a coluna "Data" renderiza `{{ row.auctionDate ?? 'não informado' }}`, exibindo `2024-09-27` em vez de `27/09/2024`. O contrato define `auctionDate: string | null // AAAA-MM-DD` (data civil), e TODAS as demais telas do app exibem datas com `DatePipe` (`| date: 'dd/MM/yyyy' : 'UTC'` nos 10+ históricos de catálogo e no offer-audit) — RNF-14 e convenção institucional. O spec só exige pt-BR explicitamente para monetários/percentuais, por isso não é crítico, mas é inconsistência visível ao usuário. Nenhum teste asserta a coluna (por isso passou). Correção:

```html
{{ row.auctionDate ? (row.auctionDate | date: 'dd/MM/yyyy' : 'UTC') : 'não informado' }}
```

(importar `DatePipe`; o parâmetro `'UTC'` evita o shift de fuso da string civil, mesma receita das telas de catálogo). Adicionar asserção `expect(text).toContain('27/09/2024')` no teste de formatos.

### 🟢 Problemas Minor

**MIN-1 — Formatação monetária via `Number(value).toLocaleString('pt-BR')` (1ª ocorrência na web)**
`auction-history.component.ts:315-321` e `offer-detail.component.ts` (`formatBenchmarkMoney`). O contrato entrega decimais como string (RNF-08) e aqui elas passam por double só para exibição. Aceitável: RNF-08 é sobre cálculo/persistência, e valores `Decimal(16,2)` até ~R$ 90 trilhões com 2 casas são exatos em double (dados reais ≤ ~3 bi). Registrado como PRECEDENTE DE EXIBIÇÃO — não pode migrar para cálculo. Se um dia incomodar, formatar a string diretamente (split inteiro/fração + `Intl.NumberFormat` no inteiro). Detalhe: valor malformado viraria `"NaN"` na tela (contrato tipado torna improvável; sem ação).

**MIN-2 — `formatMoney`/`formatPercent` duplicados entre a tela e o offer-detail (2ª ocorrência)**
`auction-history.component.ts:315-326` × `offer-detail.component.ts` (`formatBenchmarkMoney`/`formatBenchmarkPercent`) — corpos idênticos. A regra das três ocorrências ainda não dispara; na 3ª tela que formatar dinheiro/percentual pt-BR, extrair para helper compartilhado (`catalogs/form-utils.ts` ou domain).

**MIN-3 — `formatDateTime` com `toLocaleString('pt-BR')` (fuso e formato dependentes do runtime)**
`auction-history.component.ts:328-330` — a última importação usa `new Date(iso).toLocaleString('pt-BR')` enquanto o padrão institucional é `DatePipe 'dd/MM/yyyy HH:mm'`. Para um timestamp (instante, não data civil) o fuso local é semanticamente correto, e o teste prudentemente não asserta o formato exato; mas adotar o DatePipe aqui resolve M1 e MIN-3 com o mesmo import.

**MIN-4 — `loadAuctionBenchmark` sem cancelamento da requisição anterior**
`offer-detail.component.ts` — trocas rápidas de revisão (`selectRevision` → `syncRevisionToForm`) disparam subscribes concorrentes; respostas fora de ordem podem deixar o painel exibindo o benchmark da revisão anterior. Padrão de subscribe simples é o vigente no projeto e o risco prático é baixo (mesma base, respostas rápidas) — registrar; um `Subject` + `switchMap` resolveria se aparecer no QA.

**MIN-5 — Após erro do benchmark, o painel fica só com o cabeçalho**
`offer-detail.component.ts` — com identidade presente, `benchmarkLoading() === false` e `auctionBenchmarkData() === null` (estado pós-erro), nenhum ramo do `@if` renderiza: o painel mostra apenas o título. O snackbar avisa (cenário do spec atendido), mas a mensagem é transitória; considerar um ramo de fallback persistente ("Benchmark indisponível no momento").

**MIN-6 — `lastImport` da resposta do benchmark não é exibido no painel**
O design (Risks) diz "o benchmark mostra a data da última importação" para contextualizar dataset desatualizado na origem; a resposta traz `lastImport` e a UI o ignora. Exibir a data no rodapé do painel ou registrar a decisão de omitir (a tela do histórico já a exibe).

**MIN-7 — Ordem do import quebrada no bloco da domain**
`offer-detail.component.ts:36` — `AuctionBenchmarkResponse` inserido após `UpdateOfferRevisionPayload`, quebrando a ordem alfabética do bloco (cosmético; lint não cobre ordenação interna).

## ✅ Destaques Positivos

- **Cobertura exemplar dos cenários do spec**: 9 testes na tela (formatos pt-BR exatos `762.630.000,00`/`48,00%`, deserto, DOIS estados vazios distintos, filtros por igualdade completa, sync sucesso com contagem + reload assertado, sync erro com a mensagem exata da API + `results()` preservado + `syncing() === false`, cancelamento do confirm com `not.toHaveBeenCalled`, erro de leitura, botão disabled) e 4 no offer-detail (lote publicado com identidade da chamada `('004/2026', 4)` assertada, leilão ausente, sem identidade → `benchmark` NÃO chamado + orientação, erro → snackbar sem quebrar a aba).
- **Guard de estado correto**: `hasAuctionIdentity()` como helper tipado (nascido da correção do erro de `eqeqeq` no template — causa raiz, não supressão) e `loadAuctionBenchmark` limpando o painel quando a identidade é removida.
- **Refetch no `syncRevisionToForm` é a escolha certa**: salvar parâmetros pode alterar `auctionNumber`/`lotNumber`, então recarregar o benchmark após salvar mantém o painel coerente — o custo de um GET leve é aceitável.
- **`AuctionHistoryApi` limpo**: filtros condicionais com `trim()` (vazio não vira query param), contratos importados da domain, 58 linhas.
- **Mock default do benchmark no `beforeEach`** do offer-detail.spec evita quebrar os ~30 testes pré-existentes e vazamento entre testes (com `vi.clearAllMocks()`).
- **`data-testid`** (`last-import`, `empty-state`, `auction-benchmark`) preparando o QA E2E do grupo 4.
- **Casca**: rota lazy, item na 2ª posição com ícone `gavel`, app.spec atualizado na lista exata (16 itens) e no length.
- **Sem BOM** nos 8 arquivos (edição no Windows — lição de catalogo-cabos-tirante aplicada).

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ✅ Ok |
| Typescript/Node.js | ✅ Ok |
| Angular/NestJS/React | ⚠️ Problemas (M1: data ISO fora da convenção DatePipe) |
| REST/HTTP | ✅ Ok |
| Testes | ✅ Ok (375/375 verdes; gap pontual: coluna "Data" sem asserção) |
| Logging/Monitoramento | ✅ Ok (erros em snackbar com mensagem da API, padrão institucional) |

Observação: `confirm()` nativo na sincronização segue o padrão pré-existente do projeto (7 usos em offers/staking) — consistente, sem apontamento; dívida coletiva se um dia migrar para `MatDialog`.

## Recomendações

1. **(M1)** Formatar `auctionDate` com `DatePipe 'dd/MM/yyyy' : 'UTC'` na coluna "Data" e assertar `27/09/2024` no teste de formatos — antes do commit do grupo.
2. **(MIN-3)** Aproveitar o mesmo `DatePipe` para a última importação (`'dd/MM/yyyy HH:mm'`), alinhando com as demais telas.
3. **(MIN-5/MIN-6)** No painel de benchmark: ramo de fallback pós-erro e exibição da data da última importação (ou registrar a decisão de omitir) — podem entrar no grupo 4 junto com o QA.
4. **(MIN-2)** Não extrair ainda; na 3ª duplicação de `formatMoney`/`formatPercent`, mover para helper compartilhado.
5. **(MIN-4)** Observar no QA E2E se a troca rápida de revisões intercala respostas do benchmark; só então considerar `switchMap`.
6. **(MIN-7)** Reordenar o import de `AuctionBenchmarkResponse` quando tocar o arquivo de novo.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero críticos; um major de baixa gravidade e correção trivial (data ISO na coluna da tabela — recomendo corrigir antes do commit do grupo, com a asserção correspondente) e seis minors, dos quais dois (MIN-5/MIN-6) cabem naturalmente no grupo 4. Os três cenários de UI do spec (filtro por leilão, snapshot vazio, e os três estados do benchmark) estão implementados e testados; gates de teste, lint e formatação verificados verdes nesta review. Prosseguir para o grupo 4 (seed, fixture e QA E2E) após o ajuste do M1.

---

## Resolucao (pos-review, antes do commit do grupo)

- **M1 corrigido**: coluna de data da tabela usa DatePipe dd/MM/yyyy com UTC; assercao 27/09/2024 adicionada ao teste de formatos.
- **MIN-3 corrigido**: metadados da importacao usam DatePipe dd/MM/yyyy HH:mm (formatDateTime removido).
- **MIN-6 corrigido**: painel de benchmark exibe a data e a contagem do snapshot importado quando presentes.
- **MIN-7 corrigido**: import AuctionBenchmarkResponse reordenado alfabeticamente.
- MIN-1 (Number/toLocaleString como precedente de exibicao), MIN-2 (formatadores duplicados, 2a ocorrencia), MIN-4 (switchMap) e MIN-5 (estado pos-erro do painel) registrados; MIN-5 sera observado no QA do grupo 4.
