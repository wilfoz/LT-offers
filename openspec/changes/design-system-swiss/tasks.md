# Tasks: design-system-swiss

## 1. Fundação do tema

- [x] 1.1 Instalar `@angular/material` + `@angular/cdk` (major compatível com Angular 22, sem `ng add`) e conferir o build (`npx nx build web`)
- [x] 1.2 Criar o tema Swiss em `apps/web/src/styles.scss` conforme o DESIGN.md (design D1): `mat.theme()` com neutral/orange e `color-scheme`, tipografia Inter, tokens `--mat-sys-corner-*` retos e sombras `--mat-sys-level1/2` rasas, classe `.dense` (form-field/table -1), utilitário `.mono`, grid de 12 colunas e contêiner de conteúdo; fontes Inter/JetBrains Mono + Material Symbols Outlined no `index.html`
- [x] 1.3 Suíte e gates verdes com o tema global aplicado sobre as telas antigas (`npx nx run-many -t test lint build -p web` + `npx nx format:check --all`)

## 2. Casca da aplicação

- [x] 2.1 Reescrever `app.ts/app.html/app.scss` como shell Material (design D2): `mat-toolbar` sticky + `mat-sidenav-container`/`mat-sidenav`/`mat-nav-list` com `routerLinkActive`, modo `side`/`over` por `BreakpointObserver` (fechar após navegar no modo `over`), botão de menu com `aria-label`, conteúdo máx. 1280px, `min-height: 100dvh`
- [x] 2.2 Escrever os testes da casca substituindo `app.spec.ts` (cenários do spec `interface/casca-navegacao`: itens por catálogo, item ativo, modo por breakpoint com observer mockado, botão de menu abre a sidenav sobreposta)

## 3. Refit visual — catálogos de cabos (9 telas)

- [ ] 3.1 Refitar `conductor-cable-list/-form/-history` pela receita D3 (mat-table `.dense` com wrapper de rolagem própria, badge de pendência sem `role="status"`, mat-form-field outline com label fixo/hint/erro, estado vazio com ícone + CTA, progress bar, tokens no lugar dos hex locais)
- [ ] 3.2 Refitar `ground-wire-list/-form/-history` (incl. fieldsets condicionais por tipo no grid de 12 colunas)
- [ ] 3.3 Refitar `guy-wire-list/-form/-history`
- [ ] 3.4 Suíte web verde **sem nenhuma asserção existente alterada** (critério D3) + `format:check --all`

## 4. Refit visual — séries de estruturas e torres (6 telas)

- [ ] 4.1 Refitar `structure-series-list/-form/-history` pela receita D3
- [ ] 4.2 Refitar `structure-series-detail` (card vigente `outlined` + tabela de tipos) e `tower-type-form` (FormArray dos pesos em grid com mat-form-field e botões adicionar/remover ponto) e `tower-type-history` (um card `outlined` por versão com sua tabela)
- [ ] 4.3 Suíte web verde sem asserção alterada + `format:check --all`

## 5. Feedback de operação

- [ ] 5.1 Adicionar `MatSnackBar` de confirmação pt-BR no sucesso do save dos 5 formulários (design D4), mantendo erros inline como estão
- [ ] 5.2 Escrever os testes do snackbar (sucesso → confirmação + navegação) sem tocar nos testes de erro existentes

## 6. QA e fechamento

- [ ] 6.1 Executar a skill `/executar-qa` para a change: cenários do spec `interface/casca-navegacao` (navegação/item ativo, responsivo com rolagem contida, tema claro E escuro com contraste AA, snackbar, erro de leitura inline) + smoke E2E das 14 telas refitadas nos dois esquemas e breakpoints; gerar `qa.md`
- [ ] 6.2 Rodar `npx nx run-many -t lint test build` e `npx nx format:check --all` limpos e confirmar o CI verde no push
