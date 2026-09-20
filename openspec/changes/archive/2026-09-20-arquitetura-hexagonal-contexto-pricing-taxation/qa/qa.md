# QA - Arquitetura Hexagonal nos Contextos Pricing e Taxation

## Resumo: APROVADO

QA de regressão (change com `skip_specs: true` — refatoração arquitetural sem delta de spec). Critérios: preservação byte a byte dos contratos HTTP de `/api/taxation/*` e `/api/lines/:lineId/pricing/*` contra o legado removido, e bootstrap real da API — a regressão crítica desta change, dado o bug de DI corrigido na task 5.4 (a API não subia desde a migração hexagonal).

Todos os 9 itens PASSARAM ao vivo. Zero bugs encontrados nesta execução (o bug de DI foi encontrado e corrigido durante a implementação, com teste de regressão permanente `apps/api/src/app/context-modules-di.spec.ts`).

## Ambiente

- Postgres: container `lt-offers-postgres` (porta 5432, docker compose)
- API: `npx nx serve api` na porta 3000
- Web: `npx nx serve web` na porta 4200, navegador real via ferramenta de automação
- Massa de teste: oferta `QA-PRICING-01` criada via `POST /api/offers` (linha `LT-QA-01`, 100 km, 500 kV, destino MG 100%), removida ao final

## Checklist

| # | Item | Tipo | Resultado | Evidência |
|---|---|---|---|---|
| TI-1 | API sobe com DI real (bootstrap completo, health `{"status":"ok","banco":"ok"}`) — antes do fix da task 5.4, o boot quebrava no primeiro módulo de contexto | TI | PASSOU | `evidences/ti1-health.json` |
| TI-2 | `GET /api/taxation/states`: 27 UFs, envelope idêntico ao legado (SP 18/SINGLE_BASE, MG 2.0 FECOEP/DOUBLE_BASE) | TI | PASSOU | `evidences/ti2-states.json` |
| TI-3 | `GET /api/taxation/icms-matrix`: 729 pares (27×27); SP→MG 12%, SP→BA 7% (regra Sul/Sudeste→N/NE/CO/ES) | TI | PASSOU | `evidences/ti3-icms-matrix.json` |
| TI-4 | `GET /api/taxation/ipi-rules`: 9 NCMs; 7308.20.00 = 3,25% | TI | PASSOU | `evidences/ti4-ipi-rules.json` |
| TI-5 | `GET /api/lines/1/pricing/quotes`: 8 cotações na ordem do catálogo (MAT-TOR-EST primeiro) | TI | PASSOU | `evidences/ti5-quotes.json` |
| TI-6 | `GET /api/lines/1/pricing/summary`: cálculo completo (5 itens paramétricos, fallback gracioso de fundações não calculadas; líquido 62.313.800; bruto 75.502.603,50; sem itens sem preço) | TI | PASSOU | `evidences/ti6-summary.json` |
| TI-6b | `GET /api/lines/999/pricing/summary`: 404 com mensagem pt-BR exata "Linha de transmissão com ID 999 não encontrada" (exceção de domínio mapeada no controller) | TI | PASSOU | `evidences/ti6b-404.json` |
| TI-7 | `POST /api/lines/1/pricing/simulate` (REIDI + spots): PIS/COFINS zerados, economia REIDI 6.188.601,50 | TI | PASSOU | `evidences/ti7-simulate-reidi.json` |
| E2E-8 | Aba "Preços e tributos da linha" na web renderiza os dados do contexto novo — cards batem exatamente com a API (líquido R$62.313.800,00; impostos R$13.188.803,50 = IPI R$1.206.897 + DIFAL R$4.849.946; bruto R$75.502.603,50; card Economia REIDI) e tabela de itens com IPI por NCM (6,5% isoladores, 5% ferragens); zero erros no console | E2E | PASSOU | capturas via ferramenta de navegador na sessão (IDs ss_43283c49h, ss_1253rc69w) |

## Testes de unidade e integração

- `npx nx run-many -t test lint build -p api`: 161 testes verdes (35 suítes), lint 0 erros, build webpack ok.
- `npx nx run-many -t test`: 4 projetos verdes (api, web, domain, calc-engine).
- `npx nx format:check --all`: limpo.
- Regressão nova: `context-modules-di.spec.ts` compila os 6 módulos de contexto com DI real (6/6).

## Acessibilidade / visual / responsividade

N/A — a change não cria nem altera telas (zero arquivos em `apps/web`); a aba de precificação foi verificada apenas como smoke de integração api↔web.

## Bugs

Nenhum bug novo nesta execução. Registro histórico da change: bug crítico de bootstrap de DI (construtores de união sem `@Inject`) encontrado durante a implementação, corrigido nos 18 construtores dos 4 contextos afetados, com teste de regressão permanente — detalhes na task 5.4 e na review `reviews/grupos-1-5_task_review.md`.

## Observações

- Ambiente encerrado ao final (serves de api/web parados; Postgres do Compose mantido).
- Massa `QA-PRICING-01` removida via API após os testes.
