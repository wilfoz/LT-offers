# QA — historico-leiloes-aneel

**Resultado: APROVADO** — 10/10 cenários do spec `historico-leiloes-aneel`
verificados e PASSARAM (23/23 verificações E2E + 5 TI com evidências);
1 bug real encontrado (BUG-1), corrigido na causa raiz com regressão.

Data: 2026-09-29. Ambiente: Postgres via Docker (`lt-offers-postgres`,
porta 5432, seed aplicado — 49 lotes 2022–2024), API `npx nx serve api` na
porta 3000, web `npx nx serve web` na porta 4200. E2E com Playwright 1.62
(Chromium headless, padrão do projeto). **Sincronização REAL contra o CKAN
da ANEEL executada com sucesso durante o QA** (488 lotes). Dados criados
pelo QA removidos ao final — banco devolvido ao estado do seed.

## Checklist por cenário

Tipos: TU = unidade (suítes dos grupos 1–3), TI = integração (API ao vivo,
evidência JSON), E2E = navegador (Playwright, captura PNG). Evidências em
`qa/evidences/`.

### Requirement: Manter snapshot local do histórico (RNF-04)

| # | Cenário | Tipo | Resultado | Evidência |
| - | --- | --- | --- | --- |
| 1 | Consulta usa o snapshot local sem depender da rede | TI + E2E | PASSOU | `ti1-consulta-filtro-leilao.json` (fonte seed nos metadados); `e2e2-tela-snapshot-seed.png` |
| 2 | Sincronização substitui o snapshot e registra a importação | TI + E2E | PASSOU | `ti5-sync-real-ckan.json` (sync REAL: 488 lotes, import id 2); `e2e7-sync-real-ckan.png` (snackbar + metadados atualizados); log com as 2 importações preservadas (seed 49 + sync 488), conferido no Postgres |

### Requirement: Sincronizar normalizando os valores publicados (RNF-08, RNF-09)

| # | Cenário | Tipo | Resultado | Evidência |
| - | --- | --- | --- | --- |
| 3 | Vírgula decimal convertida exatamente; deságio fração → percentual | TU + TI + E2E | PASSOU | Pós-sync real: lote 007/1999 com RAP `45290000.00` e deságio `8.00` (E2E-7c, fatos do levantamento); seed com `284535929.24`/`43.00` conferidos no Postgres |
| 4 | Lote deserto permanece não informado | TU | PASSOU | Coberto por 3 camadas de testes de unidade (normalização, use case, componente com badge "deserto"). **Achado real documentado**: a base publicada da ANEEL tem 0/488 lotes desertos e 0 campos vazios — o ramo não é exercitável com dados reais (validado pela review do grupo 4: fabricar registro apareceria como resultado "oficial" falso) |
| 5 | Falha da fonte externa não corrompe o snapshot | TU + TI | PASSOU | Testes de unidade assertam estado (snapshot/importações/auditoria intocados); evidência viva colateral: o BUG-1 abaixo abortou com 502 pt-BR e o snapshot do seed permaneceu íntegro — o mecanismo funcionou em produção real |

### Requirement: Consultar o histórico com busca e filtros (RF-11)

| # | Cenário | Tipo | Resultado | Evidência |
| - | --- | --- | --- | --- |
| 6 | Filtro por leilão lista somente os lotes do certame | TI + E2E | PASSOU | `ti1` (15 lotes, só 001/2024); `e2e3-filtro-leilao.png` |
| 7 | Snapshot vazio orienta a primeira sincronização | E2E | PASSOU | `e2e1-estado-vazio.png` (tabelas truncadas → mensagem de orientação, sem erro) |

### Requirement: Exibir benchmark de deságio no detalhe da oferta

| # | Cenário | Tipo | Resultado | Evidência |
| - | --- | --- | --- | --- |
| 8 | Lote com resultado oficial publicado | TI + E2E | PASSOU | `ti2-benchmark-lote-publicado.json` (001/2024 lote 1: Eletronorte, 43.00, stats 15/49 lotes); `e2e4-benchmark-lote-publicado.png` (lado a lado com deságio derivado 50,00% e data do snapshot) |
| 9 | Leilão ainda sem resultado publicado | TI + E2E | PASSOU | `ti3-benchmark-leilao-ausente.json` (004/2026 → lotResult/auctionStats nulos, base 49); `e2e5-benchmark-leilao-ausente.png` (oferta-mestre) |
| 10 | Oferta sem identidade normalizada não exibe benchmark | TI + E2E | PASSOU | `ti4-benchmark-validacao.json` (query sem identidade → 400 pt-BR, 1 mensagem por campo); `e2e6-benchmark-sem-identidade.png` (orientação, sem chamada — assertado também no teste de componente) |

## Bugs encontrados e corrigidos

### BUG-1 — Sincronização real abortava: Leilão 013/2015 publicado em duas etapas

- **Sintoma**: `POST /auction-history/sync` contra o CKAN real retornava 502
  "48 registro(s) sem identidade mínima" e nenhuma sincronização completava.
  (O abort em si funcionou como especificado: snapshot preservado, mensagem
  pt-BR, nenhuma importação registrada.)
- **Causa raiz**: o dataset real contém `NumLeilao` `"013/2015-1º"` e
  `"013/2015-2º"` (Leilão 013/2015 em duas etapas, 24 lotes cada) e o
  `normalizeAuctionNumber` estrito (`^NNN/AAAA$`) rejeitava o sufixo de
  etapa — invisível ao fixture do seed (2022–2024 não tem o caso).
- **Correção**: `normalizeAuctionNumber` normaliza o padding do prefixo
  `NNN/AAAA` e **preserva o sufixo de etapa** publicado (colapsar criaria
  identidades ambíguas — os números de lote se repetem entre as etapas).
  O padrão estrito das ofertas (`AUCTION_NUMBER_PATTERN`) não mudou.
- **Regressão**: 3 casos novos em `auction-normalization.spec.ts`
  (`013/2015-1º`/`-2º` preservados, `13/2015-2º` com padding) que falham
  sem a correção; revalidação = sincronização real completa com 488 lotes
  e os 48 do 013/2015 presentes no snapshot (conferido no Postgres:
  24 + 24 por etapa).

## Testes de unidade e integração

- `npx nx run-many -t test lint -p api web domain` verde após o fix
  (domain 150 — 3 regressões novas —, api 299, web 375). Projeto não define
  meta de cobertura.

## Acessibilidade (telas novas/alteradas)

- Filtros da tela com `mat-label` associado (verificação programática,
  E2E-9a); campo de leilão alcançável por Tab (E2E-9b, executado com
  `focus()` — o `click()` do primeiro run era falso negativo do script:
  o `mat-label` flutuante do Material intercepta o clique); botões com
  rótulos textuais; `aria-label` na progress bar; mensagens de erro pt-BR
  em snackbar; painel de benchmark com títulos e textos completos.

## Visual e responsividade

- 1440px: `e2e2` (dados do seed), `e2e3` (filtro), `e2e4`/`e2e5`/`e2e6`
  (benchmark nos 3 estados), `e2e7` (pós-sincronização real com 488 lotes).
- 375px: `e2e8-tela-375px.png` — sem estouro horizontal.
- Estados: vazio (`e2e1`), com dados (`e2e2`), erro coberto por teste de
  componente (snackbar com mensagem exata da API).

## Observações

- A primeira execução do E2E-7 registrou o BUG-1 (timeout do snackbar de
  sucesso — a API respondia 502); após o fix e restart do serve, o fluxo
  completo passou. O estado pós-erro do painel de benchmark (MIN-5 da
  review do grupo 3) foi observado: o snackbar comunica o erro e a aba
  permanece funcional — sem ação adicional nesta change.
- A sincronização real deixou o snapshot com 488 lotes durante o QA; ao
  final o banco foi devolvido ao estado do seed (49 lotes, 1 importação)
  e as ofertas `QA-BENCH-*` removidas.

## Portas e encerramento

- Postgres 5432 (Compose, mantido), API 3000 e web 4200 (encerrados ao
  final do QA).
