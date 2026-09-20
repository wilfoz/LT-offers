# QA - Arquitetura Hexagonal no Contexto Economics

## Resumo: APROVADO

QA de regressão (change com `skip_specs: true` — refatoração arquitetural sem delta de spec). Critérios: preservação dos contratos HTTP das 9 rotas dos três agregados (serviços M09, resultado econômico M10, desembolso M11), mascaramento RNF-17 por papel, consumidores religados à fachada (export/baseline) e bootstrap com DI real (7 módulos de contexto no spec de regressão).

Todos os 12 itens PASSARAM ao vivo. Zero bugs nesta execução. Os 2 majors da review (cobertura de teste dos controllers de serviços/desembolso e asserções relacionais podadas) foram corrigidos ANTES do QA — 177 testes na api após as correções.

## Ambiente

- Postgres: container `lt-offers-postgres` (porta 5432)
- API: `npx nx serve api` (porta 3000); Web: `npx nx serve web` (porta 4200) com navegador real
- Massa: oferta `QA-ECON-01` (id 2) com 2 linhas (100 km/MG e 80 km/BA), removida ao final
- Papel simulado via headers `x-user-role` (ADMIN × ENGINEERING)

## Checklist

| # | Item | Tipo | Resultado | Evidência |
|---|---|---|---|---|
| TI-1 | API sobe com DI real incluindo `EconomicsModule` (7º módulo no spec de regressão) | TI | PASSOU | `evidences/ti1-health.json` |
| TI-2 | `GET /api/lines/2/services/summary`: 6 itens CIP, venda > custo direto, `ratios.costPerKm` | TI | PASSOU | `evidences/ti2-services-summary.json` |
| TI-3 | `GET /api/lines/2/services/measurement-sheet`: 6 itens, GR01.01.01 | TI | PASSOU | `evidences/ti3-measurement-sheet.json` |
| TI-4 | `GET /api/lines/2/economic-result` (ADMIN): venda 61.820.989,86; margem 22,10%; BDI 30,63 | TI | PASSOU | `evidences/ti4-economic-result-admin.json` |
| TI-4b | Mesmo endpoint com papel ENGINEERING: venda/margem/BDI zerados, custo líquido visível (RNF-17) | TI | PASSOU | `evidences/ti4b-economic-result-masked.json` |
| TI-5 | `GET /api/offers/2/economic-result/consolidated`: "Consolidado (2 Linhas de Transmissão)", venda 111.277.781,76 | TI | PASSOU | `evidences/ti5-consolidated.json` |
| TI-6 | `POST .../economic-result/simulate` (margem alvo 10%): `resultingNetMarginRate` 10.00 | TI | PASSOU | `evidences/ti6-simulate.json` |
| TI-7 | `GET /api/lines/2/cashflow?advanceRate=20&...`: 18 meses, adiantamento refletido no mês 1 | TI | PASSOU | `evidences/ti7-cashflow-line.json` |
| TI-8 | `GET /api/offers/2/cashflow/consolidated`: "Fluxo de Caixa Consolidado (2 LTs)", capital de giro recomendado | TI | PASSOU | `evidences/ti8-cashflow-consolidated.json` |
| TI-9 | 404 pt-BR exatos: "Linha de transmissão ID 999 não encontrada." e "Oferta ID 999 não encontrada." | TI | PASSOU | `evidences/ti9a/ti9b` |
| TI-10 | Consumidor religado: `GET /api/offers/2/export/performance-indicators` exercita a `EconomicsFacadeService` (consolidado econômico + cashflow) de ponta a ponta | TI | PASSOU | `evidences/ti10-export-indicators.json` |
| E2E-11 | Aba "Resultado & BDI (M10)" na web: preço final R$ 111.277.781,76 idêntico à API, lucro bruto R$ 24.588.713,01, BDI 1.3063 (30,63%), Quadro R com fechamento R$ 69.547.500,00 conferido na mão contra a soma paramétrica das 2 linhas (38,64M + 30,91M), coeficientes K default; zero erros de console | E2E | PASSOU | capturas na sessão (ss_6943lvnxo, ss_21534owey, ss_0012t0rmt) |

## Testes de unidade e integração

- `npx nx run-many -t test lint build -p api`: 177 testes verdes (após correções M1/M2 da review: +7 testes de controllers, asserções relacionais restauradas), lint 0 erros, build webpack ok.
- `npx nx run-many -t test`: 4 projetos verdes. `npx nx format:check --all`: limpo.

## Acessibilidade / visual / responsividade

N/A — a change não cria nem altera telas (zero arquivos em `apps/web`); as abas M09/M10/M11 foram verificadas como smoke de integração api↔web.

## Bugs

Nenhum nesta execução. Correções pré-QA vindas da review (`reviews/grupos-1-4_task_review.md`): M1 (specs dos controllers de serviços e desembolso com mapeamento domínio→404) e M2 (asserções relacionais do legado restauradas no `usecases.spec.ts`).

## Observações

- Ambiente encerrado ao final (serves parados com kill da árvore de processos; Postgres mantido). Massa `QA-ECON-01` removida (204).
