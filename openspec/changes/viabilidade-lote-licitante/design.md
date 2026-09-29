## Context

Ver `proposal.md` (Why). Estado atual relevante:

- A revisão da oferta tem `maxRap`, `winningRap`, `estimatedCapex` (estimativa ANEEL do lote inteiro, semântica fixada na change `identidade-leilao-e-prazos`) e o deságio derivado `discountPercent`; o snapshot `auction_result` (change `historico-leiloes-aneel`) fornece deságios praticados com `auctionBenchmark` puro na domain.
- Padrões vigentes: catálogo singleton versionado por vigência com resolução por data na borda (rainfall/work-calendar — controllers `schedule-parameters` com `resolveReferenceDate`/`versionImmutableException`); contexto hexagonal com `@Inject(PrismaService)` e cobertura no `context-modules-di.spec.ts`; derivações puras na domain com decimal.js (`offer-derivations`, `auction-normalization`); trilho completo para campo novo de revisão provado na change A (contrato → entidade → DTO → mapper → presenter → form, incluindo a normalização undefined/null/'' do update).
- Hipóteses de modelagem confirmadas pelo usuário em 29/09/2026: (1) termos reais — RAP constante ao WACC real, sem inflação; (2) investimento base informado pelo licitante com fallback ao CAPEX ANEEL; (3) fatores tributários/O&M configuráveis como hipótese; (4) WACC como taxa única, sem dívida explícita.
- WACC regulatório de transmissão 2026: 8,00% a.a. real após impostos (vigente desde 01/03/2026, fonte ANEEL — levantamento de 27/09/2026).

## Goals / Non-Goals

**Goals:**

- Parecer de viabilidade determinístico e reproduzível: parâmetros versionados por vigência resolvidos pela data da oferta (RNF-04/05), derivações puras testadas contra valores canônicos calculados com decimal.js.
- Uma única fonte para a matemática (domain) consumida pela API; a web exibe o parecer do endpoint (não recalcula — os parâmetros vigentes vivem no servidor).
- Campo do investimento do licitante percorrendo o mesmo trilho de campo de revisão da change A.

**Non-Goals:**

- Modelagem de dívida/project finance (TIR do acionista, alavancagem própria) — change futura sobre esta base (decisão 4).
- Projeção de inflação/fluxos nominais (decisão 1).
- Calibração dos fatores tributários e de O&M — os defaults do seed são hipótese declarada (§02); a calibração é trabalho de dados, não de código.
- Encadeamento com o resultado econômico do motor (custo EPC próprio como investimento) — o custo EPC aparece como referência informativa no painel, sem virar base automática (decisão 2).
- Editar parâmetros vigentes retroativamente (RNF-05 — só nova versão).

## Decisions

### D1. Catálogo singleton `ViabilityParameterVersion` versionado por vigência

| Campo | Tipo Prisma | Validação na borda |
| --- | --- | --- |
| `effectiveFrom` | `DateTime @db.Date` | data civil round-trip; `@@unique` |
| `waccRealAfterTaxPercent` | `Decimal(5,2)` | decimal > 0, escala 2 |
| `concessionYears` | `Int` | inteiro 1..60 |
| `pisCofinsPercent` | `Decimal(5,2)` | decimal 0..100, escala 2 |
| `operationMaintenancePercent` | `Decimal(5,2)` | decimal 0..100, escala 2 |
| `incomeTaxPercent` | `Decimal(5,2)` | decimal 0..100, escala 2 |
| `createdBy` / `createdAt` | padrão | — |

Mesmo desenho dos parâmetros de chuva/calendário (singleton sem tabela de identidade; versão = linha; vigente = maior `effectiveFrom` ≤ data de referência). Nomes seguem os precedentes da domain (`PisCofinsRule`/`pisRatePercent` já existem no módulo tributário). A soma dos três fatores não é validada além do intervalo individual — são deduções multiplicativas independentes.

Alternativa rejeitada: parâmetros por oferta (cada revisão com seu WACC) — quebra a comparabilidade entre ofertas e duplica entrada de dado; quem varia por oferta é o investimento, não o regulatório.

### D2. Derivações puras em `libs/domain/src/lib/viability/`

`viability.ts` (contratos `ViabilityParameters`, `ViabilityAssessment`, `ViabilityInvestmentSource = 'BIDDER' | 'ANEEL_ESTIMATE'`) e `viability-derivations.ts`:

- `capitalRecoveryFactor(waccPercent, years)` — `i(1+i)^n / ((1+i)^n − 1)` em decimal.js com precisão interna alta; null para entradas ausentes/inválidas.
- `investmentAnnuity(capex, waccPercent, years)` — CAPEX × fator, `toFixed(2)` half-up.
- `minimumGrossRap(annuity, pisCofinsPercent, omPercent, incomeTaxPercent)` — anuidade ÷ produto dos fatores líquidos; null se algum fator ≥ 100%.
- `maxSupportableDiscount(minimumGrossRap, maxRap)` — `(1 − mín ÷ máx) × 100` duas casas (negativo = inviável no teto); null sem RAP máxima.
- `assessViability(inputs, parameters)` — composição: resolve investimento base (`bidderCapex` → senão `estimatedCapex`, com `investmentSource`), deriva tudo, compara com `winningRap`/`discountPercent` derivado e produz os vereditos (`viableAtMaxRap`, `viableAtEstimatedRap`, folga/excesso em pontos percentuais); ausências propagam null com a lista `missingInputs` tipada (mensagens pt-BR nas bordas).

Valores canônicos do spec calculados com o próprio decimal.js (precision 40): CAPEX 4.11 bi, 8,00%, 30 anos, fatores 9,25/10/10 → anuidade `365080751.22`, RAP mínima `496657825.69`, deságio máximo `34.88` — travados nos testes de unidade.

### D3. Contexto hexagonal `viability` na API

- Repositório `ViabilityParametersRepository` (Prisma): `findEffective(referenceDate)`, `create(version)`, `list()`; exceções de vigência ausente/duplicada no padrão schedule-parameters (404/409 pt-BR, PUT/PATCH → 405 `versionImmutableException`).
- Porta `ViabilityAuctionStatsPort { findByAuction(auctionNumber); findDiscountRows() }` com adapter Prisma próprio lendo `auction_result` — reusa `auctionBenchmark` da domain sem acoplar o módulo `auction-history` (que não exporta nada; ler a mesma tabela via porta própria segue o precedente de consultas cruzadas por porta do baseline).
- Use cases: `get-effective-viability-parameters`, `create-viability-parameters-version`, `get-viability-assessment` (resolve a revisão via porta `ViabilityOfferQueryPort` — id da oferta + id da revisão → campos financeiros e identidade do leilão —, resolve parâmetros vigentes pela **data da oferta** da revisão, monta `assessViability` + benchmark). Datas resolvidas na borda (design D2 do piloto).
- Controller `viability.controller.ts`: `GET /viability/parameters?effectiveOn=`, `POST /viability/parameters`, `GET /viability/assessment?offerId=&revisionId=` (400 pt-BR para ids inválidos; 404 para oferta/revisão/parâmetros ausentes). Módulo no app e no `context-modules-di.spec.ts`. Sem porta de auditoria (nada de transição de estado de negócio; a extração da porta fina — regra das três da change B — fica para a próxima change que a tocar).

### D4. Campo `bidderCapex` na revisão (trilho da change A)

`offer_revision.bidder_capex Decimal?(16,2)`; contrato/entidade/DTOs (`POSITIVE_DECIMAL_PATTERN` + escala 2, mensagem pt-BR)/mapper/repositórios/presenter, com a normalização de update dos campos novos (undefined ignora, null limpa, texto vazio → null) e teste de paridade DTO × contrato estendido. O painel usa o valor do envelope da revisão.

### D5. Web

- **Painel "Viabilidade do Lote (M13)"** na aba de parâmetros do `offer-detail`, abaixo do benchmark ANEEL: consome `GET /viability/assessment` ao selecionar/salvar a revisão (mesmo gatilho do benchmark); estados — entradas faltantes (lista orientando o que informar), parecer completo (valores pt-BR, veredito com destaque verde/vermelho, folga/excesso em p.p., parâmetros vigentes com vigência), erro em snackbar sem quebrar a aba. Campo `bidderCapex` editável no formulário da aba (rascunho) com o rótulo "Investimento total estimado pelo licitante (lote inteiro)".
- **Tela "Parâmetros de viabilidade"** (`/catalogs/viability-parameters`, item novo no menu — app.spec passa a 17 itens): versão vigente em formulário (padrão da tela de parâmetros de chuva), salvar cria versão nova com vigência informada, erros pt-BR, histórico não é objetivo da tela (consulta por `effectiveOn` fica na API).
- Padrões de review: callbacks de erro em toda leitura, botão refletindo `form.disabled`, DatePipe para datas, formatadores pt-BR (3ª ocorrência dos `formatMoney`/`formatPercent` — extrair para utilitário compartilhado da web, regra das três).

### D6. Seed

Versão inicial dos parâmetros com `effectiveFrom 2026-03-01` (início de vigência do WACC 2026): WACC `8.00`, prazo `30`, PIS/COFINS `9.25`, O&M `10.00`, IR/CSLL `10.00`, com nota citando a fonte do WACC (ANEEL, vigente desde 01/03/2026) e marcando os três fatores como **hipótese a calibrar** (§02). Idempotente no padrão dos demais singletons (só grava se não houver versão). `bidderCapex` da oferta-mestre permanece não informado de propósito — o QA exercita a origem "estimativa ANEEL" do fallback.

## Risks / Trade-offs

- **Defaults tributários são hipótese** → declarados na nota do seed e no rótulo da tela; o parecer cita os parâmetros usados, então um default ruim é visível e corrigível por nova versão sem tocar código.
- **Dois contextos lendo `auction_result`** (auction-history e viability) → aceito: leitura por porta própria evita acoplamento de módulos; se um terceiro leitor surgir, extrair um módulo de consulta compartilhado.
- **Parecer depende de 3 fontes (revisão, parâmetros, snapshot)** → ausências tipadas em `missingInputs` com orientação pt-BR; nunca zero silencioso (RNF-09).
- **Confusão CAPEX ANEEL × investimento do licitante** → rótulos explícitos (lição da change A) e origem exibida no parecer.

## Migration Plan

Migration aditiva (tabela nova + coluna anulável). Deploy sem passos especiais; rollback = reverter a migration. Seed idempotente.

## Open Questions

Nenhuma — as quatro hipóteses de modelagem foram decididas pelo usuário em 29/09/2026 e registradas no proposal; a calibração dos fatores é operação (nova versão de parâmetros), não código.
