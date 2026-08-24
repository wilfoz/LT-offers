# Proposta: design-system-swiss

## Why

O `apps/web` chegou ao 4º catálogo sem design system: HTML puro, estilos inline duplicados componente a componente (tabelas, forms e mensagens de erro reescritos 14 vezes) e nenhuma identidade visual. O documento **`openspec/DESIGN.md`** (Minimalism & Swiss Style sobre Angular Material 3) foi adotado como a identidade oficial do produto e é a fonte autoritativa de layout desta change: tema por tokens (`mat.theme()` + `--mat-sys-*`), casca com navegação lateral, grid, tipografia Inter e mapeamento componente a componente. Aplicar agora — com 14 telas de forma homogênea — custa menos do que após o 5º catálogo.

## What Changes

- **Fundação do design system (DESIGN.md como fonte):** dependências novas `@angular/material` + `@angular/cdk` (Material 3); tema Swiss em `apps/web/src/styles.scss` (paleta monocromática off-black, acento taupe, cantos retos via tokens `--mat-sys-corner-*`, sombras rasas, densidade -1 em tabelas/forms, `color-scheme: light dark`); fontes Inter/JetBrains Mono e Material Symbols Outlined no `index.html`. Proibições do DESIGN.md valem como regra de review: sem `::ng-deep`/`.mdc-*`, sem hex literal em componente, sem tema pré-construído.
- **Casca da aplicação:** `app.html` deixa de ser header+links e vira `mat-sidenav-container` + `mat-toolbar` + `mat-nav-list` com item ativo destacado; sidenav fixa ≥ 1024px e sobreposta (com botão de menu) abaixo, via `BreakpointObserver` do CDK; conteúdo em contêiner de até 1280px; tema claro/escuro segue a preferência do sistema.
- **Refit visual das 14 telas dos 4 catálogos** (decisão do usuário: todas nesta change) pelo mapeamento do DESIGN.md: listagens em `mat-table` densa, forms em `mat-form-field appearance="outline"` com `floatLabel="always"`, `<mat-error>`/`<mat-hint>` ("em branco = não informado"), cards `outlined`, badges de pendência/vigência, carregamento por `mat-progress-bar`, estados vazios com ícone + CTA, valores decimais/códigos em monospace alinhados à direita. **Sem mudança de comportamento observável das rotas e payloads** — rotas, validações, mensagens pt-BR e contratos intactos; asserções de teste preservadas (critério do refit que já funcionou na extração).
- **Feedback de operação (comportamento novo, único além do visual):** `MatSnackBar` de confirmação ao salvar item/versão em qualquer catálogo; erros de leitura continuam inline (regra do DESIGN.md, já praticada).
- **Fora do escopo** (decisões do usuário e desvios conscientes registrados): ordenação/paginação nas listagens (`matSort`/`mat-paginator` do mapeamento — dívida registrada); `matDatepicker` (mudaria o tipo do valor do form de string ISO para `Date`, quebrando o critério de refit — o campo de vigência segue `matInput type="date"`; evolução futura junto do sort); paleta off-black exata via `ng generate @angular/material:theme-color` (o `mat.$neutral-palette` cumpre a identidade até lá); toggle manual de tema (segue só a preferência do SO); `mat-tab-group` item × versões (estrutura de páginas atual mantida).

Fase do roadmap: **F1 (transversal — infraestrutura de UI dos catálogos M02)**. Requisitos cobertos: RNF-14 (interface pt-BR preservada), acessibilidade das telas de catálogo (contraste AA, foco, rótulos — práticas do §09/QA institucionalizadas pelo tema); nenhum RF novo.

## Capabilities

### New Capabilities

- `interface/casca-navegacao`: a casca da aplicação — navegação lateral com item ativo, responsividade da navegação e do conteúdo, tema claro/escuro pela preferência do sistema e feedback de operação (confirmação ao salvar, carregamento visível, erros de leitura inline).

### Modified Capabilities

Nenhuma — o refit das telas de catálogo é visual e preserva todos os cenários dos specs `catalogos/*` (mesmas rotas, validações, mensagens e regras); a confirmação ao salvar entra como requirement da capability nova, não como delta dos catálogos.

## Impact

- **Código:**
  - Dependências novas: `@angular/material` e `@angular/cdk` (únicas; fontes via `index.html`).
  - `apps/web/src/styles.scss` (tema completo), `apps/web/src/index.html` (fontes/ícones), `app.ts/app.html/app.scss` (casca), `app.config.ts` se necessário (animações já são padrão no Angular 22).
  - Refit dos 14 componentes de catálogo em `apps/web/src/app/catalogs/` (templates e estilos; lógica e serviços intactos) + snackbar nos 5 forms.
- **API observável:** nenhuma mudança; nenhum contrato da domain é tocado.
- **Testes:** asserções existentes preservadas (texto, payloads, validações); testes novos apenas para a casca (navegação/responsivo) e para o snackbar.
- **Nomenclatura:** nenhum termo de domínio novo (componentes de UI não entram no mapa do README).
- **Premissas registradas:** (1) DESIGN.md é a autoridade de layout; conflitos entre ele e conveniência de implementação se resolvem a favor do documento, exceto os desvios listados em "Fora do escopo"; (2) contraste AA verificado no QA com o tema aplicado; (3) `density: -1` global do front matter interpretado conforme o corpo do documento (densidade padrão no tema, `-1` só em tabelas/forms via classe `.dense`).
