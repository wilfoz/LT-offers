# Design: design-system-swiss

## Context

Ver `proposal.md — Why`. A autoridade de layout é **`openspec/DESIGN.md`** (Swiss Style sobre Angular Material 3) — este design não repete o documento; fixa apenas COMO aplicá-lo ao `apps/web` atual (14 componentes standalone com estilos inline, 83 testes Vitest cujas asserções devem sobreviver) e os desvios conscientes já aprovados na proposta. Angular 22 standalone + signals; nenhum NgModule.

## Goals / Non-Goals

**Goals:**

- Tema 100% por tokens e `mat.*-overrides()` — nenhuma regra CSS contra seletor interno do Material; as proibições do DESIGN.md ("Não fazer") valem como critério de review dos grupos.
- Refit visual com **asserções de teste preservadas**: os specs de componente assertam texto (`textContent`), payloads e estado do form — nada disso muda; só markup/estilos.
- Casca acessível: foco visível do Material preservado, `aria-label` no botão de menu, navegação por teclado testada no QA.

**Non-Goals:**

- `matSort`/`mat-paginator`, `matDatepicker`, `mat-tab-group`, toggle de tema, paleta off-black gerada — desvios/dívidas listados na proposta ("Fora do escopo").
- Refatorar lógica de componente, serviços, contratos ou rotas — o refit é de template/estilo; a única lógica nova é o snackbar e o `BreakpointObserver` da casca.
- Design tokens próprios fora do Material (um arquivo de tema só; utilitários `.dense`, `.mono` e grid no `styles.scss`).

## Decisions

### D1 — Instalação e tema em um único ponto

`npm i @angular/material @angular/cdk` (sem `ng add` — o schematic mexe em arquivos que controlamos à mão). Tema completo em `apps/web/src/styles.scss` conforme o bloco do DESIGN.md: `mat.theme()` com `mat.$neutral-palette` (primary) + `mat.$orange-palette` (tertiary), `theme-type: color-scheme`, tipografia Inter, densidade 0 global; tokens `--mat-sys-corner-*` e `--mat-sys-level1/2` sobrescritos no `html`; classe `.dense` com `mat.form-field-density(-1)` + `mat.table-density(-1)`; utilitário `.mono` (JetBrains Mono) para decimais/códigos. Fontes e Material Symbols Outlined via `<link>` no `index.html` (aceito o request externo em dev; espelhar local é tarefa futura se a rede incomodar). Alternativa — tema pré-construído: proibida pelo DESIGN.md.

### D2 — Casca: `App` vira o shell Material

`app.html`: `mat-toolbar` fina (título + botão de menu em telas estreitas) sobre `mat-sidenav-container`; `mat-sidenav` com `mat-nav-list` (um item por catálogo, `routerLinkActive` ativando o estado `activated`); `mat-sidenav-content` com o contêiner de conteúdo (máx. 1280px, padding 1.5rem). Modo da sidenav por signal alimentado pelo `BreakpointObserver` (`side` + aberta ≥ 1024px; `over` + fechada abaixo — fechar após navegar no modo `over`). `min-height: 100dvh`; toolbar `position: sticky` (único z-index manual, 100). Testes do shell substituem o `app.spec.ts` atual: itens renderizados, item ativo, modo por breakpoint (mock do observer), botão de menu.

### D3 — Refit por família de tela, preservando asserções

Ordem: cabos (3 catálogos, telas mais simples e idênticas entre si) → séries/torres (detalhe + FormArray). Receita por família:

- **Listagem:** `table mat-table` com `.dense` + wrapper `overflow-x: auto` (cenário "tabela larga"); cabeçalho `surface-container`; colunas numéricas/códigos com `.mono` à direita; pendência como `<span class="badge">` (raio 2px, `tertiary-container`) — **sem** `role="status"`; busca em `mat-form-field outline` + `matButton`; estado vazio com `mat-icon` + texto + CTA `filled`; carregamento `mat-progress-bar indeterminate` no topo do conteúdo (o texto "Carregando…" pode permanecer para as asserções — barra é adição visual).
- **Formulário:** cada campo em `mat-form-field appearance="outline"` `floatLabel="always"` `subscriptSizing="dynamic"` com `<mat-label>`, `<mat-error>` (mesmas mensagens de `errorFor`/`rowError` — asserções intactas) e `<mat-hint>` "em branco = não informado" nos anuláveis; grid de 12 colunas (campos 3/4/6/12; 1 coluna < 768px); vigência segue `matInput type="date"` (desvio registrado); FormArray dos pesos: linhas em grid com `mat-form-field` + `matButton="outlined"` remover / adicionar; botões: salvar `matButton="filled"`, cancelar `matButton` (text).
- **Histórico/Detalhe:** `mat-card appearance="outlined"` por versão (tipo de torre) e para o card vigente do detalhe; tabelas como na listagem.
- Critério de aceite do refit: `npx nx test web` verde **sem alterar asserções existentes** (novos testes só para casca e snackbar); qualquer asserção que precise mudar é sinal de mudança de comportamento e volta ao design.

### D4 — Snackbar de confirmação (único comportamento novo)

`MatSnackBar.open('<Item> salvo', 'Fechar', { duration: 4000 })` no `next` do save dos 5 forms, antes do `router.navigate` (mensagem por catálogo, pt-BR). Erros de leitura/gravação continuam inline (nenhum erro vai só para snackbar — regra do DESIGN.md e do spec). Teste por form: sucesso → snackbar aberto (spy) + navegação; os testes existentes de erro não mudam.

### D5 — Claro/escuro e contraste

`color-scheme: light dark` no tema (D1) — sem toggle; a preferência do SO decide e o Material deriva os pares (`surface`/`on-surface` etc.) nos dois esquemas. As cores locais hardcoded que hoje existem nos componentes (`#b45309`, `#b91c1c`, `#ddd`) **saem** no refit, substituídas por `var(--mat-sys-error)`, `var(--mat-sys-tertiary)`/badge e `var(--mat-sys-outline-variant)` — hex literal em componente é proibido (DESIGN.md); é isso que garante o cenário do tema escuro sem áreas ilegíveis. Contraste AA verificado no QA nos dois esquemas.

## Risks / Trade-offs

- [Markup novo quebrar asserções de teste sem querer] → asserções são por texto/payload e sobrevivem a markup; rodar a suíte por grupo e tratar qualquer asserção quebrada como bug do refit (critério D3), não como ajuste de teste.
- [Versão do Material incompatível com a API `mat.theme()`/tokens do DESIGN.md] → instalar o major compatível com Angular 22 (Material 3 com `mat.theme()` é o padrão desde a v18); se a API divergir, ajustar a sintaxe do tema mantendo os tokens — o documento manda no resultado, não na sintaxe exata.
- [Fontes/ícones por CDN falharem offline] → fallbacks do próprio stack (`system-ui`, `ui-monospace`); ícones têm rótulo textual junto (estado vazio) ou `aria-label`; espelhar localmente é evolução futura.
- [Tema escuro revelar contraste ruim em componente específico] → QA valida os dois esquemas (cenário do spec); correção sempre via token, nunca hex pontual.
- [Snackbar interferir em testes existentes de navegação pós-save] → snackbar é aditivo (spy novo); asserções de navegação continuam passando.

## Migration Plan

Aditivo e por grupos com suíte verde entre eles: (1) dependências + tema + fontes (app ainda com telas antigas — tema global já muda tipografia/base sem quebrar nada); (2) casca; (3) refit cabos; (4) refit séries/torres; (5) snackbar; (6) QA visual/a11y (dois esquemas, breakpoints) + suíte completa + `npx nx format:check --all` antes de cada push (lição registrada) + CI. Rollback por git (sem migration, sem mudança de API). Rotina: review do `task-reviewer` por grupo, commit por grupo com staging explícito.

## Open Questions

- Nenhuma bloqueante. A sintaxe exata do tema pode variar com a minor do Material instalada (risco 2); resolve-se na task 1 sem afetar specs ou tasks.
