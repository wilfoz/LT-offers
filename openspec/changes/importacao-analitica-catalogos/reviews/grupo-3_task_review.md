# Review do Grupo 3 (tasks 3.1 a 3.4): Web, assistente Importação Analítica

**Revisor**: AI Code Reviewer
**Data**: 2026-09-30
**Change / Grupo**: importacao-analitica-catalogos / grupo 3
**Status**: Aprovado com observações

## Resumo

O grupo substitui o mockup `upload.component.*` pelo assistente `analytic-import` na rota `/upload`, que
continua a mesma. O fluxo tem seis etapas: arquivo, catálogo, aba/cabeçalho, mapeamento com vigência,
prévia e relatório. O estado fica em signals e as chamadas passam pelo `CatalogImportApi`
(inspect/preview/commit). O item de menu de sistema foi renomeado para "Importação Analítica", com o
ícone `upload_file`, e há um teste novo em `app.spec.ts`.

A entrega é sólida e aplicou de primeira as lições institucionais:

- callback de erro em todas as chamadas, com mensagem persistente (`role="alert"`) e snackbar;
- botões que refletem `busy()`, e um segundo clique não reenvia o commit;
- mensagens em pt-BR;
- campos, rótulos e obrigatoriedade vindos do registro da domain, sem lista paralela na web;
- vigência validada com `civilDateValidator`;
- extensão e tamanho validados no cliente com as constantes da domain;
- sem BOM, sem `::ng-deep`/`.mdc-*`/hex/`100vh`, e `prettier --check` limpo.

Há **um defeito funcional real** (major): o atributo `accept` do `<input type="file">` recebe a string de
exibição `".xlsx, .xlsm, .xls ou .csv"`. O último token (`.xls ou .csv`) é inválido, então o seletor
nativo esconde `.xls` e `.csv`. A correção é de uma linha. O segundo major é o tamanho da classe (cerca
de 430 linhas contra o limite de 300). Há também alguns minors de UX, acessibilidade e duplicação.

Verificação executada nesta review:

| Verificação | Resultado |
|---|---|
| `cd apps/web && npx vitest run` | 71 arquivos, **413/413 verdes** (27 no escopo: 18 do componente, 3 do service, 6 do app.spec) |
| `npx nx build web --skip-nx-cache` | Sucesso; chunk lazy `analytic-import-component` 26,27 kB (7,49 kB gzip); sem warnings |
| `npx eslint apps/web/src/app/upload app.ts app.routes.ts app.spec.ts` | 0 erros; 1 warning **pré-existente** (`UserRole` sem uso em `app.ts:14`, fora do diff) |
| `npx prettier --check` nos arquivos do grupo | Limpo |
| BOM (`head -c3 \| od`) nos 6 arquivos de `upload/` | Ausente em todos |
| Proibições do DESIGN.md na SCSS (`::ng-deep`, `.mdc-*`, hex, `100vh`) | Nenhuma ocorrência; só tokens `--mat-sys-*` |
| Referências órfãs ao `UploadComponent` removido | Nenhuma |

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| apps/web/src/app/upload/analytic-import.component.ts | ⚠️ Problemas | 1 major, 6 minors |
| apps/web/src/app/upload/analytic-import.component.html | ⚠️ Problemas | 1 major (accept), 4 minors |
| apps/web/src/app/upload/analytic-import.component.scss | ✅ Ok | 0 |
| apps/web/src/app/upload/analytic-import.component.spec.ts | ⚠️ Problemas | 1 minor (lacunas) |
| apps/web/src/app/upload/catalog-import-api.service.ts | ✅ Ok | 0 |
| apps/web/src/app/upload/catalog-import-api.service.spec.ts | ✅ Ok | 0 |
| apps/web/src/app/app.ts | ✅ Ok | 0 |
| apps/web/src/app/app.routes.ts | ✅ Ok | 0 |
| apps/web/src/app/app.spec.ts | ✅ Ok | 0 |
| apps/web/src/app/upload/upload.component.* (removidos) | ✅ Ok | 0 |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

**MAJ-1: o `accept` do seletor de arquivo recebe o texto de exibição, e `.xls`/`.csv` somem do seletor nativo**
`analytic-import.component.html:55` e `analytic-import.component.ts:70` e `:136`.

`acceptedExtensions = ACCEPTED`, que vale `".xlsx, .xlsm, .xls ou .csv"`, é a redação da mensagem.
Ligado a `[attr.accept]`, o navegador separa os tokens por vírgula: `.xlsx`, `.xlsm` e `.xls ou .csv`.
O terceiro token não corresponde a nenhuma extensão, então o filtro do diálogo nativo mostra só
`.xlsx`/`.xlsm`. O usuário que clica em "Selecionar arquivo" para subir um `.csv` ou `.xls` não o vê na
lista. No Windows, ele ainda pode trocar para "Todos os arquivos". No macOS/Safari não há essa saída. O
arrastar-e-soltar continua funcionando. Isso contraria o requisito "assistente para `.xlsx`, `.xlsm`,
`.xls`, `.csv`". Nenhum teste cobre o atributo, e o teste da linha 173 só confere o texto exibido.

Correção:

```ts
readonly acceptedExtensions = ACCEPTED; // texto para o usuário
readonly acceptAttribute = CATALOG_IMPORT_FILE_EXTENSIONS.join(',');
```

```html
<input ... [attr.accept]="acceptAttribute" />
```

Adicionar o teste de regressão:

```ts
expect(el.querySelector('#import-file')?.getAttribute('accept')).toBe(
  '.xlsx,.xlsm,.xls,.csv',
);
```

**MAJ-2: a classe `AnalyticImportComponent` tem cerca de 430 linhas, acima do limite de 300**
`analytic-import.component.ts:130-558`.

Nenhum método passa de 50 linhas, e as funções auxiliares de módulo (`columnLetter`, `normalizeHeader`,
`plural`, `apiMessage`) já estão fora da classe. Mesmo assim, a classe concentra seis etapas. Existe
precedente pior na web (`offer-detail.component.ts` tem cerca de 3.500 linhas), mas o padrão vale para
código novo. Sugestão de baixo risco, sem mudar comportamento:

1. levar os mapas de rótulo/badge, `columnLetter`, `normalizeHeader`, `plural`, `apiMessage` e o
   cálculo do relatório (`report`) para `analytic-import.helpers.ts`, com teste puro de `buildReport`;
2. ou extrair a etapa de mapeamento (`sourceOf`/`setSource`/`fixedValueOf`/`setFixedValue`/
   `enumOptions`/`suggestMapping`) para um componente filho `import-mapping-step` com `input()`/`output()`.

A opção 1 sozinha já deixa a classe perto de 300 linhas.

### 🟢 Problemas Minor

**MIN-1: aviso de opcionais cita campos de aço quando o tipo é fixado em OPGW, e vice-versa**
`analytic-import.component.ts:219-224`.

Ponto herdado do review do grupo 1, que não foi tratado. `unmappedOptionalFields` desconhece a
aplicabilidade por tipo. Com `type = OPGW` fixo, o aviso diz que os campos exclusivos de STEEL "ficarão
sem dados", o que é correto mas soa como problema. O inverso vale para STEEL. É ruído de UX, sem risco de
dado errado. Opções: filtrar os avisos pelo valor fixo de `type` com a lista de aplicabilidade da domain,
ou criar `appliesTo?` no registro. No mínimo, registrar no QA (task 4.x) como comportamento conhecido.

**MIN-2: duplo asterisco no rótulo da vigência**
`analytic-import.component.html:281`.

`<mat-label>Início de vigência das versões *</mat-label>` já traz o `*` manual. O `MatInput` detecta
`Validators.required` via `hasValidator` e o `mat-form-field` acrescenta o marcador próprio. O resultado é
"… versões * *". Remover o `*` do texto. Nenhum outro formulário do projeto põe `*` manual no `mat-label`.

**MIN-3: concordância no relatório: "1 ignorado (já cadastrados)"**
`analytic-import.component.ts:248`.

O sufixo fica sempre no plural, e o teste da linha 367 fixa a forma errada. Correção:
`plural(ignored, 'ignorado (já cadastrado)', 'ignorados (já cadastrados)')`, e ajustar a asserção.

**MIN-4: `normalizeHeader` reimplementa o `foldText` da domain, com números mágicos**
`analytic-import.component.ts:86-94`.

É o mesmo algoritmo de `foldText` (`import-registry.ts:433`), que na domain usa as constantes nomeadas
`COMBINING_MARKS_FIRST/LAST`. Na web aparecem `0x300`/`0x36f` literais. Exportar `foldText` da domain (ou
um `normalizeImportHeader`) e reusar, para que a sugestão automática e o casamento de enum/boolean do
backend usem a mesma regra.

**MIN-5: `suggestMapping` extrai o título fazendo `split(' · ')` no rótulo de exibição**
`analytic-import.component.ts:364-367`.

Um cabeçalho que contenha " · " fica truncado, e "(sem título)" vira um título normalizado. Ler direto
da linha de cabeçalho:

```ts
const row = this.currentSheet()?.rows[(this.headerRow() ?? 0) - 1] ?? [];
const headers = row.map((cell) => normalizeHeader(cell));
```

**MIN-6: "40 MB" escrito à mão em dois lugares**
`analytic-import.component.ts:73-74` e `analytic-import.component.html:46`.

O limite vem de `CATALOG_IMPORT_MAX_FILE_BYTES`, mas o texto não. Derivar
`const MAX_FILE_MB = CATALOG_IMPORT_MAX_FILE_BYTES / (1024 * 1024)` e usar na mensagem e na dica.

**MIN-7: `row.payload ?? {}` mascara uma inconsistência do contrato**
`analytic-import.component.ts:492`.

Uma linha `TO_IMPORT` sem payload seria enviada como `{}` e recusada no commit com uma mensagem genérica.
Filtrar (`.filter((row) => row.payload !== null)`) ou tipar o contrato para que `TO_IMPORT` implique
payload. É defensivo, sem impacto hoje.

**MIN-8: acessibilidade (pequenos ajustes)**

- `html:50-57`: o `<input type="file">` com `.visually-hidden` continua no tab order sem rótulo, o que
  cria uma parada de foco invisível antes do botão. Usar `tabindex="-1"` (o botão já é o controle
  acessível).
- `html:191`: `[id]="'label-' + field.key"` não é referenciado por nenhum `aria-labelledby`. É um id
  morto. Remover, ou ligar ao `mat-select`. O `mat-label` "Origem de …" já dá o nome acessível.
- Ao trocar de etapa, o foco fica no botão que deixou de existir, porque o `@switch` o destrói, e cai no
  `body`. Leitores de tela não anunciam a nova etapa. Mover o foco para o título da etapa ou para a lista
  de etapas (`#stepHeading` com `tabindex="-1"`, e `focus()` depois de `step.set`), ou anunciar via
  `LiveAnnouncer`.
- `html:253-255`: `$any($event.target).value` é um cast sem tipo no template. Preferir um
  `(input)="setFixedValue(field.key, input.value)"` com template ref `#input`.

**MIN-9: lacunas de teste (cobertura da task 3.4 atendida, com pontos sem asserção)**
`analytic-import.component.spec.ts`.

- O valor fixo só é exercitado por método (`setSource`/`setFixedValue`). Falta ver no DOM que o
  controle muda conforme `kind` (select de enum com rótulos pt-BR; Sim/Não para boolean; input para
  texto).
- Faltam: o snackbar de sucesso "Importação concluída", o snackbar na falha da prévia, o `accept` (ver
  MAJ-1), `onDrop`/`onFileSelected` (inclusive o reset de `input.value`) e `back()` (que limpa
  `serverError` e fica bloqueado no relatório).
- O fluxo completo pula a etapa 1→2 com `step.set(2)` em vez do botão "Avançar". Aceitável, mas o
  `[disabled]="!catalogKey()"` do botão fica sem cobertura.

## ✅ Destaques Positivos

- **Registro da domain como única fonte**: campos, rótulos, obrigatoriedade, `kind`, `enumLabels`,
  `missingRequiredMappings`/`unmappedOptionalFields`, extensões e limite de tamanho vêm de
  `@lt-offers/domain`. A web não mantém lista paralela, que era o risco "registro × DTO" do design.
- **Todas as lições institucionais aplicadas**: callbacks de erro em inspect/preview/commit, com
  mensagem persistente em `role="alert"` e snackbar. `apiMessage` junta as listas do ValidationPipe.
  O teste "erro do servidor na prévia junta as mensagens do DTO e mantém o mapeamento" prova que o estado
  sobrevive à falha. Há guarda contra duplo clique no commit (teste com `Subject` pendente), e o botão
  "Importar" fica desabilitado sem linhas a importar.
- **RNF-09 aparece na interface**: o aviso "ficarão sem dados (não informado, nunca zero)" e um valor
  fixo só com espaços não contam como associação.
- **Vigência como data civil**: o `civilDateValidator` recusa `2027-02-30` antes da API (teste dedicado),
  o que evita o rollover silencioso já visto no projeto.
- **Relatório honesto**: soma os ignorados/inválidos decididos na prévia com os que o commit degradou
  (P2002 concorrente, design Risks). Há um teste específico para o commit que ignora o que a prévia
  aprovou, e o relatório lista os itens não gravados com motivo.
- **Stepper próprio justificado**: `<ol>` com `aria-current="step"` e `@switch` por etapa, mais simples
  que um `mat-stepper` linear com formulários por etapa. O estado vive em signals `computed`
  (`columns`, `fixedValues`, `missingRequired`, `report`) e não há estado espelhado para sincronizar.
- **Autor da operação**: o commit envia `X-User` com o e-mail do usuário ativo (ASCII, seguro em
  header). A importação é a primeira tela que cumpre "registra o autor". Os demais catálogos ainda caem
  no fallback "sistema" (dívida D6, para a change de autenticação).
- **Tabelas acessíveis**: `caption` (visually-hidden) e `th scope="col"`/`scope="row"`, badges com
  texto e não só cor, `role="status"` no progresso e no resumo final.
- **Responsividade**: `min-width: 0` no contêiner, tabelas em `.table-scroll`, etapas e ações com
  `flex-wrap`, e o grid de mapeamento colapsa em uma coluna a ≤720px. A SCSS usa só tokens `--mat-sys-*`.
- **Teste de menu forte**: o `app.spec.ts` asserta a lista exata de itens de sistema (rótulo, ícone e
  href), e o componente asserta a ausência de "OCR".
- Mockup removido por inteiro, sem referências órfãs. O chunk lazy fica pequeno (7,49 kB gzip).

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ⚠️ Problemas (tamanho da classe; duplicação de normalização; "40 MB" literal) |
| Typescript/Node.js | ✅ Ok (sem `any` em TS; um `$any` no template, MIN-8) |
| Angular/NestJS/React | ✅ Ok (standalone, signals, `inject()`, lazy route, control flow novo) |
| REST/HTTP | ✅ Ok (multipart no inspect/preview, JSON no commit, `X-User`) |
| Testes | ⚠️ Problemas (cobertura boa; faltam `accept`, controles por `kind`, snackbars de sucesso) |
| Logging/Monitoramento | ✅ Ok (não aplicável no cliente; erros visíveis ao usuário) |

## Recomendações

1. **MAJ-1**: separar o `accept` (`CATALOG_IMPORT_FILE_EXTENSIONS.join(',')`) do texto de exibição e
   adicionar o teste do atributo. É obrigatório antes do QA 4.x, que deve subir um `.csv` pelo botão.
2. **MAJ-2**: extrair helpers e relatório para `analytic-import.helpers.ts` (ou a etapa de mapeamento
   para um componente filho) até a classe ficar em no máximo cerca de 300 linhas.
3. MIN-2 e MIN-3: remover o `*` manual do rótulo da vigência e corrigir a concordância do relatório
   (ajustando o teste).
4. MIN-4 e MIN-5: exportar `foldText` da domain e fazer a sugestão ler a linha de cabeçalho crua.
5. MIN-8: `tabindex="-1"` no input de arquivo, remover o id morto e fazer a gestão de foco na troca de
   etapa.
6. MIN-1: decidir o filtro dos avisos por tipo fixado (ou registrar como comportamento conhecido no QA).
7. MIN-6, MIN-7, MIN-9: constante de MB, filtro de payload nulo e testes complementares.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Não há críticos. O fluxo atende aos três requisitos do spec (formatos,
destinos planos, mapeamento com requerido/opcional/valor fixo/vigência, prévia classificada, relatório
com contagens e link ao catálogo) e às obrigações do design D5. Corrigir o MAJ-1 antes do QA, porque o
seletor nativo esconde `.csv`/`.xls` e afeta diretamente o cenário "formatos aceitos". O MAJ-2 e os
minors podem entrar no mesmo commit do grupo ou virar ajuste antes do fechamento da change.

## Resolução dos apontamentos (2026-09-30)

- **MAJ-1**: o `accept` agora usa `ACCEPT_ATTRIBUTE` (`.xlsx,.xlsm,.xls,.csv`), separado do texto de exibição, e há teste de regressão sobre o atributo.
- **MAJ-2**: a classe caiu para ~295 linhas. Os rótulos, as mensagens, `columnLetter`, `rowSummary`, `apiMessage` e `buildImportReport` foram para `analytic-import.helpers.ts`. O estado do mapeamento virou a classe `ImportMappingState` (`import-mapping.state.ts`).
- **MIN-1**: fica como comportamento conhecido, a registrar no QA. O aviso de opcionais cita os campos de aço mesmo com o tipo fixado em OPGW. O aviso é verdadeiro (ficarão sem dados), mas ruidoso. Filtrar exigiria metadado de aplicabilidade no registro, e a regra hoje vive só na entidade.
- **MIN-2**: saiu o `*` manual do rótulo da vigência.
- **MIN-3**: o singular virou "1 ignorado (já cadastrado)" e o teste foi corrigido.
- **MIN-4**: a domain exporta `foldImportText`, reusado pela sugestão de colunas.
- **MIN-5**: a sugestão lê a linha de cabeçalho direto (`headerCells`).
- **MIN-6**: o limite em MB deriva de `CATALOG_IMPORT_MAX_FILE_BYTES`, na mensagem e no texto da dropzone.
- **MIN-7**: `toImport` descarta linhas sem payload em vez de enviar `{}`.
- **MIN-8**: o input de arquivo tem `tabindex="-1"`/`aria-hidden`, o id `label-*` sem uso saiu, o foco vai para o título da etapa na troca (`afterRenderEffect`, fora do carregamento inicial) e o `$any` foi substituído por referência de template.
- **MIN-9**: há testes para o `accept`, `onFileSelected`, o controle de valor fixo por kind (enum/boolean/texto), `back()` e o snackbar de sucesso.
