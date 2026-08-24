# Review do Grupo 1 — Nomenclatura e modelo de dados

**Revisor**: AI Code Reviewer
**Data**: 2026-08-24
**Change / Grupo**: catalogo-series-torres / grupo 1 (tasks 1.1 a 1.3)
**Status**: APROVADO COM OBSERVAÇÕES

## Resumo

O grupo entrega a fundação do 4º catálogo (RF-08, origem `DB_TOR`) — o primeiro
hierárquico e com tabela dependente: 13 termos novos no mapa de nomenclatura do
README (design D5), os cinco modelos Prisma do design D1
(`StructureSeries`/`StructureSeriesVersion`, enum `TowerFunction`,
`TowerType`/`TowerTypeVersion`, `TowerTypeWeight`) e a migration aditiva
aplicada no Postgres local com o client regenerado. Não há código de aplicação
neste grupo, portanto testes não se aplicam.

A implementação segue o design D1 à risca e replica com fidelidade os
precedentes dos catálogos anteriores (enum mapeado como `GroundWireType`,
vigência `@db.Date` com `@@unique` + índice desc, autoria, campos de negócio
anuláveis RNF-09, precisões da família 12,2 e altura 10,3 espelhando
`diameter_mm`). Todos os gates da rotina passaram: `prisma validate`,
`migrate status` (7 migrations, up to date), `migrate diff` sem drift entre
banco e schema, `prisma format` idempotente, `npx nx format:check` COMPLETO
limpo e BOM UTF-8 ausente nos três arquivos. Zero problemas críticos ou major;
apenas dois minors cosméticos.

## Arquivos Revisados

| Arquivo                                                                            | Status | Problemas |
| ---------------------------------------------------------------------------------- | ------ | --------- |
| `README.md`                                                                         | ✅ Ok  | 0         |
| `prisma/schema.prisma`                                                              | ⚠️ Problemas | 1 minor |
| `prisma/migrations/20260824103043_add_structure_series_and_tower_types/migration.sql` | ✅ Ok  | 0 (1 nota informativa) |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

1. **`prisma/schema.prisma:2-3` — cabeçalho desatualizado pelo catálogo hierárquico.**
   O cabeçalho diz "um par de modelos por catálogo, abaixo", mas o catálogo novo
   tem DOIS pares (série e tipo de torre) mais uma tabela filha
   (`tower_type_weight`). É a mesma classe de minor apontada no grupo-1 de
   `catalogo-cabos-guarda-opgw` (cabeçalho que envelhece a cada catálogo).
   Correção sugerida — generalizar de vez:

   ```prisma
   // Infra: health_check. Catálogos F1 seguem o padrão item + versões com
   // vigência derivada (RNF-05) — pares (e, no catálogo hierárquico, tabelas
   // filhas da versão) por catálogo, abaixo.
   ```

2. **`README.md:112` — rótulo pt-BR abreviado "função (susp. \| anc.)".**
   A convenção do projeto veta abreviações; embora a regra alveje
   identificadores de código (a coluna pt-BR é texto de documentação) e a
   abreviação evite alargar ainda mais a tabela, os demais rótulos do mapa são
   escritos por extenso ("classe de galvanização", "quantidade de estais").
   Sugestão: "função (suspensão \| ancoragem)" — o Prettier realinha a tabela;
   rodar `npx nx format:check` completo após o ajuste. Opcional, sem impacto
   funcional.

**Notas informativas (sem ação exigida):**

- Os índices `structure_series_version_structure_series_id_effective_from_{idx,key}`
  têm exatamente 63 caracteres — o limite `NAMEDATALEN` do Postgres. Verificado
  no banco: criados sem truncamento e sem colisão. Ficar atento em tabelas
  futuras com nomes longos: acima de 63 o Postgres trunca em silêncio.
- A coluna `function` ("função" é o nome canônico do domínio, design D5) é
  palavra reservada em SQL; o Prisma sempre a cita entre aspas, mas SQL cru
  contra `tower_type` precisará de `"function"` quoted.

## ✅ Destaques Positivos

- **Fidelidade total ao design D1**: os cinco modelos batem campo a campo com o
  design — `name` único na série, sigla única POR SÉRIE
  (`@@unique([structureSeriesId, code])`), função na identidade do tipo (mesmo
  racional do precedente `GroundWire.type`), tabela de pesos filha da VERSÃO
  (imutabilidade da versão ⇒ imutabilidade da tabela) com
  `@@unique([towerTypeVersionId, heightM])` como cinturão do validador de
  altura duplicada previsto no D2.
- **Precedentes aplicados sem desvio**: enum com `@@map("tower_function")` como
  `ground_wire_type`; `effective_from @db.Date` + `@@unique([itemId, effectiveFrom])`
  + índice desc idênticos aos três catálogos de cabos; `created_by`/`created_at`;
  precisões coerentes com a família (12,2 para kV/m/s/MW/kg; 10,3 para altura,
  espelhando `diameter_mm`); `Int?` para contagens; todos os campos de negócio
  anuláveis (RNF-09 — em particular `guy_count Int?` permitindo o zero
  autoportante distinto de null).
- **README completo**: os 13 termos do D5 entraram com as variantes
  camelCase/snake_case (e rota kebab-case onde cabe), "série" invariável
  (`structure-series`) consistente com `guy-wires`; o realinhamento da tabela
  pelo Prettier veio junto e o `format:check` completo passa — a lição das três
  reincidências do gate de formatação segue incorporada.
- **Bloco novo no lugar certo**: modelos adicionados ao FINAL do schema (o minor
  de inserção no meio do arquivo, apontado no grupo-1 do guarda-opgw, não
  reincidiu), com comentário de bloco explicando a novidade estrutural do
  catálogo hierárquico.
- **Migration aditiva limpa e verificada de ponta a ponta**: `prisma validate`
  ok, `migrate status` up to date, `migrate diff` banco↔schema sem diferença,
  client regenerado com os tipos novos confirmados no `index.d.ts`, FKs com o
  RESTRICT padrão (exclusão de série com tipos bloqueada no banco). BOM UTF-8
  ausente nos três arquivos editados no Windows (verificado byte a byte).

## Conformidade com Padrões

| Padrão                | Status |
| --------------------- | ------ |
| Padrões de Código     | ✅ Ok (nomenclatura em inglês, comentários pt-BR, sem abreviações nos identificadores) |
| Typescript/Node.js    | ✅ Ok (client regenerado; sem código de aplicação neste grupo) |
| Angular/NestJS/React  | N/A (grupo sem código de aplicação) |
| REST/HTTP             | N/A (rotas chegam nos grupos 3–4) |
| Testes                | N/A (schema + migration; cobertura chega com services/controllers) |
| Logging/Monitoramento | N/A |

## Recomendações

1. (Minor 1) Generalizar o cabeçalho do `schema.prisma` para não envelhecer a
   cada catálogo de forma nova — pode ir no commit deste grupo.
2. (Minor 2, opcional) Escrever "função (suspensão \| ancoragem)" por extenso no
   mapa do README, revalidando com `npx nx format:check` completo.
3. (Para os grupos 3–4, sem ação agora) Lembrar que SQL cru contra `tower_type`
   exige `"function"` entre aspas, e que os cenários do spec já cobertos pelo
   banco (P2002 em nome da série, sigla por série, vigência duplicada e altura
   duplicada) devem mapear para 409/400 pt-BR na API, como nos precedentes.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero críticos e zero majors — o modelo de dados
está fiel ao design D1/D5, os precedentes institucionais vieram aplicados de
primeira e todos os gates da rotina (validate, migrate status, diff sem drift,
format:check completo, BOM) passaram. Os dois minors são cosméticos
(cabeçalho do schema e rótulo abreviado no README) e podem ser resolvidos no
próprio commit do grupo, sem bloquear o avanço para o grupo 2 (contratos
compartilhados). Lembrete da rotina de commit: staging explícito por caminho
(nunca `git add -A`).
