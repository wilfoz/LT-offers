# Review dos Grupos 1 a 5 — design-system-swiss

**Revisor**: AI Code Reviewer
**Data**: 2026-08-24
**Change / Grupo**: design-system-swiss / grupos 1–5 (fundação do tema, casca, refit das 15 telas, snackbar)
**Commits**: `6f5553d` (tema), `1af87cd` (casca), `b6d1bf3` (refit cabos), `9f35d0f` (refit séries/torres), `db0af6e` (snackbar) — range `2f4e2b6..db0af6e`
**Status**: Aprovado com observações

## Resumo

A change aplica o design system oficial (`openspec/DESIGN.md`, Swiss Style sobre Angular Material 3) ao `apps/web`: tema por tokens em `styles.scss` com paleta off-black/taupe gerada pelo schematic `theme-color`, casca `mat-toolbar` sticky + `mat-sidenav` responsiva por `BreakpointObserver`, refit das 15 telas dos 4 catálogos (mat-table densa, mat-form-field outline, cards outlined, badges, estados vazios) e `MatSnackBar` de confirmação nos 5 forms — o único comportamento novo.

Entrega de altíssima qualidade. O critério central do refit foi cumprido à risca: **nenhuma asserção pré-existente foi alterada** — o diff dos specs mostra exatamente as adições permitidas (5 testes de casca substituindo o `app.spec.ts` de 1 teste, e 5 describes de snackbar com apenas o import de `MatSnackBar` nos 5 specs de form). As proibições do DESIGN.md foram varridas mecanicamente e estão todas atendidas. Todas as lições institucionais (erros inline `role="alert"`, prefill bloqueante, `[disabled]="saving() || form.disabled"`, `enable/disable({ emitEvent: false })`, reset de campos condicionais no `save()`, `caption`/`th scope`, BOM, `format:check --all`) vieram preservadas ou aplicadas de primeira. Zero críticos; 1 major (de repositório, não de código); 4 minors.

## Verificações executadas

| Verificação | Resultado |
|---|---|
| `npx nx run-many -t test lint build -p web` | ✅ 92/92 testes (16 arquivos), lint e build verdes |
| `npx nx format:check --all` (gate completo, o mesmo do CI) | ✅ Limpo |
| BOM UTF-8 (`head -c3 \| od`) em todos os arquivos novos/editados do web | ✅ Ausente |
| Proibições DESIGN.md: `::ng-deep`, `.mdc-*`, `.mat-mdc-*`, `100vh` | ✅ Zero ocorrências (só menções em comentários) |
| Hex literal em componentes (`apps/web/src/app/**`) | ✅ Zero — só tokens `var(--mat-sys-*)`; hex apenas em `_theme-colors.scss` (gerado) e rgba() das sombras do tema |
| `role="status"` em badge estático / emoji na UI | ✅ Zero ocorrências |
| Asserções pré-existentes intactas | ✅ Diff dos specs contém só: import `MatSnackBar` + describe novo no fim dos 5 form specs; `app.spec.ts` substituído pelos 5 testes da casca |
| Textos pt-BR das 15 telas | ✅ Todo texto removido no diff reaparece idêntico no componente refitado (verificação automatizada por extração de textos) |
| Padrões institucionais (`role="alert"`, `caption`, `scope="col"`, `[disabled]="saving() \|\| form.disabled"`) | ✅ Presentes em 100% dos componentes aplicáveis |
| Staging por caminho (sem `git add -A`) | ✅ Diffstat do range contém apenas os arquivos esperados; nada de `.claude/` |

Contagem de testes bate com o esperado: 83 pré-existentes − 1 (`app.spec` antigo) + 5 (casca) + 5 (snackbar) = 92.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `apps/web/src/styles.scss` | ✅ Ok | 0 |
| `apps/web/src/_theme-colors.scss` (gerado pelo schematic) | ✅ Ok | 0 |
| `apps/web/src/index.html` (fontes Inter/JetBrains Mono + Material Symbols) | ✅ Ok | 0 |
| `apps/web/src/app/app.ts` / `app.html` / `app.scss` | ✅ Ok | 0 |
| `apps/web/src/app/app.spec.ts` (5 testes da casca) | ✅ Ok | 0 |
| `catalogs/conductor-cable-{list,form,history}.component.ts` | ✅ Ok | 0 |
| `catalogs/ground-wire-{list,form,history}.component.ts` | ✅ Ok | 0 |
| `catalogs/guy-wire-{list,form,history}.component.ts` | ✅ Ok | 0 |
| `catalogs/structure-series-{list,form,history,detail}.component.ts` | ✅ Ok | 0 |
| `catalogs/tower-type-{form,history}.component.ts` | ✅ Ok | 0 |
| 5 histories (transversal) — indicador de carregamento | ⚠️ Problemas | 1 (Minor M2) |
| 5 form specs (adições de snackbar) | ⚠️ Problemas | 1 (Minor M3) |
| `package.json` | ⚠️ Problemas | 1 (Minor M4) |
| `openspec/changes/design-system-swiss/design.md` | ⚠️ Problemas | 1 (Minor M1) |
| `openspec/DESIGN.md` | ❌ Problema de versionamento | 1 (Major) |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

1. **`openspec/DESIGN.md` — a autoridade de layout da change — está fora do controle de versão.** `git status` mostra o arquivo como untracked; `git log --all` confirma que nunca foi commitado e `git check-ignore` confirma que não está ignorado. O `proposal.md`, o `design.md`, o spec `interface/casca-navegacao` e comentários em `styles.scss`/`app.scss` (todos commitados) referenciam um documento que não existe no repositório: o CI, outros clones e o arquivamento da change não o enxergam, e a regra "as proibições do DESIGN.md valem como critério de review" fica sem fonte auditável na história do git.
   **Correção sugerida:** commitar `openspec/DESIGN.md` no grupo 6 (fechamento), com staging explícito por caminho (`git add openspec/DESIGN.md` — nunca `git add -A`, regra do incidente de 24/08).

### 🟢 Problemas Minor

1. **`design.md` incoerente com o desvio registrado no grupo 1** (`openspec/changes/design-system-swiss/design.md`, D1 e Non-Goals). O `proposal.md` foi atualizado corretamente ("A paleta off-black/taupe exata é gerada pelo schematic `theme-color` já nesta change (o fallback `mat.$neutral-palette` citado no DESIGN.md não existe na v22)") e o código implementa isso. Mas o `design.md` ainda diz o contrário em dois pontos: D1 manda usar "`mat.theme()` com `mat.$neutral-palette` (primary) + `mat.$orange-palette` (tertiary)" e os Non-Goals ainda listam "paleta off-black gerada" como fora de escopo. O registro do desvio está correto no proposal, mas os artefatos da change se contradizem.
   **Correção sugerida:** ajustar D1 e remover "paleta off-black gerada" dos Non-Goals (via `/opsx:update` para manter os artefatos coerentes). Opcionalmente atualizar o bloco de tema do próprio DESIGN.md quando ele for commitado — o documento já previa o schematic como evolução ("até lá, `mat.$neutral-palette` cumpre").

2. **Os 5 componentes de histórico não ganharam `mat-progress-bar`** — mostram apenas o texto "Carregando…" (ex.: `conductor-cable-history.component.ts:95`), enquanto as 4 listagens e o detalhe da série exibem `mat-progress-bar mode="indeterminate"` + texto. O requirement "Indicar carregamento e falha de leitura" (SHALL exibir um indicador de progresso) é atendido no limite pelo texto, mas o mapeamento do DESIGN.md (Carregamento → progress bar no topo do conteúdo) e a homogeneidade — objetivo central da change — pedem o mesmo tratamento nas 5 telas de histórico.
   **Correção sugerida:** adicionar a barra nas 5 histories antes do QA (adição visual, sem tocar em asserções — o texto permanece, como nas listagens).

3. **Testes do snackbar não assertam a navegação.** A task 5.2 e o design D4 previam "sucesso → confirmação + navegação"; os 5 testes novos assertam `snackMock.open` + chamada da API, mas não `router.navigate` (ex.: `conductor-cable-form.component.spec.ts`, describe "confirmação ao salvar"). A navegação pós-save nunca foi assertada em nenhum teste da suíte (lacuna pré-existente, não introduzida aqui) — mas esta era a oportunidade natural de cobri-la, e o cenário do spec ("o sistema navega para a listagem E exibe uma confirmação") pede as duas metades.
   **Correção sugerida:** nos 5 testes, espiar o `Router` (`vi.spyOn(TestBed.inject(Router), 'navigate')`) e assertar o destino.

4. **Pin de versão inconsistente no `package.json`:** `@angular/material` e `@angular/cdk` entraram com caret (`^22.1.3`) enquanto todas as demais dependências Angular são exatas (`22.0.6`). Um `npm install` futuro pode puxar minors novas do Material sem mudança consciente — justamente a biblioteca cuja sintaxe de tema a change reconhece como sensível a minor (risco 2 do design).
   **Correção sugerida:** pinar `22.1.3` exato, alinhado à convenção do arquivo.

## ✅ Destaques Positivos

- **Critério do refit cumprido com perfeição**: 3.182 linhas adicionadas em 15 componentes sem alterar uma única asserção pré-existente — o diff dos 6 specs tocados contém exatamente o permitido. A verificação automatizada de textos confirmou que todo texto pt-BR removido reaparece idêntico.
- **Proibições do DESIGN.md 100% limpas de primeira**: zero `::ng-deep`/`.mdc-*`/hex em componente/emoji/`100vh`/`role="status"` em badge — as cores locais antigas (`#b91c1c`, `#ddd`, `#b45309`) saíram todas, substituídas por tokens (`--mat-sys-error`, `--mat-sys-outline-variant`, badges `tertiary-container`), exatamente como o D5 pedia — é isso que garante o tema escuro sem hex pontual.
- **Todas as lições institucionais aplicadas sem reincidência**: `format:check --all` completo limpo (o gate que já reincidiu 3× em changes passadas), BOM ausente (armadilha do PowerShell), `enable/disable({ emitEvent: false })` no prefill (armadilha do Angular confirmada no grupo-4 de ground-wires), `clearInactiveTypeFields()` no início do `save()` com comentário citando a review de origem (`ground-wire-form.component.ts:443-446`), guarda de id malformado, staging explícito sem `git add -A`.
- **Casca exemplar** (`app.ts`/`app.html`): signal `wide` via `toSignal` + `BreakpointObserver`, menu `over` que fecha após navegar, `aria-label` no botão de menu, item ativo via `routerLinkActive` com a barra de 2px `primary` do DESIGN.md, único z-index manual (toolbar sticky 100), `min-height: 100dvh`. Os 5 testes cobrem os 4 cenários de navegação/responsivo do spec com o observer mockado.
- **Acessibilidade acima do baseline**: `caption` e `th scope="col"` preservados dentro de `mat-table` (raro em refits para Material), `aria-hidden="true"` nos ícones decorativos, `aria-label="Carregando"` nas progress bars, `role="search"` no form de busca, legend/fieldset no FormArray de pesos.
- **Tema fiel ao documento**: `styles.scss` reproduz o bloco do DESIGN.md (tokens de canto retos, sombras rasas, `color-scheme: light dark`, densidade 0 global + `.dense` −1 conforme a premissa 3 do proposal) e adiciona utilitários enxutos (`.mono`, `.form-grid`/`.col-*` com colapso < 768px, `.badge`, `.empty-state`, `.table-scroll`) — nenhum design token paralelo fora do Material.
- **Snackbar minimalista e correto (D4)**: `open()` antes do `navigate` no `next` dos 5 forms, mensagens pt-BR por catálogo, erros seguem inline; specs mockam o `MatSnackBar` por `useValue`, mantendo os testes de erro intactos.

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ✅ Ok |
| TypeScript/Node.js | ✅ Ok |
| Angular (standalone + signals + control flow) | ✅ Ok |
| DESIGN.md (Fazer / Não fazer) | ✅ Ok |
| REST/HTTP (contratos intocados) | ✅ Ok |
| Testes | ⚠️ Minor M3 (navegação não assertada no snackbar) |
| Acessibilidade | ✅ Ok (contraste AA fica para o QA do grupo 6, como planejado) |

## Recomendações

1. **(Major)** Commitar `openspec/DESIGN.md` no grupo 6, com staging explícito por caminho.
2. **(Minor M1)** Atualizar `design.md` (D1 + Non-Goals) para refletir a paleta gerada pelo schematic, mantendo os artefatos coerentes com o proposal.
3. **(Minor M2)** Adicionar `mat-progress-bar` às 5 telas de histórico antes do QA (adição visual, asserções intactas).
4. **(Minor M3)** Assertar `router.navigate` nos 5 testes de snackbar, cobrindo a segunda metade do cenário "Confirmação após salvar".
5. **(Minor M4)** Pinar `@angular/material`/`@angular/cdk` em `22.1.3` exato.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero problemas críticos e nenhum problema de código de severidade major — o único major é de versionamento do repositório (DESIGN.md untracked), com correção trivial no fechamento. Suíte 92/92, lint, build e `format:check --all` verdes; comportamento observável preservado exceto o snackbar planejado. Os grupos 1–5 estão prontos; recomenda-se resolver o major e os minors M1–M3 junto do grupo 6 (QA e fechamento) antes do push/arquivamento.
