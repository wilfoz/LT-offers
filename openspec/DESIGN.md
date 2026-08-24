---
version: "alpha"
name: "Minimalism & Swiss Style — Angular Material"
description: "Design minimalista com grid, tipografia clara e espaço em branco, implementado sobre Angular Material (Material 3). Alvo: app enterprise de orçamento de LT (apps/web)."
stack:
  framework: "Angular 22 (standalone, signals)"
  ui: "@angular/material + @angular/cdk (Material 3, mat.theme())"
  styles: "SCSS — apps/web/src/styles.scss"
colors:
  primary: "#1A1A1A"    # off-black (nunca #000000 puro)
  secondary: "#808080"  # cinza — texto secundário, bordas
  tertiary: "#B38B6D"   # taupe — acento discreto (badges, indicadores)
  neutral: "#F5F1E8"    # bege — superfícies de apoio (sidenav, chips)
  surface: "#FFFFFF"
  error: "#B3261E"
typography:
  plain: "Inter, system-ui, sans-serif"
  brand: "Inter, system-ui, sans-serif"
  mono: "JetBrains Mono, ui-monospace, monospace"
  h1: { role: headline-large, fontSize: 2.25rem, fontWeight: 700 }
  h2: { role: headline-small, fontSize: 1.5rem, fontWeight: 600 }
  body-md: { role: body-large, fontSize: 1rem, fontWeight: 400, lineHeight: 1.6 }
  label-caps: { role: label-medium, fontSize: 0.75rem, fontWeight: 500, letterSpacing: 0.04em }
rounded:
  none: 0px      # botões, cards, inputs (identidade Swiss)
  sm: 2px        # chips, badges
  md: 4px        # menus, tooltips, snackbar
  lg: 8px        # diálogos
spacing:
  unit: 0.5rem   # 8px — base do ritmo
  sm: 1rem
  md: 2rem
  lg: 4rem
density: -1      # escala de densidade do Material (0 = padrão; -1 = compacto)
components:
  button-primary:
    material: mat-flat-button
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.none}"
---

## Visão geral

Design minimalista, estruturado em grid, com tipografia sem serifa e muito espaço em branco — o Swiss Style (1950s) aplicado a um app enterprise de formulários, tabelas e catálogos versionados. A biblioteca de componentes é o **Angular Material (Material 3)**: o estilo é obtido **configurando o tema** (`mat.theme()` + `mat.*-overrides()`), nunca reescrevendo CSS de componente por seletor interno (`.mdc-*`, `.mat-mdc-*`), que é API privada e quebra a cada versão.

- Densidade: 3/10 — arejada nas páginas, compacta (`density: -1`) em tabelas e formulários
- Variação: 2/10 — estruturada
- Movimento: 4/10 — sutil (as animações padrão do Material já atendem)

- **Estilo:** limpo, geométrico, funcional, baseado em grid
- **Claro/Escuro:** ✓ / ✓ — via `color-scheme: light dark` no `html`

## Instalação (uma vez)

```bash
npx ng add @angular/material   # ou: npm i @angular/material @angular/cdk
```

Em `apps/web/project.json`, a fonte e os ícones entram por `styles`/`index.html`; o tema entra em `apps/web/src/styles.scss`. Não usar tema pré-construído (`prebuilt-themes/*.css`) — ele não permite os overrides desta identidade.

## Tema (`apps/web/src/styles.scss`)

```scss
@use '@angular/material' as mat;

html {
  color-scheme: light dark;

  @include mat.theme((
    color: (
      primary: mat.$neutral-palette,   // off-black/cinzas: identidade monocromática
      tertiary: mat.$orange-palette,   // taupe/bege como acento discreto
      theme-type: color-scheme,
    ),
    typography: (
      plain-family: 'Inter, system-ui, sans-serif',
      brand-family: 'Inter, system-ui, sans-serif',
      bold-weight: 700,
      medium-weight: 500,
      regular-weight: 400,
    ),
    density: 0,
  ));

  // Forma: cantos retos como padrão global (Swiss)
  --mat-sys-corner-none: 0px;
  --mat-sys-corner-extra-small: 2px;
  --mat-sys-corner-small: 4px;
  --mat-sys-corner-medium: 4px;
  --mat-sys-corner-large: 8px;
  --mat-sys-corner-full: 0px; // botões deixam de ser "pill"

  // Elevação: sombras rasas, nunca difusas
  --mat-sys-level1: 0 1px 2px rgba(0, 0, 0, 0.08);
  --mat-sys-level2: 0 2px 12px rgba(0, 0, 0, 0.06);

  background: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
  font: var(--mat-sys-body-large);
}

// Tabelas e formulários densos
.dense {
  @include mat.form-field-density(-1);
  @include mat.table-density(-1);
}
```

Regras:

- **Cores só via tokens de sistema** (`var(--mat-sys-primary)`, `--mat-sys-on-surface`, `--mat-sys-outline`, `--mat-sys-error` …). Hex literal nos componentes é proibido; a paleta do front matter existe para calibrar as `mat.$*-palette` escolhidas, não para uso direto.
- Ajuste de componente específico com **`mat.<componente>-overrides()`** (ex.: `mat.button-overrides((container-shape: 0px))`), nunca com `::ng-deep` nem seletores `.mdc-*`.
- Uma paleta customizada (off-black exato) pode ser gerada com `ng generate @angular/material:theme-color` e passada em `primary:`; até lá, `mat.$neutral-palette` cumpre a identidade monocromática.

## Cores

| Papel Material          | Token                        | Uso                                             |
| ----------------------- | ---------------------------- | ----------------------------------------------- |
| primary / on-primary    | `--mat-sys-primary`          | Botão principal, item ativo da navegação        |
| surface / on-surface    | `--mat-sys-surface`          | Fundo de página, cards, tabela                  |
| surface-container       | `--mat-sys-surface-container`| Sidenav, toolbar, cabeçalho de tabela           |
| outline / outline-variant | `--mat-sys-outline`        | Bordas de card, input, divisores                |
| on-surface-variant      | `--mat-sys-on-surface-variant` | Texto secundário, labels, metadados           |
| tertiary                | `--mat-sys-tertiary`         | Acento decorativo: badges de vigência, chips    |
| error                   | `--mat-sys-error`            | Validação, mensagens de falha                   |

- Sem preto puro: o `primary` é off-black (`#1A1A1A`); o Material deriva os tons.
- Contraste alvo **WCAG AA 4.5:1** em texto (AAA 7:1 no corpo de leitura). O par do front matter original (texto cinza `#808080` sobre preto) reprova — botão primário usa `on-primary` (branco).
- Sem acentos saturados: o `tertiary` (taupe) é o único acento cromático.

## Tipografia

Uma família só (Inter), pesos 400/500/700, escala pelos papéis do Material:

| Papel do design        | Papel Material     | Token                            |
| ---------------------- | ------------------ | -------------------------------- |
| Título de página (h1)  | headline-large     | `var(--mat-sys-headline-large)`  |
| Título de seção (h2)   | headline-small     | `var(--mat-sys-headline-small)`  |
| Corpo                  | body-large         | `var(--mat-sys-body-large)`      |
| Auxiliar / metadado    | body-medium        | `var(--mat-sys-body-medium)`     |
| Rótulos em caixa alta  | label-medium       | `var(--mat-sys-label-medium)`    |
| Valores técnicos       | monospace (custom) | JetBrains Mono — `.mono`         |

- Corpo 16px / 1.6, máx. 72ch por linha em texto corrido.
- `label-caps`: `text-transform: uppercase; letter-spacing: 0.04em`.
- Valores decimais (seções, cargas, alturas) e códigos de catálogo em monospace, alinhados à direita em tabelas.

## Layout

- **Casca:** `mat-sidenav-container` com `mat-sidenav` (`mode="side"`, aberto ≥ 1024px; `mode="over"` abaixo) + `mat-toolbar` fina no topo. Fundo `surface-container`, sem sombra.
- **Conteúdo:** CSS Grid, contêiner máx. 1280px centralizado, padding lateral 1.5rem. Formulários em grid de 12 colunas (`repeat(12, 1fr)`, gap 1rem); campos ocupam 3/4/6/12 colunas conforme o tipo.
- **Ritmo:** unidade 8px. Seções internas separadas por 2rem; páginas por 4rem.
- **Mobile:** tudo colapsa para 1 coluna abaixo de 768px (`BreakpointObserver` do CDK, `Breakpoints.Handset`). Tabelas rolam horizontalmente dentro do próprio contêiner — o `body` nunca rola na horizontal.
- **z-index:** não gerenciar manualmente — o **CDK Overlay** cuida de menus, selects, diálogos, tooltips e snackbars. Único valor próprio: toolbar sticky (`position: sticky; z-index: 100`).

## Elevação e movimento

- Sombras apenas `level1`/`level2` (definidas acima). Cards com **borda 1px `outline-variant`** em vez de sombra por padrão (`appearance="outlined"`).
- Movimento: as transições nativas do Material (ripple, abertura de overlay, expansão de painel) já são sutis e respeitam `prefers-reduced-motion`. Não adicionar animações de entrada em listas nem cascatas — só `transform`/`opacity` se houver alguma customização.
- Ripple mantido nos botões (feedback tátil); pode ser desligado em tabelas densas (`matRippleDisabled`).

## Forma

Raio base **0px** (Swiss). Tokens `--mat-sys-corner-*` sobrescritos no tema: retos em botões, cards e inputs; 2px em chips; 4px em menus/tooltips/snackbar; 8px em diálogos.

## Mapeamento de componentes

| Elemento do design      | Angular Material                                                                                   | Configuração                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Botão primário          | `<button matButton="filled">`                                                                      | `container-shape: 0px`, peso 600, sem sombra em repouso; hover = `state-layer` padrão          |
| Botão secundário/ghost  | `<button matButton="outlined">` / `<button matButton>` (text)                                      | Borda 1px `outline`                                                                            |
| Ação destrutiva         | `matButton="outlined"` com `color`/classe `error`                                                  | Nunca `filled` vermelho                                                                        |
| Card                    | `<mat-card appearance="outlined">`                                                                 | Cantos 0px, borda 1px, sem sombra                                                              |
| Inputs                  | `<mat-form-field appearance="outline">`                                                            | `floatLabel="always"` (rótulo sempre acima — sem *floating label*); `subscriptSizing="dynamic"`; erro em `<mat-error>`; dica em `<mat-hint>` (ex.: "em branco = não informado") |
| Select / autocomplete   | `mat-select`, `matAutocomplete`                                                                    | Painel com raio 4px via token                                                                  |
| Data                    | `matDatepicker` + `MatDateFnsModule`/`provideNativeDateAdapter` com locale `pt-BR`               | Formato `dd/MM/yyyy`; valor convertido para data civil ISO na borda (ver `civil-date`)         |
| Tabela                  | `mat-table` + `matSort` + `mat-paginator`                                                          | `.dense`; cabeçalho `surface-container`, linhas divididas por `outline-variant`, sem zebra     |
| Navegação               | `mat-sidenav` + `mat-nav-list` (`activated` no item da rota)                                       | Item ativo: barra de 2px `primary` à esquerda, peso 500                                        |
| Abas (item × versões)   | `mat-tab-group`                                                                                    | Indicador `primary`, sem fundo                                                                 |
| Badge de tipo/vigência  | `mat-chip` (`disabled` para leitura) ou `<span class="badge">`                                     | Raio 2px, `tertiary-container`; **não** usar `role="status"` em badge estático                 |
| Diálogo de confirmação  | `MatDialog`                                                                                        | Raio 8px, largura máx. 480px, ações à direita                                                  |
| Feedback de operação    | `MatSnackBar`                                                                                      | 4s, ação "Desfazer"/"Fechar"; erros de leitura ficam **inline** na página, não só no snackbar  |
| Carregamento            | `mat-progress-bar mode="indeterminate"` no topo do conteúdo                                        | Sem spinners circulares centralizados                                                          |
| Estado vazio            | Composição própria: `mat-icon` + texto + `matButton="filled"`                                      | Ícones via `mat-icon` (Material Symbols Outlined), nunca emoji                                 |
| Tooltip                 | `matTooltip`                                                                                       | Só para ícones sem rótulo visível                                                              |

Ícones: `MatIconModule` com **Material Symbols Outlined** (`<link>` no `index.html` ou fonte local). Um único conjunto de ícones em todo o app.

## Formulários (RNF-09, D3)

- Todo campo de negócio anulável: em branco → `null` (helper `orNull`/`intOrNull`), com `<mat-hint>` avisando o comportamento.
- Decimais como texto: `matInput type="text" inputmode="decimal"` (nunca `type="number"`, que perde precisão e aceita `e`).
- Erros: `<mat-error>` abaixo do campo, mensagem em pt-BR; `markAllAsTouched()` no submit. Campos condicionais (fieldset por tipo) devem ser **resetados** ao trocar o tipo para não travar o form com erro invisível.
- Botão salvar: `[disabled]="saving() || form.disabled"`.
- Prefill de edição: `form.disable()` enquanto carrega; falha na leitura bloqueia a edição com erro inline (nunca grava versão vazia).

## Acessibilidade

- Material entrega ARIA, foco e teclado nos componentes; preservar: não remover `outline` de foco (o Material usa `--mat-sys-primary` no anel).
- Contraste AA mínimo em todo texto; AAA no corpo.
- `mat-form-field` sempre com `<mat-label>`; ícones-botão com `aria-label`.
- Regiões `role="status"`/`aria-live` só para conteúdo que de fato muda (snackbar, contadores de resultado).

## Fazer / Não fazer

**Não fazer**
- Não estilizar por `.mdc-*`, `.mat-mdc-*` ou `::ng-deep` — usar `mat.*-overrides()` e tokens `--mat-sys-*`.
- Não usar tema pré-construído nem `mat.define-*` da API M2 legada.
- Não usar `#000000` puro; não usar hex literal em componentes.
- Não usar emoji na UI; não misturar bibliotecas de ícones.
- Não usar spinner circular como carregamento de página.
- Não usar `h-screen`/`100vh` — usar `min-height: 100dvh`.
- Não animar propriedades de layout; não adicionar cascatas de entrada.
- Não usar clichês de copy ("Eleve", "Sem esforço", "Next-Gen").

**Fazer**
- Grid de 12 colunas em formulários; uma coluna abaixo de 768px.
- Hierarquia tipográfica pelos papéis do Material (headline/body/label).
- Cantos retos, bordas 1px, sombras rasas.
- Contraste verificado; teclado e leitor de tela testados nos fluxos de catálogo.
- Densidade `-1` em tabelas e formulários; padrão nas demais áreas.

## Caso de uso

SaaS B2B, apps enterprise, ferramentas profissionais — aqui, o app de orçamento de linhas de transmissão (`apps/web`): catálogos versionados (cabos, séries/torres), formulários com decimais e datas de vigência, tabelas densas.
