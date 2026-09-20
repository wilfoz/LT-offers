# QA - Arquitetura Hexagonal no Contexto Baseline

## Resumo: APROVADO

QA de regressão (change com `skip_specs: true`). Critérios: preservação dos contratos das 10 rotas de `/api/offers/:offerId/{baseline*,curve-s,progress-records,change-orders,cwe,erp-package*}`, quirks herdados (seeds, IDs, fallback do seed adaptado), integração com a `EconomicsFacadeService` no congelamento, eventos de auditoria via porta e bootstrap com DI real (8 módulos).

Todos os 10 itens PASSARAM ao vivo. Zero bugs nesta execução. Os 3 minors recomendados pela review (MIN-1 texto do design, MIN-2 asserção da mensagem 404, MIN-4 comentário do quirk de auditoria) foram corrigidos ANTES do QA — 185 testes na api.

## Ambiente

- Postgres `lt-offers-postgres` (5432); API `npx nx serve api` (3000); auth simulada via `x-user-role`
- Massa: oferta `QA-BASE-01` (id 3, 1 linha 100 km/MG), removida ao final; seeds in-memory da baseline 1 exercitados diretamente

## Checklist

| # | Item | Resultado | Evidência |
|---|---|---|---|
| TI-1 | API sobe com DI real incluindo `BaselineModule` (8º módulo no spec de regressão) | PASSOU | `evidences/ti1-health.json` |
| TI-2 | `GET /offers/1/baseline`: seed oficial (id 1, 7 pacotes EAP, contrato 124.850.000,00) | PASSOU | `evidences/ti2-baseline-seed.json` |
| TI-3 | `GET /offers/3/baseline`: fallback herdado — seed adaptado (`id` 1, `offerId` 3) | PASSOU | `evidences/ti3-baseline-adaptada.json` |
| TI-4 | `POST /offers/3/baseline/freeze` (ADMIN): baseline id 2 ACTIVE com valores REAIS da `EconomicsFacadeService` (contrato 61.820.989,86 = consolidado da oferta) e `frozenBy` do payload | PASSOU | sessão (resposta transcrita) |
| TI-5 | Aditivos: 3 seeds (AD-01/AD-02/PL-01); POST cria id 4 com código default `AD-04` e status DRAFT; PUT aprova (delta 480.000,00, `approvedAt` carimbado); CWE reflete: 127.860.000,00 sobre 124.850.000,00 com 3 aprovados | PASSOU | `evidences/ti5-change-orders.json`, `ti5b-cwe.json` |
| TI-6 | Boletim mês 4 (28,50%) + curva S: 18 meses, avanço atual 28,50, SPI 1.2825 (EVM) | PASSOU | `evidences/ti6-curve-s.json` |
| TI-7 | `POST /offers/1/erp-package` (SAP): 7 contas, cronograma 126 linhas (7×18), `generatedAt` carimbado na borda | PASSOU | `evidences/ti7-erp-json.json` |
| TI-8 | `POST .../erp-package/export-xlsx` (TOTVS_RM): Content-Type openxml, Content-Disposition `Carga_ERP_TOTVS_RM_Oferta_1.xlsx`, binário 13.481 bytes | PASSOU | `evidences/ti8-headers.txt`, `ti8-carga-erp.xlsx` |
| TI-9 | 404 pt-BR exatos: "Linha de Base ID 99 não encontrada." e "Change Order ID 999 não encontrada na baseline 1." | PASSOU | `evidences/ti9a-404-baseline.json` |
| TI-10 | Trilha de auditoria via `AuditTrailPort`: evento FREEZE registrado com a descrição do legado ("Congelamento da Linha de Base Contratual Data 0 para a oferta QA-BASE-01...") | PASSOU | `evidences/ti10-audit-trail.json` |

## Testes de unidade e integração

- `npx nx run-many -t test lint build -p api`: 185 testes verdes (15 do contexto novo), lint 0 erros, build webpack ok.
- `npx nx run-many -t test`: 4 projetos verdes. `npx nx format:check --all`: limpo.

## Acessibilidade / visual / responsividade

N/A — a change não cria nem altera telas (zero arquivos em `apps/web`).

## Bugs

Nenhum nesta execução. Correções pré-QA vindas da review (`reviews/grupos-1-4_task_review.md`): MIN-1 (design atualizado — dívida RNF-08 do parseFloat da curva S registrada para a change de persistência real), MIN-2 (asserção da mensagem 404 no controller spec), MIN-4 (comentário do quirk de auditoria dos aditivos). Minors 3/5/6/7 seguem registrados para a change de persistência real da baseline.

## Observações

- Ambiente encerrado ao final (serve da api parado com kill da árvore; Postgres mantido). Massa `QA-BASE-01` removida (204).
- O estado in-memory (baseline 2 congelada, AD-04, boletim mês 4) evapora com o processo — sem limpeza adicional necessária.
