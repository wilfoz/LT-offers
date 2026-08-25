# Review do Grupo 1 — Nomenclatura e modelo de dados

**Revisor**: AI Code Reviewer
**Data**: 2026-08-24
**Change / Grupo**: catalogo-isoladores / grupo 1 (tasks 1.1 a 1.3)
**Status**: APROVADO COM OBSERVAÇÕES

## Resumo

O grupo entrega a fundação do 5º catálogo (`DB_AIS`, isoladores — cobertura
via origem declarada do M02 e tabela de entidades do §05): cinco termos novos
no mapa de nomenclatura do README (design D4), o par plano
`Insulator`/`InsulatorVersion` do design D1 no final do `schema.prisma` e a
migration aditiva aplicada no Postgres local com o client regenerado. Não há
código de aplicação neste grupo, portanto testes de unidade não se aplicam.

A implementação segue o design D1 à risca e replica o precedente `GuyWire`
campo a campo: catálogo plano sem discriminador, tipo/fabricante/perfil/
descrição como `String?` na versão, precisões Decimal espelhando a família
(`rupture_strength_kn` 12,2 como `uts_kn`; `diameter_mm`/`spacing_mm`/
`creepage_distance_mm` 10,3 como `diameter_mm` dos cabos), vigência
`@db.Date` com `@@unique([insulatorId, effectiveFrom])` + índice desc,
autoria e todos os campos de negócio anuláveis (RNF-09). Os sete atributos
batem exatamente com a linha "Isolador" da tabela de entidades do §05 do
levantamento (`requisitos-calculo-lt.md:132`), mais a descrição (premissa 3
da proposta, registrada). Todos os gates da rotina passaram: `prisma
validate`, `prisma format --check` idempotente, `migrate status` (8
migrations, up to date), `migrate diff` sem drift banco↔schema,
`npx nx format:check --all` limpo, BOM UTF-8 ausente nos três arquivos,
client regenerado com os tipos novos e suíte da `api` verde SEM cache
(`--skip-nx-cache`). Zero críticos e zero majors; um minor de infraestrutura
de build descoberto durante a verificação.

## Arquivos Revisados

| Arquivo                                                        | Status | Problemas              |
| -------------------------------------------------------------- | ------ | ---------------------- |
| `README.md`                                                     | ✅ Ok  | 0                      |
| `prisma/schema.prisma`                                          | ✅ Ok  | 0 (1 nota informativa) |
| `prisma/migrations/20260825003249_add_insulators/migration.sql` | ✅ Ok  | 0                      |
| `nx.json` (não alterado; lido na verificação)                   | ⚠️ Problemas | 1 minor          |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

1. **`nx.json:4,15` — mudanças no `prisma/schema.prisma` NÃO invalidam o cache
   de testes da `api`.** Os `namedInputs` usam `default = {projectRoot}/**/* +
   sharedGlobals`, e `sharedGlobals` está vazio; como o schema fica na RAIZ do
   monorepo (fora de `apps/api`), `npx nx run-many -t test lint -p api domain`
   retornou 4/4 cache hit imediatamente após a mudança de schema + client
   regenerado. Nesta review a suíte foi reexecutada com `--skip-nx-cache` e
   passou de verdade, mas o risco institucional é aprovar grupo futuro (ou QA)
   em cima de resultado velho após mudança de schema. Correção sugerida (não
   pertence aos arquivos do grupo; pode entrar no commit do grupo ou ficar
   registrada para a task 5.2):

   ```jsonc
   // nx.json
   "sharedGlobals": ["{workspaceRoot}/prisma/schema.prisma"]
   ```

**Notas informativas (sem ação exigida):**

- Os índices `insulator_version_insulator_id_effective_from_{idx,key}` têm
  49/50 caracteres — folgados no limite de 63 (`NAMEDATALEN`), como previsto
  no design D1. Verificado no banco sem truncamento.
- A coluna `type` da versão é keyword NÃO reservada no Postgres (diferente de
  `function` em `tower_type`) — SQL cru não precisa de aspas. O mapa canônico
  já tem "tipo de isolador → `insulatorType`/`insulator_type`" (campo da
  série); dentro do próprio catálogo o campo é `type`, contextual, no
  precedente de `GroundWire.type` — sem conflito.
- O timestamp da migration (`20260825003249`) é UTC (21h32 BRT de 24/08) —
  comportamento padrão do Prisma, não é indício de data errada.

## ✅ Destaques Positivos

- **Fidelidade total ao design D1 e ao levantamento**: par plano espelho do
  `GuyWire`, sem enum especulativo para tipo/perfil (decisão justificada — o
  levantamento não enumera valores), e os sete atributos idênticos à linha
  "Isolador" do §05 (`tipo, fabricante, perfil, ruptura kN, diâmetro, passo,
  linha de fuga`) + descrição por consistência (premissa 3 registrada).
- **Precisões Decimal exatamente nos precedentes**: `rupture_strength_kn
  Decimal(12,2)` espelha `uts_kn` (mesma grandeza física, kN);
  `diameter_mm`/`spacing_mm`/`creepage_distance_mm Decimal(10,3)` espelham
  `diameter_mm` (comprimentos em mm) — coerência que sustenta a lição P2002
  de series-torres quando os DTOs limitarem a escala no grupo 3.
- **Todos os minors recorrentes de grupos-1 anteriores NÃO reincidiram**:
  bloco no FINAL do schema (guarda-opgw), cabeçalho do schema segue correto
  ("um par de modelos por nível de catálogo" cobre o 5º catálogo plano — a
  generalização feita em cabos-tirante segurou), BOM ausente (verificado byte
  a byte nos três arquivos), tabela do README realinhada e `format:check
  --all` limpo (nenhuma reincidência do gate de formatação), rótulos pt-BR
  por extenso no mapa (sem abreviações).
- **README completo e no padrão**: as cinco linhas novas com variantes
  camelCase/snake_case, qualificador "perfil (de isolador)" desambiguando o
  termo genérico, e as escolhas de nomenclatura do D4 documentadas no design
  (`spacing` da IEC 60305, `creepage distance` consagrado, `rupture strength`
  legível em vez da sigla SML).
- **Migration aditiva verificada de ponta a ponta**: `validate` +
  `format --check` + `migrate status` up to date + `migrate diff` sem drift +
  client regenerado (tipos `Insulator*` presentes no `index.d.ts`) + FK com
  RESTRICT padrão (exclusão de item com versões bloqueada no banco) + suíte
  da `api` verde sem cache.

## Conformidade com Padrões

| Padrão                | Status                                                                 |
| --------------------- | ---------------------------------------------------------------------- |
| Padrões de Código     | ✅ Ok (identificadores em inglês via mapa canônico, comentários pt-BR) |
| Typescript/Node.js    | ✅ Ok (client regenerado; sem código de aplicação neste grupo)         |
| Angular/NestJS/React  | N/A (grupo sem código de aplicação)                                    |
| REST/HTTP             | N/A (rotas chegam no grupo 3)                                          |
| Testes                | N/A (schema + migration; cobertura chega com service/controller)       |
| Logging/Monitoramento | N/A                                                                    |

## Recomendações

1. (Minor 1) Adicionar `{workspaceRoot}/prisma/schema.prisma` ao
   `sharedGlobals` do `nx.json` para que mudanças de schema invalidem o cache
   de testes — ou, no mínimo, rodar a suíte com `--skip-nx-cache` na task 5.2
   e registrar a dívida. Não bloqueia o commit do grupo.
2. (Rotina de commit) Incluir no commit, por caminho explícito (nunca
   `git add -A`): `README.md`, `prisma/schema.prisma`,
   `prisma/migrations/20260825003249_add_insulators/` e
   `openspec/changes/catalogo-isoladores/` (os artefatos da change estão
   untracked — lição do DESIGN.md: documento referenciado por artefato
   commitado precisa estar versionado).
3. (Para o grupo 3, sem ação agora) Ao escrever os DTOs, limitar a escala dos
   decimais à precisão das colunas (2 casas para ruptura, 3 para os
   comprimentos) — lição P2002 de series-torres, já prevista no design D2.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero críticos e zero majors — o modelo de dados
é um espelho fiel do precedente `GuyWire` com os campos do isolador, todos os
gates da rotina passaram e nenhum minor recorrente dos grupos-1 anteriores
reincidiu. O único minor é de infraestrutura de build (cache do Nx cego ao
`schema.prisma`), descoberto na verificação e verificável de forma
independente; não bloqueia o commit do grupo nem o avanço para o grupo 2
(contratos compartilhados).
