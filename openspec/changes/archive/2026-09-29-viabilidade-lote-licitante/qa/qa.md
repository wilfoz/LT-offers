# QA — viabilidade-lote-licitante (M13)

**Resumo: APROVADO** — 25/25 verificações passaram (14 E2E + 11 TI), suítes completas verdes (domain 171, api 320, web 393), zero bugs encontrados.

- Data: 2026-09-29
- Ambiente: Postgres via Docker Compose (`lt-offers-postgres`, porta 5432), API `npx nx serve api` na porta 3000, web `npx nx serve web` na porta 4200.
- E2E: Playwright headless (script `qa/e2e-viabilidade.js`, executado da raiz).
- Ofertas de apoio criadas via API pelo TI (permanecem no banco de dev): `QA-M13-INVIAVEL` (29→id 30/rev 31), `QA-M13-SEM-DADOS` (id 31/rev 32), `QA-M13-BENCH` (id 32/rev 33). A oferta-mestre (id 29/rev 30) foi restaurada ao estado original (bidderCapex e winningRap limpos — verificado no E2E-5).
- Versões de parâmetros criadas no exercício (histórico imutável, legítimas): 2027-03-01/WACC 7,50 (TI-2) e 2027-06-01/WACC 7,25 (E2E-11); a vigente de hoje segue 2026-03-01/8,00.

## Checklist por cenário do spec

### Spec `viabilidade-lote-licitante` — Requirement: Parâmetros versionados por vigência (RNF-05)

| Cenário | Tipo | Resultado | Evidência |
| --- | --- | --- | --- |
| Edição cria nova versão preservando o histórico | TI | PASSOU | `ti2-nova-versao-preserva-historico.json` (POST 2027-03-01/7,50 → effectiveOn 2026-09-01 devolve 8,00 e 2027-06-01 devolve 7,50) |
| Avaliação resolve a versão vigente pela data da oferta | TI | PASSOU | `ti7-assessment-mestre-canonico.json` (`parameters.waccRealAfterTaxPercent = 8.00` com versão 7,50 já existente — oferta datada de 2026-03-25) |
| Validação dos parâmetros | TI | PASSOU | `ti4-validacao-400.json` (400 com 1 mensagem pt-BR por campo: formato da vigência, WACC > 0, prazo ≥ 1, fator ≤ 100%, escala 2; data civil 2028-02-30 rejeitada por round-trip) |

Extras do requirement: vigência duplicada → 409 (`ti5-vigencia-duplicada-409.json`); PUT/PATCH → 405 imutável (`ti6-put-patch-405-imutavel.json`); seed vigente conferido no banco e via GET (`ti1-parametros-vigentes-seed.json`).

### Spec `viabilidade-lote-licitante` — Requirement: Derivar anuidade, RAP mínima e deságio máximo (RNF-08)

| Cenário | Tipo | Resultado | Evidência |
| --- | --- | --- | --- |
| Deságio máximo a partir do investimento do licitante (valores canônicos) | TU + E2E | PASSOU | TU: `libs/domain viability-derivations.spec.ts` (171 verdes); E2E-2 com bidderCapex 4110000000.00 → anuidade 365.080.751,22, RAP mínima 496.657.825,69, deságio máx 34,88% (`e2e2-bidder-capex-origem-licitante.png`) |
| Investimento base recua ao CAPEX ANEEL com origem identificada | TI + E2E | PASSOU | `ti7-assessment-mestre-canonico.json` (`investmentSource: ANEEL_ESTIMATE`) + E2E-1 (`e2e1-painel-mestre-aneel.png`) |
| RAP mínima acima do teto → deságio máximo negativo | TI + E2E | PASSOU | `ti8-teto-insuficiente-desagio-negativo.json` (−24,16, `viableAtMaxRap: false`) + E2E-7 (`e2e7-inviavel-teto.png`) |
| Ausência de entradas não vira zero | TI + E2E | PASSOU | `ti9-entradas-faltantes.json` (derivados null + `missingInputs` = INVESTMENT, MAX_RAP, ESTIMATED_WINNING_RAP) + E2E-6 (`e2e6-entradas-faltantes.png`) |

### Spec `viabilidade-lote-licitante` — Requirement: Painel de viabilidade no detalhe da oferta (RNF-14)

| Cenário | Tipo | Resultado | Evidência |
| --- | --- | --- | --- |
| Painel completo com oferta viável | E2E | PASSOU | E2E-3: winningRap 500.000.000,00 → deságio 34,44% viável com folga de 0,44 p.p. destacada em verde (`e2e3-viavel-com-folga.png`) |
| Deságio pretendido acima do suportado é sinalizado | E2E | PASSOU | E2E-4: winningRap 381.315.000,00 → deságio 50,00% > 34,88%, destaque vermelho "não remunera o investimento nas premissas vigentes (excesso de 15,12 p.p.)", gravação NÃO bloqueada (`e2e4-desagio-acima-do-suportado.png`) |
| Comparação com deságios praticados do histórico | E2E | PASSOU | E2E-8: leilão 001/2022 no snapshot → mín/méd/máx 5,00%/41,31%/60,00% lado a lado com o máximo suportado (`e2e8-benchmark-leilao.png`); TI: `ti10-benchmark-leilao-snapshot.json` |

### Spec `ofertas/cadastro-revisoes-linhas` (MODIFIED)

| Cenário | Tipo | Resultado | Evidência |
| --- | --- | --- | --- |
| Investimento do licitante aceito e limpo como os demais campos financeiros | TI + E2E | PASSOU | `ti11-bidder-capex-roundtrip.json` (grava decimal exato → origem BIDDER; limpo → null e origem volta a ANEEL_ESTIMATE); escala 3 → 400 pt-BR (`ti11b-bidder-capex-escala-400.json`); E2E-2 e E2E-5 no fluxo da interface |

Demais cenários do requirement MODIFIED (inalterados pela change): regressão coberta pelas suítes completas (api 320, web 393 — todas verdes).

### Telas, acessibilidade e responsividade

| Verificação | Resultado | Evidência |
| --- | --- | --- |
| Tela `/catalogs/viability-parameters`: vigente carregada + fatores como hipótese | PASSOU | E2E-9 (`e2e9-tela-parametros.png`) |
| Validação da tela (WACC 0 → mensagem pt-BR, gravação bloqueada) | PASSOU | E2E-10 (`e2e10-validacao-wacc.png`) |
| Criar versão com vigência futura (vigente de hoje inalterada) | PASSOU | E2E-11 (`e2e11-versao-futura-criada.png`) |
| Item "Parâmetros de viabilidade" no menu da casca | PASSOU | E2E-12 |
| A11y: rótulos associados aos 6 campos (getByLabel) + navegação por teclado (Tab avança entre campos); erros com `mat-error`/`role="alert"` em pt-BR | PASSOU | E2E-13 |
| Responsividade 375px sem overflow horizontal (tela de parâmetros e painel) | PASSOU | E2E-14 (`e2e14-parametros-375px.png`, `e2e14-painel-375px.png`) |

## Testes de unidade e integração

- `npx nx run-many -t test -p api web domain` → domain 171/171, api 320/320, web 393/393 — todas verdes (sem meta de cobertura definida no projeto).
- `npx nx run-many -t test lint -p api web domain --skip-nx-cache` e `npx nx format:check --all` verdes na task 4.2; `npx prisma migrate status` em dia (17 migrations).
- Seed idempotente verificado: 2ª execução manteve o histórico ("Parâmetros de viabilidade já versionados"); valores conferidos no Postgres via psql.

## Reprodução dos TI

Chamadas HTTP executadas via PowerShell (`Invoke-RestMethod`, header `X-User: qa@celeoredes.com.br`); cada evidência JSON contém o payload/resposta correspondente:

1. `GET /api/viability/parameters` → ti1 (vigente do seed).
2. `POST /api/viability/parameters` `{effectiveFrom: 2027-03-01, wacc 7.50, 30, 9.25/10.00/10.00}` + `GET ?effectiveOn=2026-09-01` e `?effectiveOn=2027-06-01` → ti2.
3. `POST` com `{effectiveFrom: 01/03/2028, wacc 0, prazo 0, pis 101.00, om -1, ir 10.005}` e com `{effectiveFrom: 2028-02-30, ...válidos}` → ti4 (400 pt-BR).
4. Repetição do POST de 2027-03-01 → ti5 (409).
5. `PUT` e `PATCH /api/viability/parameters` → ti6 (405×2).
6. `GET /api/viability/assessment?offerId=29&revisionId=30` (oferta-mestre) → ti7 (canônicos + WACC 8,00 pela data da oferta).
7. `POST /api/offers` `{code: QA-M13-INVIAVEL, estimatedCapex 4110000000.00, maxRap 400000000.00}` + assessment → ti8.
8. `POST /api/offers` `{code: QA-M13-SEM-DADOS, sem financeiros}` + assessment → ti9.
9. `POST /api/offers` `{code: QA-M13-BENCH, auctionNumber 001/2022, lotNumber 1, estimatedCapex 1000000000.00, maxRap 200000000.00}` + assessment → ti10.
10. `PUT /api/offers/29/revisions/30` `{bidderCapex: 3000000000.00}` + assessment; depois `{bidderCapex: null}` + assessment → ti11; `{bidderCapex: 4110000000.005}` → ti11b (400).

## Bugs

Nenhum bug encontrado. Nenhuma correção necessária.

## Observações

- Os valores canônicos do spec (anuidade 365080751.22, RAP mínima 496657825.69, deságio máximo 34.88) foram conferidos fim a fim: domain (TU), API (TI-7) e interface (E2E-1/E2E-2) — idênticos nas três camadas.
- O leilão da oferta-mestre (004/2026) não existe no snapshot 2022–2024: painel exibe apenas a base completa (49 lotes), comportamento esperado; o cenário com `auctionStats` foi exercitado com a oferta QA-M13-BENCH (001/2022).
- Ambiente encerrado ao final: processos de serve parados; o Postgres do Compose permanece ativo.
