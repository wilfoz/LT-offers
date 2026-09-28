# QA — identidade-leilao-e-prazos

**Resultado: APROVADO** — 16/16 cenários do spec
`ofertas/cadastro-revisoes-linhas` verificados e PASSARAM (1 cenário
registrado como fora de escopo por Non-Goal declarado no proposal);
1 bug real encontrado (BUG-1), corrigido na causa raiz com regressão.

Data: 2026-09-28. Ambiente: Postgres via Docker (`lt-offers-postgres`,
porta 5432, seed aplicado), API `npx nx serve api` na porta 3000, web
`npx nx serve web` na porta 4200 (proxy `/api` → 3000). E2E com Playwright
1.62 (Chromium headless, padrão de QA do projeto — a extensão
claude-in-chrome não conectou). Ofertas criadas pelo QA (`QA-*`) removidas
ao final — banco devolvido ao estado do seed (apenas
`OF-2026-CELEO-LOTE-04`).

## Checklist por cenário

Tipos: TU = unidade (suítes dos grupos 1–3), TI = integração (API ao vivo,
evidência JSON), E2E = navegador (Playwright, captura PNG). Evidências em
`qa/evidences/`.

### Requirement: Manter cadastro de ofertas

| # | Cenário | Tipo | Resultado | Evidência |
| - | --- | --- | --- | --- |
| 1 | Criação de oferta com dados válidos | E2E | PASSOU | `e2e2-oferta-criada-detalhe.png` (R0 criada, listada no detalhe) |
| 2 | Criação com identidade normalizada (004/2026, lote 4, 4A, assinatura, 60 meses → data-limite 2032-02-26) | TI + E2E | PASSOU | `ti2-criacao-identidade.json`; `e2e1-form-identidade-previews.png` (preview 2032-02-26 e 50,00% ao digitar) |
| 3 | Número do leilão fora do formato é rejeitado (4/2026, 2026-004) | TI + E2E | PASSOU | `ti4-validacoes-400.json` (400 pt-BR); `e2e3-form-numero-leilao-invalido.png` |
| 4 | Prazo de construção inválido é rejeitado (0, negativo, não inteiro) | TI | PASSOU | `ti4-validacoes-400.json` (mensagens distintas p/ zero/negativo e não inteiro) |
| 5 | Campos não informados permanecem nulos, sem derivação nem alerta | TI | PASSOU | `ti3-campos-nao-informados.json` (tudo null, scheduleWarnings vazio) |
| 6 | Alerta RN-02 (a): início posterior à entrada em operação | E2E | PASSOU | `e2e5-tres-alertas-rn02.png` (alerta aparece ao digitar na aba) |
| 7 | Alerta RN-02 (b): data-limite contratual posterior à entrada em operação, citando a data | TI + E2E | PASSOU | `ti1-oferta-mestre-seed.json` (DEADLINE_AFTER_COD); `e2e4-master-alertas-rn02-desagio.png` (mensagem cita 2032-02-26) |
| 8 | Alerta RN-02 (c): início anterior à assinatura do contrato | TI + E2E | PASSOU | `ti1` (START_BEFORE_SIGNING); `e2e4` (mensagem pt-BR) |

Extras verificados: sublote com 4 caracteres e data 2027-02-30 → 400 com
mensagens pt-BR (`ti4`); rótulo do CAPEX "estimado ANEEL (lote inteiro,
conforme edital)" na tela (`e2e1`).

### Requirement: Gerenciar histórico de revisões de oferta

| # | Cenário | Tipo | Resultado | Evidência |
| - | --- | --- | --- | --- |
| 9 | Criação de nova revisão a partir da anterior (copia estado, R0 intacta) | TI | PASSOU | `ti8-frozen-e-nova-revisao.json` (R1 DRAFT, R0 FROZEN preservada) |
| 10 | Bloqueio de edição em revisão fechada | TI | PASSOU | `ti7-transicao-fora-de-ordem-e-imutabilidade.json` (400 RNF-05) |
| 11 | Transição de status gera evento de auditoria | TI | PASSOU | `ti9-auditoria-transicoes.json` (eventos com status anterior e novo: DELIVERED→WON, WON→IN_EXECUTION) |
| 12 | Marcação de vencedora dispara criação da baseline | — | FORA DE ESCOPO | Non-Goal declarado no proposal: encadeamento automático da baseline permanece dívida do contexto `baseline` (cenário pré-existente no spec principal, não implementado antes nem nesta change) |
| 13 | Revisão entregue marcada como WON persiste e continua imutável | TI + E2E | PASSOU | `ti6-transicoes-validas.json`; `e2e6-revisao-vencedora.png` (chip "Vencedora (Ganha)") |
| 14 | Revisão vencedora entra em execução | TI + E2E | PASSOU | `ti6`; `e2e6b-revisao-em-execucao.png` + verificação de persistência pós-reload |
| 15 | Transição fora de ordem rejeitada com status atual e pretendido | TI | PASSOU | `ti7` (DRAFT→WON, DRAFT→IN_EXECUTION) e `ti8` (FROZEN→WON/IN_EXECUTION/DRAFT) — todos 409 com mensagem exata |

### Requirement: Derivar o deságio da RAP (ADDED)

| # | Cenário | Tipo | Resultado | Evidência |
| - | --- | --- | --- | --- |
| 16 | Deságio 50.00 calculado das RAPs (762.630.000 / 381.315.000) | TI + E2E | PASSOU | `ti5-desagio.json`; `e2e7b-desagio-50.png` ("Deságio: 50,00%") |
| 17 | Deságio não informado quando falta uma das RAPs | TI + E2E | PASSOU | `ti1` (oferta-mestre, winningRap null → discountPercent null); `e2e4` ("Deságio: não informado") |
| 18 | Deságio negativo quando RAP estimada supera a máxima | TI + E2E | PASSOU | `ti5` (-5.00); `e2e7-desagio-negativo.png` (destaque visual + texto de teto excedido) |

## Bugs encontrados e corrigidos

### BUG-1 — Ações da aba de parâmetros e transições de status quebradas (404)

- **Sintoma**: clicar em "Marcar como entregue" (e qualquer salvar/transição
  na aba de parâmetros) não tinha efeito; snackbar de erro "Revisão com ID
  '0' não encontrada". Evidência da falha:
  `bug1-status-nao-transiciona-404.png`.
- **Causa raiz**: `persistRevision` do `offer-detail.component.ts` enviava
  `rev.revisionNumber` na rota `PUT /offers/:offerId/revisions/:revisionId`,
  mas a API resolve a revisão pela chave primária (`getRevisionById`).
  Reproduzido por TI: `PUT .../revisions/0` → 404. Bug **pré-existente** do
  componente (afetava também "Fechar revisão" e "Salvar parâmetros"),
  exposto agora pelos fluxos de status da change.
- **Correção**: `persistRevision` passa `rev.id`; parâmetro do
  `OffersApi.updateRevision` renomeado para `revisionId` com comentário.
- **Regressão**: 6 asserções de `updateRevision` no
  `offer-detail.component.spec.ts` passaram a exigir o id da revisão do
  mock (10) em vez do número (0) — falham sem a correção. Suíte web
  362/362 verde; E2E reexecutado 19/19.

## Testes de unidade e integração

- `npx nx run-many -t test lint -p api web domain calc-engine` verde após
  o fix (api 273, web 362, domain 115 + calc-engine com paridade — zero
  alteração numérica). Projeto não define meta de cobertura.

## Acessibilidade (telas alteradas)

- Campos novos com `label[for]` associado nos dois formulários (verificado
  programaticamente, `e2e9a`); campo número do leilão alcançável por Tab
  (`e2e9b`); mensagens de erro em pt-BR sob os campos (mat-error);
  alertas RN-02 com `role="alert"`; placeholders com exemplos; contraste
  segue os tokens do design system (alerta âmbar/erro vermelho já
  padronizados na casca).

## Visual e responsividade

- 1440px: `e2e1` (form com previews), `e2e4` (aba de parâmetros com os 2
  alertas do seed), `e2e5` (3 alertas), `e2e6`/`e2e6b` (chips WON e
  IN_EXECUTION), `e2e7`/`e2e7b` (deságio negativo e 50,00%).
- 375px: `e2e8-form-375px.png` — sem estouro horizontal (body ≤ 380px).
- Estado vazio: `ti3`/`e2e4` cobrem campos não informados ("não informado",
  sem derivados); estado de erro: `e2e3` (validação no form).

## Observações

- PUT com `null` explícito **limpa** os cinco campos novos (fix M1/MIN-1 do
  grupo 2), mas mantém o valor nos campos anuláveis legados (`winningRap`
  etc.) — semântica pré-existente `?? undefined`, registrada na review do
  grupo 2 como dívida; o cenário 17 é coberto pela oferta-mestre do seed.
- O 409 de transição fora de ordem não é alcançável pela UI (os botões só
  aparecem nos estados válidos) — coberto por TI (`ti7`, `ti8`) e por teste
  de componente com o snackbar exibindo a mensagem exata da API.
- Os dois alertas RN-02 da oferta-mestre são esperados e documentados na
  nota do seed (edital 4/2026).

## Portas e encerramento

- Postgres 5432 (Compose, mantido), API 3000 e web 4200 (encerrados ao
  final do QA).
