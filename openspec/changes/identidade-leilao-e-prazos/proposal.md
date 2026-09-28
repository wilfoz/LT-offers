## Why

O levantamento dos dados públicos da ANEEL feito em 27/09/2026 (portal de dados abertos, editais e factsheets da EPE) mostrou que a oferta guarda a identidade do leilão como texto livre (`auctionName` "Leilão Aneel 004/2026", `lotName` "Lote 04") e não tem os campos que a ANEEL publica por lote — número do leilão (`004/2026`), número do lote e sublote (`4A`/`4B`), prazo de construção em meses e data de assinatura do contrato de concessão. Sem isso não é possível cruzar a oferta com o histórico oficial de resultados (próxima change, `historico-leiloes-aneel`) nem aplicar a RN-02 como está escrita: o prazo contratual conta **da assinatura do contrato de concessão**, mas hoje o alerta só compara início de cronograma com a data de entrada em operação.

A validação da oferta-mestre do seed contra o Leilão 4/2026 real (cujo Lote 4 corresponde exatamente às três linhas 525 kV do seed) revelou ainda: data do leilão errada (27/03/2026 é a data do Leilão 1/2026; o 4/2026 é 30/10/2026), o custo EPC das linhas gravado no campo definido como "CAPEX estimado ANEEL" (R$ 2,38 bi contra R$ 4,11 bi do edital, que inclui subestações), RAP máxima divergente (R$ 535 mi contra R$ 762,63 mi) e uma "RAP vencedora" inventada para um leilão ainda não realizado. Por fim, o status `WON`/`IN_EXECUTION` exigido pelo spec `ofertas/cadastro-revisoes-linhas` não é persistível: o enum do banco só tem `DRAFT/FROZEN/DELIVERED`, o DTO aceita os dois valores e o use case os ignora em silêncio.

Esta change é pré-requisito das changes de integração com dados da ANEEL (histórico de leilões e viabilidade do lote para o licitante).

**Requisitos cobertos**: RF-01, RF-02, RN-02, RNF-08, RNF-09, RNF-14. **Fase do roadmap**: F1 (M01 — cadastro e versionamento de oferta).

## What Changes

- **Identidade normalizada do leilão na revisão da oferta**: novos campos anuláveis `auctionNumber` (formato `NNN/AAAA`, ex. `004/2026`), `lotNumber` (inteiro ≥ 1) e `subLotCode` (ex. `4A`). `auctionName` e `lotName` permanecem como rótulos livres. A identidade normalizada é a chave de cruzamento com os dados públicos da ANEEL (`NumLeilao`, `NumLoteLeilao`).
- **Prazos do edital**: novos campos anuláveis `contractSigningDate` (data civil) e `constructionDeadlineMonths` (inteiro ≥ 1). A revisão passa a expor a **data-limite contratual derivada** (`contractualDeadlineDate` = assinatura + meses) e o alerta RN-02 passa a cobrir também o caso "data-limite contratual posterior à entrada em operação do edital" e "início de cronograma anterior à assinatura do contrato" — sempre informativo, nunca bloqueante no rascunho.
- **Deságio derivado**: a API passa a expor `discountPercent` = `(1 − winningRap ÷ maxRap) × 100` com 2 casas, calculado em decimal; `null` quando faltar um dos valores ou a RAP máxima for zero (RNF-09). A tela de detalhe exibe o percentual ao lado da RAP.
- **Status `WON` e `IN_EXECUTION` persistíveis**: o enum do banco ganha os dois valores; o use case de atualização implementa as transições `DELIVERED → WON` e `WON → IN_EXECUTION` (revisão continua imutável); a mensagem de validação do DTO passa a listar os cinco status; README alinhado. O disparo automático da baseline na marcação `WON` (já previsto no spec principal) **fica fora** desta change e segue como dívida do contexto `baseline`.
- **Seed corrigido com dados públicos** do Leilão 4/2026 (Lote 4): `auctionNumber 004/2026`, `lotNumber 4`, `auctionDate 2026-10-30`, `contractSigningDate 2027-02-26`, `constructionDeadlineMonths 60`, `estimatedCapex 4110000000.00` (estimativa ANEEL do lote), `maxRap 762630000.00`, `winningRap null`. O custo EPC de R$ 2,38 bi continua sendo produzido pelo motor, não gravado como CAPEX ANEEL. Fixtures de paridade passam a citar leilões de transmissão que existiram (`004/2025`, `001/2026`) sem alterar nenhum número de paridade.
- **README**: termos novos no mapa canônico pt-BR → inglês (número do leilão, número do lote, sublote, data de assinatura do contrato de concessão, prazo de construção, data-limite contratual, deságio).

Não há mudança **BREAKING**: todos os campos novos são anuláveis e o contrato existente da API é preservado (campos adicionados).

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `ofertas/cadastro-revisoes-linhas`: o cadastro da oferta passa a aceitar a identidade normalizada do leilão (número, lote, sublote) e os prazos do edital (assinatura do contrato e prazo de construção); o alerta RN-02 considera a data-limite contratual derivada; a API expõe o deságio derivado; as transições de status `WON` e `IN_EXECUTION` passam a ser persistidas e válidas apenas a partir de `DELIVERED` e `WON`, respectivamente.

## Impact

- **Banco/Prisma**: `prisma/schema.prisma` — cinco colunas novas em `offer_revision` e dois valores novos em `offer_revision_status`; uma migration (`ALTER TYPE ... ADD VALUE` fora de transação com uso do valor, cuidado registrado no design).
- **Domain (`libs/domain`)**: `offers/offers.ts` — campos novos em `OfferRevisionItem`, `CreateOfferPayload`, `UpdateOfferRevisionPayload`, `CloneOfferPayload`; função pura `discountPercent(maxRap, winningRap)` e `contractualDeadline(signingDate, months)` com testes; constante de formato do número do leilão.
- **API (`apps/api/src/contexts/offers`)**: entidade `OfferRevision` (props, `updateParameters`, transições `markWon`/`markInExecution`), DTOs de criação/atualização/clonagem, mapper e repositórios Prisma, presenter, use cases de criação/clonagem/nova revisão/atualização; `freeze-baseline.usecase.ts` deixa de registrar um diff de status fictício.
- **Web (`apps/web/src/app/offers`)**: formulário de criação e aba "Parâmetros Comerciais e Prazos de Edital" do detalhe ganham os campos novos; alerta RN-02 ampliado; deságio exibido; chips de status já existentes passam a ser alcançáveis.
- **Seed e fixtures**: `prisma/seed.ts` (oferta-mestre), `libs/calc-engine/src/lib/parity/fixtures/*.fixture.ts` (apenas o rótulo `auction`).
- **Documentação**: `README.md` (mapa canônico e enum de status); `requisitos-calculo-lt.md` não muda (RN-02 já prevê a contagem a partir da assinatura).
- **Dependências**: nenhuma nova. Sem integração externa nesta change.
