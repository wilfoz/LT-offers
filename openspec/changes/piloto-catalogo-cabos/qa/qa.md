# QA — piloto-catalogo-cabos

**Resultado: APROVADO** · Data: 2026-08-23 · Executor: Claude (skill executar-qa)

## Ambiente

| Serviço  | Porta | Observação                                  |
| -------- | ----- | ------------------------------------------- |
| Postgres | 5432  | Docker Compose (`lt-offers-postgres`)       |
| api      | 3000  | `npx nx serve api`                          |
| web      | 4200  | `npx nx serve web` (proxy `/api` → 3000)    |

Ferramenta de navegador: Playwright (Chromium headless), script em `qa/e2e-qa.mjs` — reexecutável após limpar itens `QA-%` no banco.

## Checklist por cenário dos specs

### catalogos/versionamento-vigencia

| Cenário | Tipo | Resultado | Evidência |
| --- | --- | --- | --- |
| Edição de item gera nova versão | E2E | PASSOU | `08-form-nova-versao.png`, `10-historico-versoes.png` |
| Versão histórica é imutável | API | PASSOU (PATCH → 405) | `api-contratos-vigencia.json` |
| Consulta na data atual | E2E | PASSOU (versão futura 01/09 não aparece como vigente hoje) | `09-lista-vigencia-atual.png` |
| Consulta em data passada | API | PASSOU (`vigenteEm=2026-08-23` → peso 1.3026; `2026-12-01` → 1.31) | `api-contratos-vigencia.json` |
| Data anterior à primeira vigência | API | PASSOU (404 com mensagem, sem valor) | `api-contratos-vigencia.json` |
| Autoria registrada na criação | E2E | PASSOU (autor "sistema" visível no histórico) | `10-historico-versoes.png` |

### catalogos/cabos-condutores

| Cenário | Tipo | Resultado | Evidência |
| --- | --- | --- | --- |
| Criação com dados válidos | E2E | PASSOU | `02-form-novo-preenchido.png`, `03-lista-apos-criacao.png` |
| Código duplicado é rejeitado | E2E | PASSOU (mensagem pt-BR do 409) | `04-erro-codigo-duplicado.png` |
| Valores numéricos inválidos são rejeitados | E2E | PASSOU (mensagem aponta formato) | `05-erro-valor-numerico.png` |
| Busca por código | E2E | PASSOU (1 resultado para "QA-E2E") | `07-busca-por-codigo.png` |
| Item sem UTS aparece sinalizado | E2E | PASSOU ("Pendente: UTS (kN)"; valor exibido como "—", distinto de 0) | `06-lista-pendencia-uts.png` |
| Consulta do histórico após edição | E2E | PASSOU (2 versões, ordem decrescente de vigência) | `10-historico-versoes.png` |

## Testes de unidade e integração

`npx nx run-many -t lint test build` — **verde nos 4 projetos** (api: 30 testes Jest, incluindo regressões de data civil/fuso, P2002 e rotas imutáveis; web: 11 testes Vitest, incluindo regressões de estados de erro; motor-calculo: 11; dominio: 1). O projeto não tem meta formal de cobertura definida — sem verificação de meta.

## Acessibilidade (telas: listagem, formulário, histórico)

- [x] Navegação por teclado — Tab percorre busca → campos do formulário na ordem visual (`11-a11y-form.png`)
- [x] Elementos interativos com rótulos descritivos — links e botões nomeados
- [x] Imagens com `alt` — N/A (não há imagens de conteúdo)
- [x] Contraste — texto padrão preto/branco; alertas #b91c1c e pendências #b45309 sobre branco (≥ 4.5:1)
- [x] Formulários com rótulos associados — 0 inputs sem `label[for]` (verificação programática)
- [x] Mensagens de erro claras, acessíveis e em pt-BR — `role="alert"` nos erros de campo, servidor e carregamento
- [x] Fontes com tamanho apropriado — padrão do navegador, sem reduções

## Visual e responsividade

Estados capturados: com dados (`03`), vazio (`13-estado-vazio.png`), erro (`04`, `05`). Breakpoints: 375 px, 768 px e 1280 px (`12-responsivo-lista-*.png`) — tabela legível em todos; em 375 px a tabela usa a largura total sem quebra de layout.

## Bugs encontrados e correções

| # | Descrição | Severidade | Correção | Regressão |
| --- | --- | --- | --- | --- |
| B1 | Links "Editar" e "Histórico" sem espaçamento na coluna Ações | cosmético | CSS `td a + a { margin-left: 0.6rem }` em `lista-cabos.component.ts` | visual — coberto pelas capturas |

Falha inicial do item de busca no script E2E era corrida do próprio teste (contagem antes da resposta filtrada renderizar) — corrigida no script com `waitForResponse`; a API filtra corretamente (verificado isoladamente).

## Observações

- Autor das versões é "sistema" (design D6 — a web ainda não envia `X-Usuario`); passa a ser o usuário autenticado na change de autenticação (RNF-17).
- Dados de teste `QA-E2E-001` e `QA-PEND-001` permanecem no banco local de desenvolvimento; limpar com `DELETE ... WHERE codigo LIKE 'QA-%'` se desejado.
