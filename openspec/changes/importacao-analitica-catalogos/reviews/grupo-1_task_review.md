# Review da Task 1 (1.1, 1.2, 1.3) — Domain: registro de importação por catálogo

**Revisor**: AI Code Reviewer
**Data**: 2026-09-29
**Change / Grupo**: importacao-analitica-catalogos / grupo 1
**Status**: Aprovado com observações

## Resumo

O grupo entrega a fundação declarativa da Importação Analítica (design D1): o registro
`CATALOG_IMPORT_REGISTRY` com os 8 catálogos planos, os helpers puros de normalização e validação de
célula (`normalizeDecimalCell`, `validateImportCell`, `missingRequiredMappings`,
`unmappedOptionalFields`, `naturalKeyOf`), os contratos HTTP de inspect/preview/commit, o mapa
catálogo → DTO de criação na API (`CATALOG_IMPORT_DTOS` + `validateImportPayload`) e o teste de
paridade registro × DTO lendo os metadados do class-validator (Risco 4 do design). O README ganhou os
termos novos do mapa canônico.

Conferi campo a campo o registro contra os 8 DTOs de criação e contra o `schema.prisma`: conjunto de
campos, obrigatoriedade, `maxLength`, `min` dos inteiros e escalas decimais batem 100% (as escalas são
exatamente as das colunas `@db.Decimal`). Testes, lint, tipos, formatação e BOM estão limpos nos
arquivos do grupo. Não há problemas críticos nem major; os minors abaixo são de legibilidade,
duplicação de rótulos e pontos que o grupo 2 precisa tratar quando consumir estes helpers.

**Verificação executada**

| Comando | Resultado |
|---|---|
| `npx nx test domain --skip-nx-cache` | 16 suítes, 198 testes, todos verdes |
| `npx nx test api --skip-nx-cache -- --testPathPatterns=import-registry-parity` | 1 suíte, 24 testes (3 × 8 catálogos), verdes |
| `npx nx run-many -t lint typecheck -p domain api --skip-nx-cache` | 0 erros (nenhum aviso nos arquivos do grupo; os 277 avisos são pré-existentes). Os projetos não têm alvo `typecheck`; rodei `tsc --noEmit` em `libs/domain/tsconfig.lib.json` e `apps/api/tsconfig.app.json`: limpo |
| `npx nx format:check --all` | Reprova `AGENTS.md`/`CLAUDE.md` (pré-existentes, fora do escopo) **e 3 arquivos do grupo 2 em andamento** (`catalog-import.usecases.ts`, `catalog-import.ports.ts`, `xlsx-spreadsheet.reader.ts`). Os arquivos do grupo 1, os artefatos da change e o README passam no `prettier --check` |
| BOM (`head -c3 \| od`) | Ausente nos 6 arquivos do grupo; sem CRLF no fonte novo |

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `README.md` (8 linhas no mapa canônico) | ✅ Ok | 0 |
| `libs/domain/src/lib/catalogs/import-registry.ts` | ⚠️ Problemas | 6 minors |
| `libs/domain/src/lib/catalogs/import-registry.spec.ts` | ⚠️ Problemas | 1 minor |
| `libs/domain/src/index.ts` | ✅ Ok | 0 |
| `apps/api/src/contexts/catalogs/infrastructure/import/catalog-import-dtos.ts` | ⚠️ Problemas | 1 minor |
| `apps/api/src/contexts/catalogs/infrastructure/import/import-registry-parity.spec.ts` | ⚠️ Problemas | 1 minor |
| `design.md` / `proposal.md` / `spec.md` / `tasks.md` (`.xlsm`) | ✅ Ok | 0 |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

**MIN-1. `validateImportPayload` valida com opções diferentes das do cadastro manual**
`apps/api/src/contexts/catalogs/infrastructure/import/catalog-import-dtos.ts:43-44`

O comentário promete "o mesmo DTO do cadastro manual", mas o cadastro passa pelo
`ValidationPipe({ whitelist: true })` global (`apps/api/src/main.ts:15`), e aqui o `validate(instance)`
roda sem `whitelist`. Uma chave desconhecida no payload continua na instância. Hoje não há consumidor,
mas o payload do `commit` vem do cliente (design D2) e não é confiável. Corrigir antes de ligar o
grupo 2:

```ts
const instance = plainToInstance(CATALOG_IMPORT_DTOS[catalogKey], payload);
return collectMessages(
  await validate(instance, { whitelist: true, forbidNonWhitelisted: true }),
);
```

Com `forbidNonWhitelisted` a linha com campo estranho vira inválida com motivo, sem sumir em silêncio.
A mensagem padrão desse erro vem em inglês, então é preciso tratá-la na borda (RNF-14). Outra opção é
montar o payload do commit só com as chaves do registro.

**MIN-2. Fábrica `text()` com 4 parâmetros e flag booleana**
`libs/domain/src/lib/catalogs/import-registry.ts:191-196`

`text(key, label, maxLength, required = false)` fere dois limites do projeto: no máximo 3 parâmetros e
nenhuma flag booleana. A flag só preenche um campo de dado e não alterna comportamento, por isso fica
como minor. Uma fábrica dedicada resolve e deixa claro no ponto de uso:

```ts
const requiredText = (key: string, label: string, maxLength: number) => ({
  ...text(key, label, maxLength),
  required: true,
});
// text('name', 'Nome do cargo', 100, true) -> requiredText('name', 'Nome do cargo', 100)
```

**MIN-3. Regex de acentos com caracteres combinantes literais**
`libs/domain/src/lib/catalogs/import-registry.ts:382`

`/[̀-ͯ]/g` guarda os bytes U+0300–U+036F literais no fonte. O intervalo fica invisível no editor e
quebra fácil numa gravação com encoding errado (a armadilha de encoding do PowerShell já apareceu neste
repositório). O precedente do PLS-CADD (`pls-cadd-parser.service.ts:17`) usa o escape:

```ts
return text.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
```

**MIN-4. Rótulos das categorias de custo fixo agora existem em 3 lugares (regra das três)**
`libs/domain/src/lib/catalogs/import-registry.ts:345-352`

Os mesmos 6 rótulos já estão duas vezes em `apps/web/src/app/catalogs/fixed-cost-labels.ts`
(`FIXED_COST_CATEGORY_LABELS` e `FIXED_COST_CATEGORIES`). Com o registro, são três cópias, e mudar um
rótulo na web deixa a correspondência por rótulo da importação desatualizada. Também vale para
`STEEL: 'Aço'` (`ground-wire-form.component.ts:69`). A recomendação é levar
`FIXED_COST_CATEGORY_LABELS: Record<FixedCostCategory, string>` (e os rótulos de `GroundWireType`)
para `libs/domain/src/lib/catalogs/fixed-costs.ts` / `ground-wires.ts` e consumi-los no registro e na
web. O tipo `Record<FixedCostCategory, string>` ainda faz o compilador acusar uma categoria nova sem
rótulo, o que hoje só o teste pega. Pode ficar para o grupo 3, que já vai mexer na web.

**MIN-5. Negativo cai no motivo `not-decimal`**
`libs/domain/src/lib/catalogs/import-registry.ts:492-500`

`-1.5` (number ou texto) vira `'not-decimal'` porque `POSITIVE_DECIMAL_PATTERN` reprova o sinal. Na
borda pt-BR isso vira algo como "não é um número decimal", o que confunde quem digitou `-1,5`. Há duas
saídas: uma violação `'negative'` própria (detecção barata, `value.startsWith('-')` antes do pattern)
ou uma mensagem genérica na borda, como "deve ser um número decimal não negativo". No `int` o
comportamento já é bom (`'-3'` → `below-min`).

**MIN-6. Pequenos desvios de legibilidade**
`libs/domain/src/lib/catalogs/import-registry.ts`

- `:442` ternário aninhado (`raw === 1 ? true : raw === 0 ? false : null`). Early returns deixam mais
  claro.
- `:493` o `as string` depende do `isBlank` acima. Um `?? ''` explícito, ou tipar
  `normalizeDecimalCell` com sobrecarga para entrada não vazia, dispensa o cast.
- Nomes de função sem verbo: `decimal`, `int`, `text` (fábricas) e `fold`. Sugestão: `decimalField`,
  `intField`, `textField` e `foldForComparison`.

**MIN-7. Paridade não trava `scale`/`maxLength`/`min` contra o DTO**
`apps/api/src/contexts/catalogs/infrastructure/import/import-registry-parity.spec.ts:75-126`

A paridade cobre o que o design pede (conjunto de campos e obrigatoriedade), mas os limites que o
registro repete do DTO podem divergir sem nenhum teste falhar. Exemplo: o DTO sobe `code` para 60
caracteres e a prévia continua barrando em 50. O `sampleValue` usa `'1.5'` (1 casa) e `'X'` e não
testa as fronteiras. Uma sonda de fronteira por campo resolve:

```ts
it('limites do registro batem com o DTO (fronteira aceita no DTO)', async () => {
  const base = requiredPayload(definition);
  for (const f of definition.fields) {
    const atLimit =
      f.kind === 'text' && f.maxLength ? 'A'.repeat(f.maxLength)
      : f.kind === 'decimal' ? `1.${'1'.repeat(f.scale ?? 0)}`.replace(/\.$/, '')
      : f.kind === 'int' ? f.min ?? 0
      : null;
    if (atLimit === null) continue;
    await expect(
      validateImportPayload(key, { ...base, [f.key]: atLimit }),
    ).resolves.toEqual([]);
  }
});
```

A sonda pega o registro mais estrito que o DTO. O caso inverso (registro mais frouxo) não tem
consequência de dado, porque a prévia do grupo 2 também passa pelo DTO. Nos cabos (DTO sem escala) a
fronteira passa por definição, o que está certo. Detalhe menor: em `:114`,
`toBeGreaterThanOrEqual(requiredInRegistry.length)` é fraco e redundante com o laço seguinte, que é
quem prova a propriedade. Pode sair.

## ✅ Destaques Positivos

- **Registro fiel ao código e ao banco**: conferi os 8 catálogos contra os DTOs de criação/versão e o
  `schema.prisma`. Campos, requeridos (`name` em mão de obra, `description` em equipamentos/custos
  fixos, `type`/`category` como discriminadores), `maxLength` (50/100/200), `min` (1 para fios, fibras e
  amortização; 0 para NSPT e disponibilidade própria) e escalas (12,4/12,2/10,3/12,2 nos cabos, 12,3 no
  I²t, 6,4 nos percentuais) batem sem exceção.
- **Paridade por metadados do class-validator**: `getTargetValidationMetadatas` enumera as
  propriedades decoradas do DTO, sem lista manual. O teste de requeridos (omitir um requerido reprova,
  omitir um opcional não) prova a obrigatoriedade nos dois sentidos, e reusar o `NsptRangeOrdered` do
  DTO (inteiros crescentes no `sampleValue`) mostra que as regras entre campos seguem valendo na
  importação. O modo de falha "campo decorado fora do registro é descartado em silêncio", apontado na
  review de catalogo-solos-fundacoes, fica travado aqui.
- **RNF-09 levado a sério**: célula vazia em opcional vira `null` e nunca zero ou `''`. `min: 0` aceita
  zero como valor informado. Valor fixo só com espaços não conta como associação, o que tem teste
  próprio.
- **RNF-08**: a conversão de `number` usa `decimal.js` (`new Decimal(1.005)` → `'1.01'`, `0.1 + 0.2`
  → `'0.3'`), `toFixed()` sem notação científica, e os `number` de negócio nunca passam por aritmética
  de float.
- **Violações tipadas e mensagens na borda**, seguindo o padrão de `decimalScaleViolation`, que foi
  reutilizado em vez de reimplementado.
- **Enumerações aceitam valor ou rótulo** sem diferenciar caixa nem acento (`'aco'` → `STEEL`), o que
  vale muito com planilhas CELEO em espanhol/português.
- **README** com as 8 linhas alinhadas pelo Prettier e os status `TO_IMPORT`/`DUPLICATE_IN_FILE` além
  dos pedidos na task, coerentes com os contratos.
- **Decisão `.xlsm`** registrada em `design.md` ("Decisões de implementação") e propagada de forma
  coerente para spec, proposal e task 2.1, com a garantia "só valores, macros nunca executadas" no
  próprio requisito.

## Validação das decisões pedidas

| Decisão | Parecer |
|---|---|
| `min` adicional em `CatalogImportField` | **Aprovada.** Os DTOs usam `@Min(0)` e `@Min(1)` de forma real e diferente por campo. Sem `min`, a prévia classificaria como "a importar" linhas que o DTO reprova. `below-min` com motivo próprio é o certo. |
| Escalas = precisão das colunas; cabos mais estritos que o DTO | **Aprovada.** O registro fica fiel ao banco (RNF-08: sem o limite, o Postgres arredondaria em silêncio). O DTO dos cabos sem escala é uma lacuna pré-existente do cadastro manual, que merece uma change futura (`DecimalWithScale` nos 3 DTOs de cabo). Registrar a dívida. |
| `number` do parser arredondado à escala (ROUND_HALF_UP) | **Aprovada com ressalva.** Remove o ruído binário do Excel (`0.30000000000000004`) e segue o D4. O efeito colateral é arredondar em silêncio uma precisão real digitada (`0.12345` numa coluna de escala 4 vira `0.1235`), enquanto o mesmo valor em texto é reprovado. Sugestão para o grupo 2/3: marcar na prévia as células arredondadas (aviso, não erro), ou arredondar primeiro a 15 dígitos significativos (precisão do Excel) e só então validar a escala. |
| Texto com casas excedentes reprovado | **Aprovada.** Texto é intenção explícita do usuário e arredondar seria alterar dado. Coberto por teste (`'1,234'` → `scale-exceeded`). |
| Rótulos de enum de custos fixos repetidos da web | **Aceita, com a extração recomendada no MIN-4** (3ª ocorrência). |
| Aplicabilidade por tipo do cabo de guarda fora do registro | **Aprovada.** Reusar `GroundWireVersionEntity.validateTypeApplicability` na prévia e no commit respeita o goal "nenhuma regra duplicada". Para o grupo 2: exigir um teste de prévia com linha STEEL trazendo `fiberCount`, que deve ser inválida com o motivo da entidade. Para o grupo 3: `unmappedOptionalFields` vai avisar "ficará sem dados" nos campos de aço mesmo com o valor fixo `OPGW` (e vice-versa). Ou a UI filtra os avisos pelo tipo fixado, ou o registro ganha um `appliesTo?` no campo. Hoje é só ruído de UX. |

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ⚠️ Problemas (MIN-2, MIN-3, MIN-6) |
| Typescript/Node.js | ✅ Ok (sem `any`; um `as string` justificável, MIN-6) |
| Angular/NestJS/React | ✅ Ok (sem Nest/Angular neste grupo além do mapa de DTOs) |
| REST/HTTP | ✅ Ok (contratos coerentes com D2; commit revalidando via DTO, ver MIN-1) |
| Testes | ⚠️ Problemas (MIN-7; cobertura dos helpers boa) |
| Logging/Monitoramento | ✅ Ok (não aplicável) |

## Recomendações

1. **(Antes do grupo 2 consumir)** MIN-1: `whitelist` + `forbidNonWhitelisted` (ou recorte pelas chaves
   do registro) em `validateImportPayload`, com mensagem pt-BR para propriedade desconhecida.
2. **(Grupo 2)** O `commit` deve revalidar cada payload pelo registro e pelo DTO, já que o corpo vem do
   cliente, e tratar por linha os erros do Prisma além do `P2002`. Exemplo concreto: os percentuais de
   mão de obra são `Decimal(6,4)`, então `100` passa no registro e no DTO (só a escala é checada) e
   estoura overflow numérico (`22003`) no Postgres. Sem tratamento, isso aborta a importação com 500. A
   precisão de inteiros é uma lacuna pré-existente dos DTOs; aqui basta que o commit degrade a linha
   para inválida.
3. **(Grupo 2)** Nos campos `text` (principalmente `code`), preferir o texto formatado da célula (`w`
   do SheetJS) ao `v` numérico, para não perder zeros à esquerda (`001` → `1`) nem o formato de códigos
   numéricos.
4. **(Grupo 2)** Antes do commit do grupo, rodar `npx nx format:check --all`: três arquivos novos do
   grupo 2 já reprovam hoje.
5. MIN-7: sonda de fronteira `scale`/`maxLength`/`min` na paridade.
6. MIN-4: levar os rótulos de `FixedCostCategory`/`GroundWireType` para a domain (pode ser no grupo 3).
7. MIN-2, MIN-3, MIN-5, MIN-6: ajustes locais de legibilidade e motivo, de baixo custo.
8. Registrar como dívida (fora desta change) os DTOs de cabo sem limite de escala e a falta de checagem
   de precisão inteira nos `DecimalWithScale`.

## Veredito

**APROVADO COM OBSERVAÇÕES.** O registro D1 está correto, completo e travado por paridade real contra os
DTOs. Os helpers são puros, determinísticos, tipados e bem testados, e todos os gates relevantes
passaram nos arquivos do grupo. Nenhum achado bloqueia o avanço. O MIN-1 e as recomendações 2 a 4 devem
ser absorvidos no grupo 2, que é onde viram risco concreto (payload do cliente no commit, overflow de
precisão e formatação dos arquivos novos). Os demais minors podem ser corrigidos no próprio grupo 1
antes do commit, a baixo custo.

## Resolução dos apontamentos (2026-09-30)

- **MIN-1**: `validateImportPayload` passou a validar com `whitelist: true`, como o `ValidationPipe` global. Além disso, o commit recorta o payload pelas chaves do registro antes de validar e gravar (teste "descarta chaves fora do registro").
- **MIN-2**: as fábricas agora são `decimalField`/`intField`/`textField`/`requiredTextField`/`enumField`, sem flag booleana.
- **MIN-3**: o regex com caracteres combinantes literais saiu. `foldText` filtra os code points do bloco U+0300–U+036F por faixa numérica, sem escape `\u` no fonte.
- **MIN-4**: `GROUND_WIRE_TYPE_LABELS` e `FIXED_COST_CATEGORY_LABELS` foram para a domain. O registro e a web (`ground-wire-labels.ts`, `fixed-cost-labels.ts`) consomem essa fonte única. A entidade da API mantém rótulos próprios, por extenso, porque os usa em mensagens de erro com outra semântica.
- **MIN-5**: nova violação `negative`, com a mensagem "não pode ser negativo".
- **MIN-6**: sem ternário aninhado (`parseBooleanCell`), sem cast `as string`, e os helpers ganharam nomes com verbo (`parse*Cell`, `validateDecimalCell`, `validateIntCell`, `foldText`).
- **MIN-7**: a paridade ganhou sondas de fronteira por campo: texto em `maxLength` e `maxLength + 1`, inteiro em `min` e `min - 1`, decimal na escala do registro, enum com valores válidos e inválido. A asserção redundante saiu. São 96 casos.
- **Recomendação de overflow**: o registro passou a declarar `precision` (Decimal(p, s) do schema), com a violação `too-large`. Assim, `100` num percentual Decimal(6,4) é reprovado na prévia em vez de estourar 500 no Postgres.
- **Recomendação de zeros à esquerda**: a porta `SpreadsheetSheet` ganhou `rowText` (texto formatado `w`), e os campos `text` leem dela.
- **Recomendação de aplicabilidade por tipo**: há teste (grupo 2) com STEEL + `fiberCount` reprovado pela regra da entidade.
- **Fica como dívida, fora desta change**: DTOs de cabo sem limite de escala e `DecimalWithScale` sem checagem de precisão inteira. O cadastro manual ainda pode estourar 500 com valores enormes.
