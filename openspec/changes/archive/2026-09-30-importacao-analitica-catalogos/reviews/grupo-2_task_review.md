# Review da Task 2 (2.1, 2.2, 2.3, 2.4): API, módulo catalog-import (inspect/preview/commit)

**Revisor**: AI Code Reviewer
**Data**: 2026-09-30
**Change / Grupo**: importacao-analitica-catalogos / grupo 2
**Status**: Aprovado com observações

## Resumo

O grupo entrega os três endpoints da Importação Analítica (design D2/D3/D4):

- `POST /catalogs/import/inspect`: multipart, abas com as primeiras 30 linhas em texto.
- `POST /catalogs/import/preview`: multipart com as opções em JSON no campo `options`. Classifica cada
  linha como a importar, ignorada (já existe), duplicada no arquivo ou inválida (com motivo pt-BR).
- `POST /catalogs/import/commit`: JSON. Grava os itens novos pelos casos de uso de criação existentes
  e devolve o relatório com as contagens.

A arquitetura segue o padrão hexagonal do contexto:

- Duas portas (`SpreadsheetReader`, `CatalogImportTargets`).
- Um caso de uso que não conhece SheetJS, DTO nem Prisma.
- Um adaptador SheetJS.
- Adaptadores de destino que validam pelo **DTO de criação real** e pela regra de aplicabilidade da
  `GroundWireVersionEntity`, e criam pelos casos de uso já exportados do `CatalogsModule`.

Não há regra de cadastro duplicada. O goal de fidelidade (o commit grava o que a prévia classificou)
se sustenta de duas formas: o commit recorta o payload pelas chaves do registro e revalida, e o
`DuplicateCatalogCodeException` (P2002) vira "ignorado" sem abortar o lote.

Conferi as decisões pedidas uma a uma (seção *Decisões validadas*). Todas se sustentam. Não encontrei
bug funcional nem problema crítico. Os achados acionáveis são dois majors:

1. **Limites de código.** O caso de uso tem cerca de 350 linhas de classe, `preview` tem 60 linhas e há
   dois métodos com 5 parâmetros.
2. **Superfície de DoS e dependência vulnerável.** O parse é síncrono e sem teto de descompressão, sobre
   o SheetJS 0.18.5, que tem CVEs conhecidos no caminho de leitura. O endpoint é sem autenticação.

Os minors são de mensagens em inglês em bordas de erro raras (multer e body-parser), do limite global
de JSON, de testes de limite faltantes e de pequenos atalhos no adaptador do cabo de guarda.

**Verificação executada**

| Comando | Resultado |
|---|---|
| `npx nx test api --skip-nx-cache` | 57 suítes, **463 testes verdes** |
| `npx nx lint api --skip-nx-cache` | 0 erros |
| `npx tsc -p apps/api/tsconfig.app.json --noEmit` | limpo |
| `npx tsc -p apps/api/tsconfig.spec.json --noEmit` | limpo |
| `npx prettier --check apps/api/src/contexts/catalogs apps/api/src/app apps/api/src/main.ts` | todos os arquivos formatados |
| `npx nx format:check --all` | reprova `AGENTS.md`/`CLAUDE.md` (pré-existentes, fora do escopo) e `apps/web/src/app/catalogs/{fixed-cost-labels,ground-wire-labels}.ts`. Estes dois são **falso positivo local**: o índice está em LF (`git ls-files --eol` → `i/lf w/crlf`) e o CRLF vem do `core.autocrlf=true` na cópia de trabalho. O `prettier` não acusa diferença de conteúdo e o CI (checkout LF) passa |
| BOM (`head -c3 \| od`) | ausente em todos os arquivos novos e alterados de `apps/api` |
| `node -e "require('xlsx/package.json').version"` | **0.18.5** |

## Decisões validadas

| Decisão | Avaliação |
|---|---|
| Módulo separado `CatalogImportModule` que importa `CatalogsModule` e consome os casos de uso exportados | ✅ Correto. Não re-provê `PrismaService` (evita a dívida do pool duplicado registrada em reviews anteriores) e está no `context-modules-di.spec.ts`, que compila com DI real |
| Validação pelo DTO de criação real (`plainToInstance` + `validate` com `whitelist`) + `validateTypeApplicability` da entidade | ✅ Cumpre o goal "nenhuma regra duplicada", inclusive regras entre campos (faixa de NSPT, testada). A regra da entidade só roda quando o DTO passa, o que evita mensagens redundantes |
| Dedup case-insensitive: existente ignorado antes de validar; duplicado no arquivo só entre válidas | ✅ Coerente com RNF-05 (existente nunca é tocado, então os defeitos dele são irrelevantes). Uma linha inválida não "reserva" o código, então a próxima válida com o mesmo código entra, o que é o comportamento esperado ("a primeira **válida** vale"). O teste de classificação cobre os quatro status numa única aba |
| Commit recorta o payload pelas chaves do registro, revalida, trata P2002 como ignorado e `InvalidCatalogData`/`InvalidCivilDate` como inválido, e relança o resto | ✅ O recorte por `definition.fields` fecha a injeção de chaves (inclusive `__proto__`/`constructor`: só chaves do registro são lidas). O teste "erro inesperado de infraestrutura não é mascarado" trava o relançamento. A ordem difere da prévia (ver MIN-6) |
| Opções da prévia em JSON no campo multipart `options` | ✅ Validação explícita com o mesmo rigor do `ValidationPipe`. JSON não-objeto, array e `null` são rejeitados com orientação pt-BR. Os validadores customizados (`ColumnIndexMap`, `StringValueMap`) garantem que `value.trim()` e `cells[column]` nunca recebam tipo inesperado |
| Filtro 413 pt-BR | ✅ Para o limite do multer. Não cobre o 413 do body-parser no commit (MIN-2) |
| Reader lê só valores + texto formatado, até 256 colunas, CSV com fallback Windows-1252 | ✅ `cellFormula/cellHTML/cellStyles: false`. O teto de colunas protege contra o `!ref` inflado. `sheetRows` na inspeção e `sheets: [nome]` na prévia |
| Limite de 5000 linhas | ✅ Na prévia (aborta na 5001ª linha não vazia) e no commit (DTO `ArrayMaxSize` + checagem no caso de uso). Sem teste (MIN-4) |
| Sem `RolesGuard`, seguindo o precedente dos controllers de catálogo | ✅ Coerente: nenhum controller de `catalogs` nem de `staking` (PLS-CADD) usa guard, e a autenticação é decisão em aberto. Registrado como risco na passada de segurança |

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `apps/api/src/contexts/catalogs/domain/ports/catalog-import.ports.ts` (+ `index.ts`) | ✅ Ok | 0 |
| `apps/api/src/contexts/catalogs/domain/exceptions/catalog-domain.exceptions.ts` | ✅ Ok | 0 |
| `apps/api/src/contexts/catalogs/application/usecases/import/catalog-import.usecases.ts` | ⚠️ Problemas | 1 major, 3 minors |
| `apps/api/src/contexts/catalogs/application/usecases/import/catalog-import.usecases.spec.ts` | ⚠️ Problemas | 1 minor |
| `apps/api/src/contexts/catalogs/infrastructure/import/xlsx-spreadsheet.reader.ts` | ⚠️ Problemas | 1 major (segurança) |
| `apps/api/src/contexts/catalogs/infrastructure/import/xlsx-spreadsheet.reader.spec.ts` | ✅ Ok | 0 |
| `apps/api/src/contexts/catalogs/infrastructure/import/catalog-import-targets.ts` | ⚠️ Problemas | 1 minor |
| `apps/api/src/contexts/catalogs/infrastructure/import/catalog-import-targets.spec.ts` | ✅ Ok | 0 |
| `apps/api/src/contexts/catalogs/infrastructure/http/controllers/catalog-import.controller.ts` (+ `index.ts`) | ⚠️ Problemas | 2 minors |
| `apps/api/src/contexts/catalogs/infrastructure/http/controllers/catalog-import.controller.spec.ts` | ✅ Ok | 0 |
| `apps/api/src/contexts/catalogs/infrastructure/http/dto/catalog-import.dto.ts` | ✅ Ok | 0 |
| `apps/api/src/contexts/catalogs/infrastructure/http/controller-shared.ts` | ✅ Ok | 0 |
| `apps/api/src/contexts/catalogs/infrastructure/catalog-import.module.ts` | ✅ Ok | 0 |
| `apps/api/src/app/app.module.ts`, `apps/api/src/app/context-modules-di.spec.ts` | ✅ Ok | 0 |
| `apps/api/src/main.ts` | ⚠️ Problemas | 1 minor |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

**MAJ-1: `CatalogImportUseCases` estoura os limites de código (classe, método, parâmetros)**
`apps/api/src/contexts/catalogs/application/usecases/import/catalog-import.usecases.ts`

- A classe vai da linha 125 à 474 (**cerca de 350 linhas**, limite 300). É o maior arquivo de casos de
  uso da API, mais que o dobro do segundo (`change-orders.usecases.ts`, 212).
- `preview` (linhas 151–210) tem **60 linhas** (limite 50).
- `commitItem(target, payload, effectiveFrom, createdBy, existing)` (256) e
  `classifyRow(definition, target, request, dataRow, keys)` (293) têm **5 parâmetros** (limite 3).

A classe acumula três responsabilidades separáveis:

1. Validação da requisição: `assertSupportedFile`, `assertMapping`, `assertEffectiveFrom`,
   `definitionOf`, `fieldOf`.
2. Recorte da aba: `dataRowsBelowHeader`, `displayRow`, `isBlankRow`.
3. Classificação e commit.

Correção sugerida: extrair (1) para funções puras num `import-request.guards.ts` e agrupar o contexto de
cada operação num objeto. Exemplo:

```ts
interface PreviewContext {
  definition: CatalogImportDefinition;
  target: CatalogImportTarget;
  request: CatalogImportPreviewRequest;
  existing: Set<string>;
  seen: Set<string>;
}

private async classifyRow(ctx: PreviewContext, row: DataRow): Promise<CatalogImportPreviewRow>

interface CommitContext {
  target: CatalogImportTarget;
  effectiveFrom: string;
  createdBy: string;
  existing: Set<string>;
}

private async commitItem(ctx: CommitContext, payload: ImportPayload): Promise<CatalogImportCommitRow>
```

Em `preview`, extrair o bloco que valida as colunas contra o cabeçalho (linhas 174–181) para
`assertColumnsWithinHeader(definition, request, headers)` e o bloco de contagens (198–199) para uma
função `countByStatus(rows)`. `commit` já tem o mesmo padrão inline nas linhas 248–251. Os testes
existentes cobrem bem o comportamento e sustentam o refit sem alterar asserções.

**MAJ-2 (segurança): parse de planilha sem teto de descompressão e síncrono no event loop, sobre o SheetJS 0.18.5 com CVEs conhecidos, em endpoint sem autenticação**
`apps/api/src/contexts/catalogs/infrastructure/import/xlsx-spreadsheet.reader.ts:100-115`, `catalog-import.controller.ts:41-43`

Os problemas se somam:

- **CVEs do `xlsx@0.18.5`** (a última versão publicada no npm; as correções só saem no CDN da SheetJS):
  - **CVE-2023-30533**: *prototype pollution* ao **ler** um arquivo criado para isso. Corrigido na
    0.19.3.
  - **CVE-2024-22363**: ReDoS. Corrigido na 0.20.2.

  O caminho afetado é exatamente `XLSX.read` sobre upload não confiável. A dependência já existia
  (PLS-CADD, baseline), mas este grupo abre o endpoint mais genérico do sistema: qualquer planilha, de
  qualquer origem, até 40 MB.
- **Zip bomb.** `.xlsx/.xlsm` são ZIP, e o limite de 40 MB vale para o arquivo **comprimido**. Um
  arquivo pequeno pode inflar para gigabytes na descompressão e derrubar o processo por OOM. Nem
  `sheetRows` nem `sheets: [nome]` evitam a descompressão do contêiner.
- **Parse síncrono na thread da requisição.** Enquanto o template real de cerca de 30 MB é parseado,
  **toda a API** para de responder. Multer em memória e nenhum limite de concorrência multiplicam o
  efeito: N uploads simultâneos significam N × (40 MB + estrutura parseada) na heap.
- Sem autenticação e com `X-User` falsificável, qualquer cliente que alcance a API dispara o parse.

Não classifico como crítico porque a dependência e a ausência de autenticação são pré-existentes e
compartilhadas com o PLS-CADD, e o risco de latência foi aceito no design (Riscos, D2). É, porém,
**bloqueante para produção** e deve virar task própria antes do deploy. Correção sugerida, em ordem de
custo/benefício:

1. Atualizar o SheetJS para ≥ 0.20.3 pelo tarball oficial
   (`"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"`). Isso afeta os 4 consumidores
   (`catalogs`, `staking`, `baseline`, `export`) e deve ser validado com as suítes deles.
2. Checar o tamanho **descomprimido** declarado no diretório central do ZIP antes do `XLSX.read`.
   Exemplo: `XLSX.CFB.read(buffer, { type: 'buffer' })` e somar `FileIndex[i].size`, rejeitando acima
   de um teto (ex.: 400 MB) com `InvalidImportFileException` pt-BR.
3. Mover o parse para um `worker_thread` com `resourceLimits.maxOldGenerationSizeMb` (ex.: `piscina`),
   o que resolve bloqueio e OOM de uma vez. Alternativa mínima: um semáforo de 1–2 parses simultâneos
   no adaptador.
4. Quando a change de autenticação chegar, este controller é o primeiro candidato ao `RolesGuard`
   (escreve em lote em catálogos versionados).

### 🟢 Problemas Minor

**MIN-1: limite global de JSON de 10 MB para toda a API**
`apps/api/src/main.ts:14-16`. `app.useBodyParser('json', { limit: '10mb' })` vale para **todas** as
rotas JSON, que antes tinham 100 kB, e amplia a superfície de DoS da API inteira para servir um único
endpoint. Correção: limitar por caminho, antes do parser padrão.

```ts
import { json } from 'express';
app.use(`/${globalPrefix}/catalogs/import/commit`, json({ limit: '10mb' }));
```

(O parser padrão do Nest vê o corpo já lido e não o reprocessa.) Alternativa: `bodyParser: false` no
`NestFactory.create` e registrar os dois parsers explicitamente.

**MIN-2: 413 do body-parser (commit acima de 10 MB) e erros não-tamanho do multer respondem em inglês (RNF-14)**
`catalog-import.controller.ts:54-67`.

- O `ImportFileTooLargeFilter` só pega o `PayloadTooLargeException` que o Nest gera a partir do
  `LIMIT_FILE_SIZE` do multer. O 413 do body-parser acontece no middleware do Express, antes do
  roteamento do Nest. O mais provável é que chegue ao cliente como `PayloadTooLargeError: request
  entity too large` (HTML do `finalhandler`).
- Os demais erros do multer que o Nest transforma em `BadRequestException` também saem em inglês:
  `Unexpected field` (arquivo em campo diferente de `file`), `Too many files` e `Field value too long`
  (`options` acima de 1 MB).

Correção: estender o filtro para `BadRequestException` vindas do multer, mapeando as mensagens
conhecidas para pt-BR, e tratar o 413 do body-parser com um middleware de erro Express registrado no
`main.ts` (`(err, req, res, next) => err.type === 'entity.too.large' ? res.status(413).json({...}) : next(err)`).
Baixa frequência, mas é borda visível ao usuário.

**MIN-3: `readOrFail` engole a causa sem log, e erros nos acessos preguiçosos da aba escapam dele**
`catalog-import.usecases.ts:399-407`.

- O `catch {}` sem parâmetro transforma **qualquer** erro do reader, inclusive um bug de programação,
  em 400 "arquivo ilegível", sem nenhum registro. Não há como diagnosticar em produção.
- `sheet.row()`/`rowText()` são avaliados depois, fora do `readOrFail` (em `dataRowsBelowHeader`, e em
  `inspect` no `map`). Uma falha ali (ex.: `toISOString()` sobre `Date` inválida em
  `xlsx-spreadsheet.reader.ts:40`) sai como 500.

Correção: logar a causa em nível `warn` no adaptador e envolver também a materialização das linhas. O
mais simples é o reader devolver erro de domínio próprio (`UnreadableSpreadsheetError`) que o caso de
uso traduz.

**MIN-4: limites de 5000 linhas sem teste**
`catalog-import.usecases.spec.ts`, `catalog-import.controller.spec.ts`. Nenhum teste cobre:

- a prévia abortando na 5001ª linha não vazia (`catalog-import.usecases.ts:379-383`);
- o `ArrayMaxSize(MAX_IMPORT_ROWS)` do `CatalogImportCommitDto`;
- a checagem redundante do commit (`catalog-import.usecases.ts:218-222`).

São guardas de DoS: comportamento novo sem teste (DoD item 3). Sugestão: um `fakeReader` com
`rowCount = MAX_IMPORT_ROWS + 2` e linhas geradas, assertando a mensagem exata, e um caso no teste de
DTO do commit com `items` de tamanho `MAX_IMPORT_ROWS + 1`.

**MIN-5: adaptador do cabo de guarda lê o relógio e usa string mágica para construir uma entidade descartável**
`catalog-import-targets.ts:21-29`. `groundWireTypeCheck` cria uma `GroundWireVersionEntity` com
`CivilDate.today()` e `createdBy: 'importacao'` só para chamar `validateTypeApplicability`. O relógio
lido fora da borda contraria o padrão D2 do projeto, mesmo sem efeito aqui, e o autor fictício é valor
mágico em pt-BR num identificador. Correção: expor na entidade (ou num helper de domínio) uma função
estática que valide a aplicabilidade a partir dos campos, sem exigir período nem autor.

```ts
GroundWireVersionEntity.assertTypeApplicability(type, fields);
```

**MIN-6: ordem de checagem do commit diverge da prévia**
`catalog-import.usecases.ts:263-271`. Na prévia, um código já existente é ignorado **antes** de validar
(RNF-05). No commit, a validação vem primeiro, então um item existente com payload defeituoso sai
`INVALID` em vez de `SKIPPED_EXISTING`. No fluxo normal isso não acontece (o commit recebe payloads já
aprovados), mas o relatório pode divergir se o cliente reenviar itens. Sugestão: checar `existing`
antes de `target.validate`, lendo o código por `naturalKeyOf(payload['code'])`, como na prévia.

**MIN-7: cast redundante após type guard**
`catalog-import.usecases.ts:415`. `isCatalogImportKey` já estreita o tipo, e `as CatalogImportKey`
sobra.

## ✅ Destaques Positivos

- **Portas no lugar certo.** `SpreadsheetSheet` com `row()`/`rowText()` preguiçosos separa valor cru de
  texto formatado. Campos texto leem o texto exibido e preservam o zero à esquerda de códigos numéricos
  (testado com `00123`), enquanto campos numéricos leem o `number` cru.
- **Reuso real do cadastro.** `validateImportPayload` usa o próprio DTO de criação com `whitelist`, e
  `buildCatalogImportTargets` cria pelo caso de uso existente. O teste "regra entre campos do DTO vale
  na importação (faixa de NSPT invertida)" prova que nada foi reimplementado.
- **P2002 degradado sem mascarar o resto.** `DuplicateCatalogCodeException` vira ignorado e dados
  inválidos viram inválido. Erro inesperado é relançado, e há teste dedicado para isso, o que evita o
  anti-padrão de "catch tudo → linha inválida".
- **Recorte do commit pelo registro.** Fecha a injeção de chaves arbitrárias no payload (testado:
  "descarta chaves fora do registro antes de validar e gravar"). Somado ao `whitelist` do DTO, são duas
  barreiras independentes.
- **Recorte da aba (D4) testado com o caso real.** A seção "CABLES ACSR" empilhada abaixo da linha vazia
  não entra, e `firstDataRow`/`lastDataRow` são assertados.
- **Mensagens pt-BR exatas com o valor lido** (`(valor lido: "abc")`) e motivos distintos por violação
  (negativo, precisão, escala, enum com rótulos), assertados por igualdade.
- **Reader defensivo.** Indexação a partir de A1 mesmo com `!ref` começando em B2 (caso do template),
  teto de 256 colunas contra intervalo inflado, erros de fórmula (`#N/A`) contados como vazio, CSV com
  `raw: true` (a vírgula decimal chega intacta ao registro) e fallback Windows-1252, tudo testado.
- **DI provada.** O módulo entrou no `context-modules-di.spec.ts`, então a lição da change hexagonal
  (API que não sobe por paramtype `Object`) foi aplicada de primeira.
- **Vigência com round-trip na borda.** `2027-02-30` é rejeitada na prévia e no commit, com teste em
  ambos os níveis (caso de uso e controller).
- **Higiene.** BOM ausente, Prettier limpo, lint sem erro e tipos limpos em app e spec.

## Passada de segurança

| Vetor | Situação | Achado |
|---|---|---|
| Upload: tipo de arquivo | Extensão validada (`.xlsx/.xlsm/.xls/.csv`). O conteúdo é validado de fato pelo parse, e `readOrFail` devolve 400. O SheetJS aceita outros formatos disfarçados (HTML, SYLK, DBF) sob extensão válida, mas só lê valores, sem risco adicional além dos CVEs | ok |
| Upload: tamanho | 40 MB por arquivo, 1 arquivo, memória. Sem teto de descompressão nem de concorrência | **MAJ-2** |
| Macros `.xlsm` | Não executadas: SheetJS lê só valores, com `cellFormula: false` | ok |
| DoS por planilha | `!ref` inflado limitado a 256 colunas. Linhas: inspeção limitada a 30 (`sheetRows`), prévia para na 1ª linha vazia ou em 5000. Parse síncrono e zip bomb em aberto | **MAJ-2**, MIN-4 |
| Dependência | `xlsx@0.18.5`: CVE-2023-30533 (prototype pollution na leitura) e CVE-2024-22363 (ReDoS) | **MAJ-2** |
| Injeção via payload do commit | Recorte pelas chaves do registro, `whitelist` do DTO, validação de tipo por campo e Prisma parametrizado. Chaves `__proto__`/`constructor` nunca são lidas. Nome de aba `__proto__` resolve para aba vazia e depois 400 (inofensivo) | ok |
| Injeção via opções da prévia | JSON validado. Índices de coluna inteiros ≥ 0 e checados contra o cabeçalho. Campos checados contra o registro (`fieldOf`) | ok |
| Corpo JSON | 10 MB global para a API inteira | MIN-1 |
| AuthN/AuthZ | Sem guard e autor por `X-User` falsificável. Precedente dos controllers de catálogo, e a autenticação é decisão em aberto | risco registrado (MAJ-2, item 4) |
| CSV/formula injection | Textos como `=HYPERLINK(...)` são gravados como texto. O `export` (exceljs) escreve string como string, não como fórmula. Vale conferir quando catálogos forem exportados para CSV | observação |

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ⚠️ Problemas (MAJ-1: limites de classe/método/parâmetros; MIN-5, MIN-7) |
| Typescript/Node.js | ✅ Ok (sem `any` novo; o `error: any` de `handleCatalogDomainError` é pré-existente) |
| Angular/NestJS/React | ✅ Ok (módulo, DI com factory e tokens, DI spec, filtro de exceção) |
| REST/HTTP | ⚠️ Problemas (MIN-1 limite global; MIN-2 bordas 413/400 em inglês) |
| Testes | ⚠️ Problemas (MIN-4 limites sem teste; demais cenários do spec cobertos com mensagens exatas) |
| Logging/Monitoramento | ⚠️ Problemas (MIN-3: causa de arquivo ilegível descartada sem log; commit sem log de resumo, aceitável pelo D6) |

## Recomendações

1. **MAJ-1**: quebrar `CatalogImportUseCases`:
   - guardas da requisição em funções puras;
   - objetos de contexto para `classifyRow`/`commitItem`;
   - `preview` abaixo de 50 linhas.

   Sem alterar asserções.
2. **MIN-4**: testes dos limites de 5000 linhas (prévia, DTO do commit). É barato e trava as guardas de
   DoS.
3. **MIN-1**: restringir o limite de 10 MB à rota do commit.
4. **MIN-3**: logar a causa em `readOrFail` e cobrir a materialização preguiçosa das linhas.
5. **MIN-2, MIN-5, MIN-6, MIN-7**: podem entrar no mesmo PR ou ficar registrados no `tasks.md` como
   dívida da change.
6. **MAJ-2**: abrir task própria (fora do escopo do grupo, afeta 4 consumidores) antes de qualquer
   deploy exposto:
   - SheetJS ≥ 0.20.3 via tarball oficial;
   - teto de tamanho descomprimido;
   - parse em worker com limite de memória;
   - guard quando a autenticação chegar.

   Registrar no `design.md` (Riscos) e na QA 4.2 o tempo de parse do template real de cerca de 30 MB,
   que é a evidência para priorizar o worker.

## Veredito

**APROVADO COM OBSERVAÇÕES.** A implementação cumpre as tasks 2.1–2.4 e os cenários do spec
`catalogos/importacao-analitica` do lado da API, com reuso integral da validação e da criação do
cadastro. Não há problema crítico. Todas as decisões de desenho pedidas para validação se sustentam, e
os testes (463 verdes), o lint, os tipos, a formatação e a ausência de BOM estão ok.

Antes do commit do grupo, recomendo resolver o MAJ-1 e o MIN-4 (baratos e locais). O MAJ-2 não bloqueia
o grupo 3, mas **bloqueia produção** e precisa de task própria registrada agora, para não se perder.

## Resolução dos apontamentos (2026-09-30)

- **MAJ-1**: o caso de uso foi dividido em `catalog-import.messages.ts` (mensagens pt-BR e limites), `catalog-import.rules.ts` (guardas puras, recorte das linhas, conversão célula → payload) e `catalog-import.usecases.ts` (orquestração). A classe tem ~200 linhas e `preview` ~38. `classifyRow`/`commitItem` recebem objetos de contexto, com no máximo 3 parâmetros. Nenhuma asserção dos testes existentes mudou.
- **MAJ-2**: registrado como dívida em `design.md` ("Decisões de implementação"), com a decisão de trocar a origem do SheetJS levada ao usuário.
- **MIN-1**: o limite JSON baixou de 10 MB para 5 MB global, dimensionado pelo teto de 5.000 itens. O escopo por rota exigiria dependência direta de `express`/`body-parser`, que o projeto não declara. Registrado no design.
- **MIN-2**: `ImportUploadExceptionFilter` traduz para pt-BR o 413 e os 400 do multer ("Unexpected field", "Too many files", "Field value too long"…) e deixa os demais 400 intactos, com teste. O 413 do body-parser segue como resíduo documentado.
- **MIN-3**: o reader registra a causa técnica em log (`Logger.warn`). A leitura sob demanda das linhas (`row`/`rowText`) roda dentro de `readOrFail`, e as exceções de domínio passam intactas. Há teste para falha do parser em linha sob demanda.
- **MIN-4**: testes do teto de 5.000 linhas na prévia, no commit (caso de uso) e no `ArrayMaxSize` do DTO.
- **MIN-5**: a regra de aplicabilidade virou `GroundWireVersionEntity.assertTypeApplicability(values, type)` estático. A instância delega a ele, e o adaptador não monta mais entidade descartável, nem lê `CivilDate.today()` nem usa autor mágico.
- **MIN-6**: o commit ignora o existente antes de validar, na mesma ordem da prévia, com teste.
- **MIN-7**: o cast redundante saiu. A lista de extensões aceitas agora vem da domain (`CATALOG_IMPORT_FILE_EXTENSIONS`/`isSupportedImportFileName`), compartilhada com a web.
