## Why

O levantamento de 27/09/2026 verificou que a ANEEL publica o resultado oficial de todos os leilões de transmissão desde 1999 em dataset aberto (CKAN, 488 lotes até o Leilão 002/2024): RAP máxima do edital, vencedor, RAP vencedora e deságio por lote. Hoje o sistema não tem nenhum referencial externo — o usuário calibra a RAP vencedora estimada e avalia o deságio "no olho", sem comparar com o histórico do próprio leilão, da UF ou do porte do lote. A change `identidade-leilao-e-prazos` (arquivada em 28/09/2026) criou exatamente a chave de cruzamento que faltava: `auctionNumber` (`NNN/AAAA`) e `lotNumber` normalizados na revisão da oferta, espelhando `NumLeilao`/`NumLoteLeilao` do dataset.

Esta change ingere o histórico oficial como snapshot em banco (nunca consulta ao vivo no motor — RNF-04) e o expõe em duas frentes: uma tela de consulta do histórico e um painel de benchmark no detalhe da oferta. É a primeira integração com dados públicos da ANEEL e pré-requisito da change `viabilidade-lote-licitante` (deságio máximo suportado × deságios praticados).

**Requisitos cobertos**: RF-01, RF-11 (consulta e sinalização), RNF-04, RNF-08, RNF-09, RNF-14; integrações (§10). **Fase do roadmap**: F1 (apoio ao M01), ordem acordada A → **B** → D → C.

## What Changes

- **Snapshot do histórico de leilões em banco**: novas tabelas `auction_result` (uma linha por lote: ano, data, número do leilão, lote, empreendimento, UF principal, prazo de construção, extensão km, MVA, investimento previsto, RAP máxima, vencedor, RAP vencedora, deságio) e `auction_result_import` (metadados imutáveis de cada importação: fonte, data, contagem de linhas, autor). Cada sincronização substitui o snapshot vigente e registra a importação no log — o dataset é referencial informativo, não entrada de cálculo de ofertas fechadas (decisão registrada no design).
- **Sincronização sob demanda com o CKAN da ANEEL**: endpoint que busca o datastore oficial no servidor (porta hexagonal + adapter HTTP), normaliza os valores (números em texto com vírgula decimal → `Prisma.Decimal`; `PctDesagio` em fração → percentual; `NumLeilao` normalizado para `NNN/AAAA`; lote deserto → vencedor/RAP/deságio nulos, nunca zero — RNF-09) e grava o snapshot atomicamente. Disparo manual pelo usuário na tela, com auditoria.
- **Consulta do histórico**: API de listagem com busca e filtros (leilão, UF, ano) e tela nova "Histórico de Leilões ANEEL" com a tabela do snapshot, metadados da última importação e botão de sincronização.
- **Benchmark no detalhe da oferta**: quando a revisão tem `auctionNumber`+`lotNumber`, painel exibe o resultado oficial do lote (se já publicado) e as estatísticas do leilão e da base histórica (deságio mínimo/médio/máximo, nº de lotes, lotes desertos) ao lado do deságio derivado da oferta.
- **README**: termos novos no mapa canônico (resultado de leilão, importação do histórico, empreendimento, deságio publicado etc.).

Não há mudança **BREAKING**: tabelas e telas novas; contratos existentes preservados.

## Capabilities

### New Capabilities

- `historico-leiloes-aneel`: snapshot versionado por importação do resultado oficial dos leilões de transmissão da ANEEL, sincronização sob demanda com normalização dos dados publicados, consulta com filtros e benchmark de deságio no detalhe da oferta via identidade normalizada do leilão.

### Modified Capabilities

Nenhuma — o painel de benchmark é comportamento novo da capability nova; os requirements de `ofertas/cadastro-revisoes-linhas` não mudam.

## Impact

- **Banco/Prisma**: `prisma/schema.prisma` — modelos `AuctionResultImport` e `AuctionResult`; uma migration aditiva.
- **Domain (`libs/domain`)**: contratos do histórico (`auction-history.ts`) e funções puras de normalização (`parseAneelDecimal` para vírgula decimal, fração→percentual, `normalizeAuctionNumber`) com testes — as armadilhas do dataset ficam em um único lugar.
- **API (`apps/api/src/contexts/auction-history`, contexto novo hexagonal)**: porta `AneelAuctionResultsPort` + adapter HTTP do CKAN (com timeout e mensagens pt-BR), use cases de sincronização/consulta/benchmark, controller, DTOs, módulo com `@Inject(PrismaService)` e cobertura no `context-modules-di.spec.ts`.
- **Web (`apps/web/src/app/auction-history` + `offers/offer-detail`)**: tela nova no menu da casca (app.spec asserta a lista exata de itens — atualizar) e painel de benchmark na aba de parâmetros do detalhe da oferta.
- **Seed e fixtures**: subconjunto real do dataset commitado como fixture JSON (inclui os fatos de validação de 27/09/2026, ex. deságios do Leilão 1/2026 quando publicados e lotes 2022–2024) gravado pelo seed como snapshot inicial com fonte "seed" — QA e dev funcionam sem rede.
- **Dependências**: nenhuma nova (HTTP via fetch do Node no adapter). O CKAN da ANEEL passa a ser dependência externa **opcional em runtime** (sem sincronizar, o snapshot do seed permanece); indisponibilidade ou mudança de schema do datastore é risco registrado no design, com fallback manual futuro (XLSX oficial) fora desta change.
- **Documentação**: README (mapa canônico e seção de integrações).
