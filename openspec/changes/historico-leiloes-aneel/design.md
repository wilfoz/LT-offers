## Context

Ver `proposal.md` (Why) e o levantamento de 27/09/2026. Estado atual relevante:

- Fonte: CKAN da ANEEL, `datastore_search` com `resource_id 453cb742-8089-4c16-aaf2-42088b5553dc` (488 linhas, 1999 → Leilão 002/2024; atualização irregular — sem 4/2025 e 1/2026 apesar do rótulo "mensal"). Campos relevantes: `AnoLeilao`, `DatLeilao`, `NumLeilao` (`002/2024`), `NumLoteLeilao` (numérico), `NomEmpreendimento`, `SigUFPrincipal` (`CE/PI`), `QtdPrazoConstrucaoMeses`, `MdaExtensaoLinhaTransmissaoKm`, `MdaSubEstacoesMVA`, `VlrInvestimentoPrevisto`, `VlrRAPEditalLeilao`, `NomVencedorLeilao`, `VlrRAPVencedorLeilao`, `PctDesagio`.
- Armadilhas verificadas: números publicados como **texto com vírgula decimal** (`"2933612926,94"`); `PctDesagio` é **fração** (`"0,48"` = 48%); filtro em campo numérico do datastore exige número JSON; `datastore_search_sql` retorna HTTP 400; paginação default de 100 registros.
- A revisão da oferta já tem `auctionNumber` (`NNN/AAAA`) e `lotNumber` (change `identidade-leilao-e-prazos`) — chave de cruzamento com `NumLeilao`/`NumLoteLeilao`.
- Padrões vigentes: contextos hexagonais em `apps/api/src/contexts/` com `@Inject(PrismaService)` explícito e cobertura no `context-modules-di.spec.ts`; fonte externa atrás de porta com adapter (precedente `Static*Adapter` e `AuditServiceTrailAdapter`); decimal nunca float (RNF-08); null ≠ zero (RNF-09); menu da casca assertado por lista exata no `app.spec`.

## Goals / Non-Goals

**Goals:**

- Snapshot local completo do dataset, substituído atomicamente a cada sincronização manual, com log imutável de importações.
- Toda a normalização do dataset (vírgula, fração, formato do número do leilão, lote deserto) em funções puras da domain, testáveis sem rede.
- Benchmark de deságio no detalhe da oferta calculado só a partir do snapshot.

**Non-Goals:**

- Sincronização automática/agendada (o disparo é manual; agendamento pode vir com a infra de rotinas).
- Fallback de importação por arquivo (XLSX oficial) — registrado como plano B se o CKAN for descontinuado.
- Editais e leilões futuros (não estruturados na ANEEL — SPA sem API) e dados do SIGET (benchmark torres/km, change futura).
- Viabilidade do lote para o licitante (change D usa este snapshot como referência de deságios praticados).
- Vincular o snapshot a ofertas fechadas (RNF-05): o histórico é referencial informativo exibido em leitura, não entrada de cálculo — uma oferta fechada não "congela" o benchmark.

## Decisions

### D1. Modelo de dados: snapshot substituível + log imutável de importações

| Modelo | Campos principais |
| --- | --- |
| `AuctionResultImport` (`auction_result_import`) | `id`, `source` (texto, ex. URL do datastore ou `seed`), `rowCount Int`, `importedBy`, `importedAt` — somente inserção, nunca alterado |
| `AuctionResult` (`auction_result`) | `auctionYear Int`, `auctionDate DateTime? @db.Date`, `auctionNumber String @db.VarChar(15)`, `lotNumber Int`, `projectName String`, `mainUf String? @db.VarChar(30)`, `constructionDeadlineMonths Int?`, `lineLengthKm Decimal?(12,3)`, `substationMva Decimal?(12,2)`, `estimatedInvestment Decimal?(16,2)`, `maxRap Decimal?(16,2)`, `winnerName String?`, `winningRap Decimal?(16,2)`, `discountPercent Decimal?(5,2)`, `importId` (FK) |

A sincronização roda em transação: apaga o snapshot, insere as linhas novas e registra a importação — sucesso total ou nada (o cenário "falha não corrompe o snapshot" cai de graça). Índice em `(auction_number, lot_number)` **sem unique**: o dataset é externo e não rejeitamos linhas; multiplicidade inesperada aparece na consulta e no benchmark (que usa a primeira correspondência) em vez de derrubar a importação. Rationale do replace-all: diferente dos catálogos (RNF-05), o histórico não alimenta cálculo de oferta — versionar cada linha por vigência só adicionaria crescimento sem consumidor; o log preserva a rastreabilidade de quando/qual fonte.

Alternativa rejeitada: manter todas as importações com dados completos (snapshot por importação) — custo de armazenamento e consulta sem requisito que o justifique.

### D2. Normalização em funções puras na domain

`libs/domain/src/lib/auction-history/auction-history.ts` (contratos) e `auction-normalization.ts`:

- `parseAneelDecimal(text)` — `"2933612926,94"` → `"2933612926.94"`; vazio/`"-"`/inválido → `null` (nunca zero).
- `fractionToPercent(text)` — `"0,48"` → `"48.00"` (duas casas, half-up, via decimal.js já presente na domain).
- `normalizeAuctionNumber(text)` — normaliza para `NNN/AAAA` (pad de zeros à esquerda: `"2/2024"` → `"002/2024"`); irreconhecível → `null`.
- `normalizeAuctionResult(raw)` — mapeia um registro cru do datastore para o contrato tipado, aplicando as três funções e a regra do lote deserto (sem vencedor → `winnerName`/`winningRap`/`discountPercent` nulos).
- `auctionBenchmark(rows)` — estatísticas puras (deságio mín/médio/máx com duas casas, contagem de lotes e desertos) sobre uma lista de resultados, usada pela API para o leilão específico e para a base completa.

Rationale: as armadilhas do dataset ficam num único lugar testável sem rede, e a web reusa `auctionBenchmark`/contratos se precisar (mesmo padrão de `offer-derivations`).

### D3. Contexto hexagonal `auction-history` com porta para a fonte externa

- Porta `AneelAuctionResultsPort { fetchAll(): Promise<RawAuctionResultRecord[]> }` + token; adapter `CkanAneelAuctionResultsAdapter` com `fetch` nativo do Node, paginação por `offset` até `total` (page size 500), timeout explícito (AbortController) e erros traduzidos para exceção de domínio com mensagem pt-BR (indisponível / resposta fora do esquema). Nenhuma dependência nova.
- Use cases: `sync-auction-results` (porta → normalização da domain → transação replace-all → evento de auditoria com contagem), `list-auction-results` (busca textual + filtros leilão/UF/ano + metadados da última importação), `get-auction-benchmark` (por `auctionNumber`+`lotNumber`: resultado do lote, `auctionBenchmark` do leilão e da base completa).
- Controller `auction-history.controller.ts`: `POST /auction-history/sync` (auditado, autor via `X-User`), `GET /auction-history/results`, `GET /auction-history/benchmark`. Módulo registra Prisma com `@Inject(PrismaService)` e entra no `context-modules-di.spec.ts` (lição da change pricing-taxation).
- Testes de use case com adapter fake em memória (registros crus com as armadilhas reais do dataset); o adapter HTTP tem teste de unidade do parsing de página/erro com `fetch` mockado — nenhum teste toca a rede.

### D4. Benchmark no detalhe da oferta

O painel vive na aba "Parâmetros e Datas da Revisão" (onde já estão identidade e deságio derivado), alimentado por `GET /auction-history/benchmark` com a identidade da revisão selecionada. Estados: sem identidade → orientação (sem chamada); sem correspondência de leilão → estatísticas da base completa + aviso "sem resultado publicado"; com lote → resultado oficial lado a lado com o deságio derivado. Erros de leitura em snackbar (padrão institucional), sem quebrar a aba.

### D5. Tela "Histórico de Leilões ANEEL"

Rota `auction-history`, item novo no menu da casca (atualizar o `app.spec` que asserta a lista exata). Tabela com paginação client-side simples (≈500 linhas), busca textual (empreendimento/vencedor), filtros por leilão, UF e ano; cabeçalho com metadados da última importação e botão "Sincronizar com a ANEEL" (confirmação + snackbar de resultado com contagem; erro pt-BR preserva a tela). Estado vazio orienta a primeira sincronização.

### D6. Seed com subconjunto real commitado

`prisma/fixtures/aneel-auction-results.json` — subconjunto real do datastore capturado durante a implementação (todos os lotes de 2022 a 2024, ~dezenas de linhas, **no formato cru do CKAN**) — e o seed grava o snapshot inicial passando esse arquivo pelas mesmas funções de normalização da domain (fonte `seed`). Assim QA/dev funcionam offline e o pipeline de normalização é exercitado no seed. Se a captura falhar durante a implementação, o fixture é montado a partir dos fatos validados no levantamento (Leilão 002/2024 e anteriores) mantendo o formato cru.

## Risks / Trade-offs

- **CKAN indisponível ou schema alterado** → sincronização aborta com mensagem pt-BR e snapshot preservado; sistema segue funcional com o snapshot do seed. Plano B registrado (importação do XLSX oficial), fora desta change.
- **Dataset desatualizado na origem** (sem 4/2025 e 1/2026 em 27/09/2026) → o benchmark mostra a data da última importação e o painel avisa "sem resultado publicado" para leilões ausentes; nada a fazer do nosso lado.
- **Replace-all apaga correções manuais** → não há edição manual do snapshot nesta change (dataset é somente leitura), então não há o que perder; se um dia houver curadoria, migrar para versionamento.
- **Multiplicidade inesperada de (leilão, lote)** → sem unique; benchmark usa a primeira correspondência e a consulta exibe todas as linhas; monitorar na primeira sincronização real.
- **`NumLoteLeilao` publicado como numérico** enquanto o edital usa sublotes (`4A`/`4B`) → o cruzamento é por lote inteiro; sublote fica fora do benchmark (coerente com o seed, que referencia o lote inteiro).

## Migration Plan

Migration aditiva (duas tabelas novas). Deploy sem passos especiais; rollback = reverter a migration (tabelas sem consumidores externos). O seed é idempotente: recria o snapshot inicial apenas se não houver importação registrada.

## Open Questions

Nenhuma — o comportamento com a fonte real será observado na primeira sincronização (risco de multiplicidade registrado acima), sem impacto em specs ou tasks.
