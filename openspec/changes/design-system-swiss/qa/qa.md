# QA — design-system-swiss

**Resultado: APROVADO** — 7/7 cenários do spec `interface/casca-navegacao` verificados como PASSOU, smoke das 14 telas refitadas nos esquemas claro/escuro e nos breakpoints, acessibilidade e suíte completa verde. **1 bug encontrado e corrigido na causa raiz** (BUG-1, abaixo), revalidado.

## Ambiente

- Postgres: container `lt-offers-postgres` do Compose (5432). API `npx nx serve api` na porta **3000**; web `npx nx serve web` na porta **4200** (proxy `/api`→3000). Encerrados ao fim; dados de teste ("QA Design Swiss") removidos.
- Navegador: Playwright/Chromium headless (`qa/e2e.mjs`), contextos: claro 1280px, móvel 375px e `colorScheme: 'dark'` 1280px. Evidências em `qa/evidences/`.
- Data da execução: 24/08/2026.

## Checklist por cenário (spec `interface/casca-navegacao`)

| # | Cenário | Tipo | Resultado | Evidência |
|---|---------|------|-----------|-----------|
| 1 | Item ativo destacado | E2E | PASSOU | `01-casca-desktop-claro-item-ativo.png` (4 itens, ativo "Séries de estruturas", sem botão de menu em tela larga) |
| 2 | Troca de catálogo pela navegação | E2E | PASSOU | `02-casca-troca-catalogo.png` (destaque move para "Cabos de tirante") |
| 3 | Tela estreita com menu recolhido | E2E | PASSOU | `13-movel-menu-recolhido.png`, `14-movel-menu-aberto.png` (sidenav oculta, botão `aria-label` abre sobreposta, fecha após navegar) |
| 4 | Tabela larga em tela estreita | E2E | PASSOU (após BUG-1) | `18-revalida-movel-rolagem-contida.png` (`bodyScroll 375 = viewport`, `.table-scroll` rolável) |
| 5 | Preferência escura do sistema | E2E | PASSOU | `16-escuro-listagem-series.png`, `17-escuro-form-serie.png` — fundo `rgb(20,19,19)` (lum. 0.08) com texto `rgb(229,226,225)` (lum. 0.89), contraste ≈ 15:1 (AA/AAA) |
| 6 | Confirmação após salvar | E2E | PASSOU | `03-snackbar-serie-salva.png` ("Série de estrutura salva" + navegação para a listagem) |
| 7 | Falha de leitura exibida inline | E2E | PASSOU | `12-erro-leitura-inline.png` (rota abortada → mensagem inline pt-BR na região; navegação com os 4 itens utilizável) |

## Smoke das telas refitadas

- Claro/desktop: 4 listagens + 5 formulários (`04`–`10`), detalhe da série, form de tipo com FormArray e histórico da série (`09`–`11` da série de evidências `smoke-*`). Tudo com o visual Material/Swiss (cantos retos, mat-table densa, mat-form-field outline com rótulo fixo).
- Escuro: listagem de séries, form de série e listagem de condutores (`16`–`17` + `escuro-lista-condutores`).
- Móvel 375px: menu sobreposto, listagem com rolagem contida (`13`, `14`, `15`/`18`).

## Bugs

**BUG-1 — Página com rolagem horizontal em telas estreitas** (cenário 4 reprovou na 1ª execução: `bodyScroll` 486px > 375px). Investigação com sonda de elementos: a tabela estava corretamente contida pelo `.table-scroll`; o ofensor era o **`h1.app-title` da toolbar** — filho de flex sem `min-width: 0`, não encolhia (430px) e esticava a página. **Correção na causa raiz** (`apps/web/src/app/app.scss`): `min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap` no título. **Regressão**: o próprio cenário E2E "tabela larga em tela estreita" do `qa/e2e.mjs` (vermelho antes, verde depois — `18-revalida-movel-rolagem-contida.png`); comentário no SCSS aponta a cobertura. Revalidado: 375 = 375 com a tabela rolável no wrapper.

## Testes de unidade e integração

- `npx nx run-many -t lint test build` (comando canônico do CI): **verde** — 92 testes web (16 arquivos; 82 preservados sem alteração de asserção + 5 da casca + 5 do snackbar), 160 api, 11 calc-engine, 1 domain; builds ok.
- `npx nx format:check --all`: **limpo** (gate completo, o mesmo do CI).
- Sem meta de cobertura definida no projeto.

## Acessibilidade (telas alteradas)

- Rótulos: todos os campos resolvidos por rótulo acessível — o próprio E2E opera via `getByLabel` em todos os formulários (mat-form-field associa `mat-label` automaticamente); botão de menu com `aria-label`; ícones decorativos com `aria-hidden`; progress bars com `aria-label`.
- Teclado: navegação da casca por Tab (mat-nav-list nativa), Esc fecha a sidenav sobreposta (comportamento do Material), foco visível preservado (anel do Material não removido).
- Erros: `mat-error` por campo e mensagens inline com `role="alert"`, todas em pt-BR (textos idênticos aos anteriores, verificados pela suíte sem alteração de asserção).
- Contraste: escuro medido ≈ 15:1 (cenário 5); claro usa `on-surface` off-black sobre branco (> 12:1). Fontes no padrão 16px/1.6 do tema.
- Tabelas com `caption` e `th scope`; imagens de conteúdo inexistentes.

## Observações

- O texto "Carregando…" convive com a `mat-progress-bar` (asserções preservadas + indicador visual do DESIGN.md).
- Desvios conscientes do DESIGN.md registrados na proposta (sem sort/paginação, sem matDatepicker, sem toggle de tema) seguem válidos; a paleta off-black foi gerada pelo schematic já nesta change (fallback do documento inexistente na v22).
