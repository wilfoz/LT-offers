# QA — catalogo-isoladores

**Resultado: APROVADO** — 6/6 cenários do spec `catalogos/isoladores` verificados (20/20 verificações E2E, TI de vigência/imutabilidade, suíte completa verde), sem bugs de aplicação abertos.

## Ambiente

- Postgres: container `lt-offers-postgres` (Compose), banco `lt_offers`, porta 5432.
- API: `npx nx serve api`, porta 3000.
- Web: `npx nx serve web`, porta 4200 (proxy `/api` → 3000).
- E2E: Playwright (Chromium) via `qa/e2e.mjs`; evidências em `qa/evidences/`.
- Estado inicial determinístico: `TRUNCATE insulator_version, insulator RESTART IDENTITY` antes de cada execução; vigências preenchidas explicitamente (01/08 e 01/09/2026) para eliminar corrida de relógio na virada do dia.

## Checklist por cenário do spec

| Cenário (spec `catalogos/isoladores`) | Tipo | Resultado | Evidência |
| --- | --- | --- | --- |
| Criação com dados válidos | E2E + TU | PASSOU | `04-form-preenchido.png`, `05-lista-pendencia-linha-fuga.png` (snackbar "Isolador salvo" visível) |
| Código duplicado é rejeitado | E2E + TU (409/P2002) | PASSOU | `07-form-codigo-duplicado-409.png` |
| Valores numéricos inválidos são rejeitados | E2E + TU (form e DTO) | PASSOU | `02-form-valores-invalidos.png`, `03-form-escala-excedente.png` |
| Busca por código | E2E + TU (termo assertado no `where`) | PASSOU | `08-lista-busca-codigo.png` |
| Item sem linha de fuga aparece sinalizado | E2E + TU (null ≠ zero) | PASSOU | `05-lista-pendencia-linha-fuga.png`, `06-lista-dois-itens.png` (item completo sem pendência) |
| Consulta do histórico após edição | E2E + TU | PASSOU | `09-form-edicao-prefill.png`, `10-historico-duas-versoes.png` (duas versões, datas civis 01/09 e 01/08/2026, autor, valores da época com "—" para não informado) |

Comportamento comum `catalogos/versionamento-vigencia` (sem delta, verificado por TI na API): `effectiveOn=2026-08-15` devolve a versão de 01/08 (ruptura 120.5, linha de fuga nula); `effectiveOn=2026-07-01` (anterior à primeira vigência) → 404; `PATCH /versions/:id` → 405 (imutabilidade). PUT/PATCH também cobertos por TU.

## Verificações complementares

- **Estado de erro**: falha da API na listagem exibe alerta em pt-BR em vez de fingir catálogo vazio (`11-lista-estado-erro.png`).
- **Acessibilidade**: todos os campos do form com rótulo associado (`label[for]` verificado por sonda no DOM); Tab percorre os campos na ordem (código → descrição); mensagens de erro em pt-BR via `mat-error`/`role="alert"`; contraste e fontes herdados do tema Swiss já validado na change design-system-swiss; `mat-progress-bar` presente em listagem e histórico.
- **Responsividade**: listagem e formulário em 375 px sem overflow horizontal (sonda `scrollWidth − clientWidth = 0`; `12-`/`13-responsivo-375-*.png`).
- **Smoke dos demais catálogos** (o menu da casca mudou nesta change): condutores, guarda, tirante e séries renderizam com título correto (`14-` a `17-smoke-*.png`).
- **Suíte completa**: `npx nx run-many -t lint test build --skip-nx-cache` verde (api 186 testes/16 suites; web 108 testes/19 suites; domain; calc-engine) e `npx nx format:check --all` limpo. Não há meta de cobertura definida no projeto.

## Bugs e falsos negativos

- Nenhum bug de aplicação encontrado.
- **1 falso negativo do script E2E** (não é bug do produto): a asserção da busca lia a tabela antes de a resposta filtrada renderizar — o cell buscado já estava no DOM da listagem completa (mesma corrida de render registrada no QA de catalogo-series-torres). Correção no `e2e.mjs`: aguardar a linha não filtrada sair do DOM (`waitFor({ state: 'detached' })`) antes de ler a tabela. Reexecução completa do zero: 20/20 PASS.

## Observações

- Dados de QA (`ISO-QA-120`, `ISO-QA-P-160`) permanecem no banco dev local; não afetam testes (suítes usam mocks) e o estado é truncado no início de cada execução do E2E.
- O fluxo de escala excedente (recomendação da review do grupo 4) foi exercitado no navegador: `120.505` em carga de ruptura → "Use no máximo 2 casas decimais" sem submit.
