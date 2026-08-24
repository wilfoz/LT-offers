# QA — catalogo-cabos-guarda-opgw

## Resumo: APROVADO

Todos os 14 cenários do spec `catalogos/cabos-guarda` verificados e PASSOU,
sem bugs abertos. Nenhum defeito encontrado durante o QA (os apontamentos das
reviews de grupo — incl. o M1 do formulário — já haviam sido corrigidos com
regressão antes do QA). Execução em 23/08/2026 (data civil local; o relógio
UTC já marcava 24/08 — janela BRT 21h–24h exercitada de fato: as vigências
default gravaram a data civil correta).

## Ambiente

| Serviço  | Porta | Observação                                       |
| -------- | ----- | ------------------------------------------------ |
| Postgres | 5432  | Compose `lt-offers-postgres` (mantido ao final)  |
| API      | 3000  | `npx nx serve api` (encerrado ao final)          |
| Web      | 4200  | `npx nx serve web`, proxy `/api`→3000 (encerrado) |

Dados das tabelas `ground_wire*` truncados antes da execução (restos das
verificações ao vivo da task 3.5). Script E2E: `qa/e2e-qa.mjs`
(Playwright/Chromium 1280×800; evidências em `qa/evidences/`).

## Checklist por cenário do spec

| # | Cenário (spec `catalogos/cabos-guarda`) | Tipo | Resultado | Evidência |
|---|---|---|---|---|
| S1 | Criação de cabo de aço com dados válidos | E2E | PASSOU | `02-form-aco-preenchido.png`, `03-lista-apos-criacao-aco.png` |
| S2 | Criação de cabo OPGW com dados válidos | E2E | PASSOU | `04-form-opgw-preenchido.png`, `05-lista-apos-criacao-opgw.png` |
| S3 | Código duplicado rejeitado mesmo entre tipos | E2E | PASSOU | `06-erro-codigo-duplicado-entre-tipos.png` |
| S4 | Tipo inválido rejeitado | TI (API) | PASSOU | `api-contratos-tipo.json` (400, mensagem pt-BR) |
| S5 | Tipo não pode ser alterado em edição | E2E + TI | PASSOU | `12-edicao-tipo-travado.png` (UI sem seleção) + `api-contratos-tipo.json` (400 no POST /versions com type) |
| S6 | Valores numéricos inválidos rejeitados | E2E + TU | PASSOU | `07-erro-valor-numerico.png` |
| S7 | Atributo de OPGW em cabo de aço rejeitado | TI (API) | PASSOU | `api-contratos-tipo.json` (400 apontando "número de fibras") |
| S8 | Atributo de aço em cabo OPGW rejeitado | TI (API) | PASSOU | `api-contratos-tipo.json` (400 apontando "classe de galvanização") |
| S9 | Contagens não inteiras rejeitadas | E2E + TU | PASSOU | `08-erro-contagem-fracionaria.png` |
| S10 | Busca por código | E2E | PASSOU | `09-busca-por-codigo.png` |
| S11 | Filtro por tipo mantém o termo de busca | E2E | PASSOU | `10-filtro-por-tipo.png` (request com `search=QA&type=OPGW`) |
| S12 | Cabo de aço sem classe de galvanização sinalizado | E2E | PASSOU | `11-pendencia-classe-galvanizacao.png` |
| S13 | Cabo OPGW sem fabricante não é pendência | E2E | PASSOU | `05-lista-apos-criacao-opgw.png` ("Completo") |
| S14 | Histórico após edição com autor, vigência e atributos do tipo | E2E | PASSOU | `13-form-nova-versao.png`, `14-historico-com-especificos.png` |

Os cenários de versionamento comum (spec `catalogos/versionamento-vigencia`,
sem delta nesta change) seguem cobertos pelos 19 testes de unidade da API
(resolução de vigência, imutabilidade 405, data anterior à primeira → 404) e
foram exercitados de novo em S5/S14.

## Testes de unidade e integração

- `npx nx run-many -t lint test build` — **verde** nos 4 projetos:
  api 75 testes (19 novos), web 29 (16 novos), calc-engine 11, domain 1;
  builds de produção OK.
- `npx nx format:check` completo — **limpo**.
- Meta de cobertura: não definida no projeto (nada a verificar).

## Acessibilidade (telas novas)

- Navegação por teclado percorre busca, filtro de tipo, formulário e bloco
  condicional do tipo (evidência no resumo do E2E: sequência de foco
  `code>type>…>wireCount>effectiveFrom`) — PASSOU
- Todos os inputs/selects com `label for/id` (0 campos sem label) — PASSOU
- Erros com `role="alert"`, mensagens claras em pt-BR — PASSOU
- Blocos condicionais em `fieldset`/`legend` — PASSOU
- Sem imagens nas telas (nada a verificar de `alt`); contraste dos tons de
  erro/pendência (#b91c1c / #b45309 sobre branco) ≥ 4.5:1; fontes no padrão
  do navegador — PASSOU
- `15-a11y-form.png`

## Visual e responsividade

- Estados: vazio (`01`, `17`), com dados (`03`, `05`, `09`, `10`), erro
  (`06`, `07`, `08`) — capturados.
- Breakpoints da listagem: 375 (mobile), 768 (tablet), 1280 (desktop) —
  `16-responsivo-lista-*.png`. Em 375 px a tabela larga exige rolagem
  horizontal (comportamento herdado do padrão do piloto; sem regressão).

## Bugs

Nenhum bug encontrado nesta execução. Histórico relevante pré-QA: o M1 da
review do grupo 4 (campo inválido oculto pela troca de tipo travava o salvar
sem feedback) foi corrigido na implementação com teste de regressão
(`ground-wire-form.component.spec.ts` — "não trava o salvar quando valor
inválido ficou oculto pela troca de tipo").

## Observações

- A janela BRT 21h–24h (achado recorrente de datas) foi exercitada de fato:
  execução com UTC no dia seguinte e vigências default corretas na data civil
  de São Paulo — `civil-date.ts` cumprindo o contrato.
- Dados de QA (`QA-*`) permanecem no banco local de desenvolvimento.
