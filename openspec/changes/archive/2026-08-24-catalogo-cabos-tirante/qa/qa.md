# QA — catalogo-cabos-tirante

## Resumo: APROVADO

Todos os 7 cenários do spec `catalogos/cabos-tirante` verificados e PASSOU,
mais 3 contratos de API herdados do versionamento, 2 smokes dos catálogos
refitados pela extração (condutores e guarda) e as verificações de
acessibilidade e responsividade — sem bugs abertos. Nenhum defeito da
aplicação foi encontrado; a única falha da primeira execução do E2E era do
próprio script (contagem de Tabs desatualizada após o 3º link de navegação),
corrigida no script e reexecutada com 15/15.

## Ambiente

| Serviço  | Porta | Observação                                        |
| -------- | ----- | ------------------------------------------------- |
| Postgres | 5432  | Compose `lt-offers-postgres` (mantido ao final)   |
| API      | 3000  | `npx nx serve api` (encerrado ao final)           |
| Web      | 4200  | `npx nx serve web`, proxy `/api`→3000 (encerrado) |

Tabelas `guy_wire*` truncadas antes de cada execução (restos das verificações
ao vivo da task 4.4). Script E2E: `qa/e2e-qa.mjs` (Playwright/Chromium
1280×800; evidências em `qa/evidences/`).

## Checklist por cenário do spec

| # | Cenário (spec `catalogos/cabos-tirante`) | Tipo | Resultado | Evidência |
|---|---|---|---|---|
| S1 | Criação com dados válidos | E2E | PASSOU | `02-form-preenchido.png`, `03-lista-apos-criacao.png` |
| S2 | Código duplicado rejeitado | E2E | PASSOU | `04-erro-codigo-duplicado.png` |
| S3 | Valores numéricos inválidos rejeitados | E2E + TU | PASSOU | `05-erro-valor-numerico.png` |
| S4 | Número de fios não inteiro rejeitado | E2E + TU | PASSOU | `06-erro-fios-fracionario.png` |
| S5 | Busca por código | E2E | PASSOU | `08-busca-por-codigo.png` |
| S6 | Item sem grau de resistência sinalizado | E2E | PASSOU | `07-pendencia-grau-resistencia.png` |
| S7 | Histórico após edição com autor e vigências | E2E | PASSOU | `09-form-nova-versao.png`, `10-historico-versoes.png` |

Contratos herdados de `catalogos/versionamento-vigencia` (sem delta nesta
change), verificados via API: consulta em data passada retorna valores da
época; data anterior à primeira vigência → 404; PATCH de versão → 405
(`api-contratos.json`).

## Regressão da extração (grupo 1)

- Smoke E2E dos catálogos refitados: listagem de condutores com dados
  (`11-smoke-condutores.png`) e filtro por tipo dos cabos de guarda
  (`12-smoke-guarda-filtro.png`) — PASSOU.
- Suíte completa `npx nx run-many -t lint test build` — **verde** nos 4
  projetos: api 100 testes (25 novos do tirante), web 43 (14 novos),
  calc-engine 11, domain 1; builds de produção OK; `npx nx format:check`
  completo limpo.
- Critério do design (nenhuma asserção de teste alterada no refit) validado
  na review do grupo 1.
- Meta de cobertura: não definida no projeto (nada a verificar).

## Acessibilidade (telas novas)

- Navegação por teclado percorre nav, formulário inteiro e vigência
  (sequência `code>…>wireCount>effectiveFrom`) — PASSOU
- Todos os campos com `label for/id` (0 sem label) — PASSOU
- Erros com `role="alert"`, mensagens claras em pt-BR — PASSOU
- Sem imagens (nada a verificar de `alt`); contraste dos tons de
  erro/pendência (#b91c1c / #b45309 sobre branco) ≥ 4.5:1; fontes no padrão
  do navegador — PASSOU
- `13-a11y-form.png`

## Visual e responsividade

- Estados: vazio (`01`, `15`), com dados (`03`, `08`), erro (`04`, `05`,
  `06`) — capturados.
- Breakpoints da listagem: 375/768/1280 — `14-responsivo-lista-*.png`.
  Em 375 px a tabela larga exige rolagem horizontal (comportamento herdado
  do padrão dos catálogos; sem regressão).

## Bugs

Nenhum bug da aplicação. Registro: a 1ª execução do E2E falhou apenas no
item de teclado por defeito do script de QA (12 Tabs insuficientes com o
novo link de navegação); corrigido no `e2e-qa.mjs` (15 Tabs) e reexecutado
integralmente com 15/15 PASSOU.

## Observações

- Dados de QA (`QA-*`) permanecem no banco local de desenvolvimento.
- Terceiro catálogo construído sobre a base extraída: o QA não encontrou
  nenhuma divergência de comportamento entre os três catálogos.
