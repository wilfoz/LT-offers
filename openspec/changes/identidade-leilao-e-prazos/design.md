## Context

Ver `proposal.md` para motivação. Estado atual relevante:

- `OfferRevision` (`prisma/schema.prisma:597-624`) guarda `auctionName`/`lotName` como texto livre e datas `offerDate`, `auctionDate`, `scheduleStartDate`, `commercialOperationDate` em `@db.Date`; valores `estimatedCapex`/`maxRap`/`winningRap` em `Decimal(16,2)`. O enum `offer_revision_status` no banco tem só `DRAFT/FROZEN/DELIVERED` (migration `20260907213842_add_offers_management`), enquanto `OFFER_REVISION_STATUSES` na domain e as labels/chips da web já têm `WON` e `IN_EXECUTION`. O mapper e o repositório Prisma fazem `status as any`, o que esconde a divergência do compilador.
- O DTO `UpdateOfferRevisionDto` aceita `@IsIn(OFFER_REVISION_STATUSES)` (cinco valores) com mensagem que lista três; `update-revision.usecase.ts` só trata `FROZEN` e `DELIVERED` — qualquer outro status é ignorado sem erro.
- O alerta RN-02 existe apenas na web (`offer-detail.component.ts` `hasRevScheduleWarning()`: `scheduleStartDate > commercialOperationDate`); nada na API ou na domain o calcula.
- `freeze-baseline.usecase.ts` (contexto `baseline`) registra na auditoria um diff `status: DELIVERED → WON` sem alterar o status da revisão.
- A domain (`libs/domain`) hoje não usa aritmética decimal (validações por regex de string); `DecimalValue` vive em `libs/calc-engine`, que a web não importa (fronteira `scope:app` → `engine`/`domain` permitida só na API e libs; a web hoje depende apenas da domain). `decimal.js` já é dependência do workspace.
- A domain já possui utilitários de calendário civil em `calendar/work-calendar.ts` (`isValidCivilDate`, `civilMonthOfProjectMonth`, `daysInCivilMonth`).
- Padrões vigentes: código em inglês com textos pt-BR; Decimal como string no JSON e `Prisma.Decimal` no banco (RNF-08); null ≠ zero (RNF-09); datas civis validadas por round-trip (`DATE_PATTERN` + calendário); `@Inject(PrismaService)` explícito nos construtores dos contextos.

## Goals / Non-Goals

**Goals:**
- Persistir a identidade normalizada do leilão (`auctionNumber`, `lotNumber`, `subLotCode`) e os prazos do edital (`contractSigningDate`, `constructionDeadlineMonths`) na revisão, de forma aditiva e anulável.
- Derivar, em funções puras e testadas da domain, a data-limite contratual, os alertas RN-02 e o deságio — consumidas pela API (presenter) e pela web (pré-visualização ao digitar), com uma única implementação.
- Tornar `WON` e `IN_EXECUTION` persistíveis com transições explícitas e rejeição de transições fora de ordem.
- Corrigir seed e fixtures com os dados públicos do Leilão 4/2026 sem alterar nenhum número de paridade.

**Non-Goals:**
- Integração com dados externos (CKAN/XLSX da ANEEL) — change `historico-leiloes-aneel`.
- Viabilidade do lote para o licitante (RAP × capex × WACC) — change própria.
- Disparo automático da baseline ao marcar `WON` (cenário já existente no spec principal, não implementado): permanece dívida do contexto `baseline`, registrada aqui para não ser esquecida.
- Prazo/função de transmissão **por linha** (`requisitos-calculo-lt.md:149`): os prazos desta change são do lote/edital; o detalhamento por linha entra quando o módulo de faturamento por marcos precisar.
- Tornar `auctionNumber` obrigatório ou retroalimentar as ofertas existentes.

## Decisions

### D1. Colunas novas em `offer_revision`, todas anuláveis

| Campo | Tipo Prisma | Coluna | Validação na borda |
|---|---|---|---|
| `auctionNumber` | `String? @db.VarChar(15)` | `auction_number` | `AUCTION_NUMBER_PATTERN = /^\d{3}\/\d{4}$/` (domain) — mensagem "deve estar no formato NNN/AAAA" |
| `lotNumber` | `Int?` | `lot_number` | inteiro ≥ 1 |
| `subLotCode` | `String? @db.VarChar(3)` | `sub_lot_code` | texto até 3 caracteres, maiúsculas (`4A`) |
| `contractSigningDate` | `DateTime? @db.Date` | `contract_signing_date` | `DATE_PATTERN` + round-trip de calendário (mesmo tratamento das datas existentes) |
| `constructionDeadlineMonths` | `Int?` | `construction_deadline_months` | inteiro ≥ 1 e ≤ 240 |

Rationale: `VarChar(15)` espelha o tamanho de `NumLeilao` no dicionário da ANEEL; o padrão `NNN/AAAA` é o formato de publicação (`004/2026`) e é o que permitirá o cruzamento por igualdade na próxima change. Nenhum campo é obrigatório para não quebrar ofertas existentes nem o fluxo de clonagem; ausência é "não informado" (RNF-09). Índice não é necessário agora (o cruzamento futuro será por igualdade em tabela pequena; se o histórico crescer, a change B adiciona índice em `(auction_number, lot_number)`).

Alternativa rejeitada: substituir `auctionName`/`lotName` pelos campos normalizados. Rótulos livres continuam úteis ("Leilão Aneel 004/2026 — 2ª sessão") e são exibidos em listas e exportações; a identidade normalizada é complementar.

### D2. Derivações como funções puras na domain, com `decimal.js`

Novo arquivo `libs/domain/src/lib/offers/offer-derivations.ts` exportando:

- `discountPercent(maxRap: string | null | undefined, winningRap: string | null | undefined): string | null` — `(1 − winning/max) × 100`, `toFixed(2)` half-up; `null` se qualquer entrada ausente/inválida ou `maxRap = 0`. Aceita negativo (RAP estimada acima do teto).
- `contractualDeadlineDate(signingDate: string | null | undefined, months: number | null | undefined): string | null` — soma de meses em calendário civil com **dia limitado ao último dia do mês de destino** (ex.: `2027-01-31` + 1 = `2027-02-28`), reutilizando `daysInCivilMonth`; `null` se faltar entrada ou a data for inválida.
- `scheduleWarnings(input: { scheduleStartDate?, commercialOperationDate?, contractSigningDate?, constructionDeadlineMonths? }): ScheduleWarning[]` com códigos tipados `'START_AFTER_COD' | 'DEADLINE_AFTER_COD' | 'START_BEFORE_SIGNING'` e o valor derivado usado (data-limite), sem texto — as mensagens pt-BR ficam nas bordas (web e, se exposto, API), seguindo o padrão de violações tipadas de `decimalScaleViolation`.

Rationale: uma implementação serve API e web (a web não importa `calc-engine`). É a primeira vez que a domain usa `decimal.js`; isso é aceitável porque a lib continua pura, determinística e sem dependência de framework (RNF-04/16), e `decimal.js` já está no workspace. A alternativa de calcular o deságio só no presenter com `DecimalValue` foi rejeitada porque a web precisaria duplicar a regra para a pré-visualização ao digitar (4ª duplicação do tipo que a change `reavaliacao-base-catalogos` acabou de eliminar).

Testes obrigatórios: deságio 50,00 / negativo / null com RAP zero / null com ausência; data-limite com clamp de fim de mês e ano bissexto; cada código de alerta isolado e combinado; datas inválidas (`2027-02-30`) resultam em `null` e nenhum alerta.

### D3. API: entidade, DTOs, mapper, presenter

- `OfferRevisionProps`/`RawProps` ganham os cinco campos; `updateParameters` aceita-os; `OfferRevision.create` não os torna obrigatórios.
- `CreateOfferDto` e `UpdateOfferRevisionDto` ganham os campos com validações de D1 e mensagens pt-BR; `CloneOfferDto` ganha `targetAuctionNumber`, `targetLotNumber`, `targetSubLotCode` opcionais (a clonagem copia os prazos e a identidade da origem quando o destino não os informa, coerente com o cenário "Lote 1 - Leilão 01/2025 → Lote 3 - Leilão 02/2026").
- Mapper/repositórios Prisma: datas civis via `toISOString().slice(0,10)` na leitura e `new Date('YYYY-MM-DD')` na escrita, igual ao tratamento atual de `commercialOperationDate` (coluna `@db.Date`, sem hora — não há risco de fuso porque a string já é a data civil).
- `OfferPresenter.toRevisionItem` passa a expor `contractualDeadlineDate: string | null` e `discountPercent: string | null` (derivados em leitura, nunca persistidos) e `scheduleWarnings: ScheduleWarningCode[]`. `OfferRevisionItem` na domain reflete isso; `CreateOfferPayload`/`UpdateOfferRevisionPayload` NÃO aceitam os derivados (o DTO com `whitelist: true` descarta se enviados — coberto pelo teste de paridade DTO × contrato exigido pelo padrão do projeto).
- Teste de paridade DTO × contrato: payload com todas as chaves novas inválidas → um erro por campo (evita o modo de falha silencioso da whitelist registrado em reviews anteriores).

### D4. Transições de status `WON` e `IN_EXECUTION`

- Migration aditiva: `ALTER TYPE "offer_revision_status" ADD VALUE 'WON'; ALTER TYPE ... ADD VALUE 'IN_EXECUTION';`. No Postgres ≥ 12 isso pode rodar dentro da transação da migration desde que o valor novo não seja **usado** na mesma transação — a migration só adiciona valores, então é segura. Não colocar `UPDATE` com os valores novos na mesma migration.
- Entidade: `markWon()` exige `DELIVERED`; `markInExecution()` exige `WON`; ambos lançam `InvalidStatusTransitionException` (nova exceção de domínio, mapeada para HTTP 409 pelo filtro existente do contexto) com mensagem "Transição de status não permitida: a revisão está em <atual> e não pode ir para <pretendido>". `isClosed()` passa a cobrir `FROZEN | DELIVERED | WON | IN_EXECUTION` e é usado no lugar de `isFrozen() || isDelivered()` no use case.
- `update-revision.usecase.ts`: o bloco "se informou status" vira um `switch` exaustivo sobre os cinco valores; `DRAFT` como alvo é rejeitado (não existe reabertura — criar nova revisão); status igual ao atual é no-op explícito. Remover os `as any` do mapper/repositório em favor do enum gerado pelo Prisma para que o compilador acuse divergência futura.
- Mensagem do DTO passa a listar os cinco status; README atualizado (`DRAFT | FROZEN | DELIVERED | WON | IN_EXECUTION`).
- `freeze-baseline.usecase.ts`: o diff de auditoria passa a refletir o status real lido da revisão (sem inventar `DELIVERED → WON`). Não marca `WON` — o encadeamento automático continua fora (Non-Goals).
- Auditoria: as transições novas emitem evento com ação `STATUS_CHANGE` (ou a ação já usada para `DELIVERED`, a verificar no contexto `audit` durante a implementação) contendo status anterior e novo.

### D5. Web

- `offer-form.component.ts` (criação): a seção "Identificação do Leilão" ganha número do leilão, lote e sublote; a seção de prazos ganha assinatura do contrato e prazo de construção (meses). Validadores espelham D1 (padrão do leilão, inteiro ≥ 1) com mensagens pt-BR; pré-visualização da data-limite e do deságio via `offer-derivations` (só leitura).
- `offer-detail.component.ts` (aba "Parâmetros Comerciais e Prazos de Edital"): mesmos campos com `[readonly]="!isDraft()"`; o bloco de alerta RN-02 passa a listar um item por código devolvido por `scheduleWarnings` (mensagens pt-BR no componente); "Deságio" exibido ao lado da RAP com formato `pt-BR` (`50,00%`), "não informado" quando nulo e classe de destaque quando negativo.
- Ações de status: onde a UI já oferece "Fechar"/"Marcar entregue", adicionar "Marcar vencedora" (visível em `DELIVERED`) e "Iniciar execução" (visível em `WON`), reutilizando o mesmo endpoint de atualização com `status`. Erros 409 exibidos em snackbar.
- Padrões de review a respeitar: callback de erro em toda leitura, `enable({ emitEvent: false })`, botão submit refletindo `form.disabled`, sem BOM em arquivos editados no Windows, `nx format:check --all` antes do commit.

### D6. Seed e fixtures

- `prisma/seed.ts` (oferta-mestre): `auctionName 'Leilão Aneel 004/2026'`, `auctionNumber '004/2026'`, `lotName 'Lote 04'`, `lotNumber 4`, `subLotCode null` (o sublote 4A/4B do edital divide o lote em dois conjuntos; a planilha-mestre cobre as três linhas, então o lote inteiro é a referência), `auctionDate '2026-10-30'`, `contractSigningDate '2027-02-26'`, `constructionDeadlineMonths 60`, `scheduleStartDate` mantido, `commercialOperationDate` alinhado à data-limite (`2032-02-26`) — ou mantido em `2029-06-30` para exercitar o alerta (b) do RN-02 no QA; decisão: **manter `2029-06-30` e registrar na nota** que o alerta é esperado. `estimatedCapex '4110000000.00'`, `maxRap '762630000.00'`, `winningRap null`, nota citando a fonte (edital 4/2026, aprovado 22/09/2026).
- Fixtures de paridade (`libs/calc-engine/src/lib/parity/fixtures/*.fixture.ts`): apenas o rótulo `auction` muda (`solaris-mg-500kv` e `reidi-direct-bill` → `Leilão Aneel 004/2025`; `tucano-multiline` → `Leilão Aneel 001/2026`); nenhum spec assere esse rótulo (verificado por grep), e nenhum número muda. O contrato `HistoricalOfferFixture.inputs.offer` não ganha campos novos nesta change.

## Risks / Trade-offs

- **Divergência de semântica do CAPEX já gravado**: ofertas existentes podem ter custo EPC no campo `estimatedCapex`. Mitigação: rótulo e placeholder da UI passam a dizer explicitamente "CAPEX estimado ANEEL (lote inteiro, conforme edital)"; sem migração de dados (não há como inferir a origem do valor).
- **Primeira dependência de `decimal.js` na domain**: amplia o que a lib carrega para a web. Aceito: a biblioteca já é usada pelo motor e pesa pouco; a alternativa (duplicar a regra) contraria a política das três ocorrências.
- **`ALTER TYPE ADD VALUE` e ambientes com Postgres antigo**: em versões < 12 falha dentro de transação. O projeto usa Postgres recente (Prisma 7 + adapter pg); registrar no README de setup a versão mínima se ainda não estiver.
- **Alerta RN-02 mais abrangente pode sinalizar ofertas antigas**: o alerta é informativo e não bloqueia; o seed passa a exibir o alerta (b) de propósito, o que serve ao QA mas pode confundir — a nota do seed explica.
- **Clonagem copiando identidade do leilão**: clonar sem informar novo número mantém `004/2026`/lote 4 na oferta nova, o que pode induzir a erro. Mitigação: o diálogo de clonagem exibe os campos de destino pré-preenchidos com a origem e pede confirmação; a change B poderá sinalizar duas ofertas com a mesma identidade.
