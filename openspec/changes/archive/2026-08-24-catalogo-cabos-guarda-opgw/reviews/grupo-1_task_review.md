# Review do Grupo 1 — Nomenclatura e modelo de dados

**Revisor**: AI Code Reviewer
**Data**: 2026-08-23
**Change / Grupo**: catalogo-cabos-guarda-opgw / grupo 1
**Status**: Aprovado com observações

## Resumo

O grupo 1 entrega a base de dados do segundo catálogo da fase F1: os termos do
design D5 no mapa canônico do README, o enum `GroundWireType` e os modelos
`GroundWire`/`GroundWireVersion` no `schema.prisma` (design D1), e a migration
aditiva `20260824005254_catalogo_cabos_guarda`, aplicada no Postgres local com
o Prisma Client regenerado.

A modelagem está fiel ao design D1 em todos os pontos verificáveis: tipo na
identidade, colunas específicas anuláveis, Decimal em todos os numéricos
(RNF-08), `effective_from` como `DATE`, unicidade `[groundWireId, effectiveFrom]`
e índice descendente. A migration é puramente aditiva e espelha o padrão do
piloto até na semântica da FK. O único bloqueio é a formatação da tabela do
README: a linha nova "classe de galvanização" alarga a primeira coluna e o
`npx nx format:check` completo — o gate do CI (`.github/workflows/ci.yml:46`)
— reprova o arquivo. É reincidência do major da review grupo-4 do piloto, e o
design D3 desta change lista exatamente esse gate como padrão herdado
obrigatório antes de cada commit.

## Arquivos Revisados

| Arquivo                                                             | Status      | Problemas |
| ------------------------------------------------------------------- | ----------- | --------- |
| README.md                                                            | ⚠️ Problemas | 1 major   |
| prisma/schema.prisma                                                 | ⚠️ Problemas | 2 minor   |
| prisma/migrations/20260824005254_catalogo_cabos_guarda/migration.sql | ✅ Ok        | 0         |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

**M1 — README.md reprova no `npx nx format:check` (gate do CI)**

- **Arquivo**: `README.md`, linhas 89–113 (tabela do mapa de nomenclatura; a
  linha 94 é o gatilho)
- **Problema**: a célula "classe de galvanização" é mais larga que a primeira
  coluna atual da tabela; o Prettier exige realinhar a tabela inteira
  (primeira coluna passa de 21 para 22 caracteres em todas as 25 linhas).
  Verificado: `npx nx format:check` completo sai com código 1 apontando
  `README.md` — exatamente o comando que o CI roda
  (`.github/workflows/ci.yml:46`). O commit deste grupo quebraria o CI.
- **Reincidência**: mesmo apontamento major da review grupo-4 do piloto
  (`piloto-catalogo-cabos/reviews/grupo-4_task_review.md`); o design D3 desta
  change lista "`nx format:check` antes de cada commit" como padrão herdado.
- **Correção**: rodar `npx nx format:write` (ou `npx prettier --write
  README.md`) e conferir com `npx nx format:check` completo.
- **Armadilha descoberta na verificação**: `npx nx format:check
  --files=README.md` passa silenciosamente (o filtro `--files` não casa o
  arquivo e o comando não verifica nada) enquanto o gate completo falha. Não
  usar a forma com `--files` como evidência de formatação — sempre o comando
  completo, como no CI.

### 🟢 Problemas Minor

**m1 — Bloco de cabos de guarda separa o par item+versão de condutores**

- **Arquivo**: `prisma/schema.prisma`, linhas 33–78
- **Problema**: o enum e os modelos novos foram inseridos entre
  `ConductorCable` (linha 25) e `ConductorCableVersion` (linha 80), quebrando
  a adjacência do par item+versão do catálogo de condutores — o próprio grupo
  novo mantém seu par junto, o antigo ficou partido.
- **Correção**: mover o bloco `GroundWireType`/`GroundWire`/`GroundWireVersion`
  para depois de `ConductorCableVersion`, mantendo cada catálogo contíguo. Não
  altera o banco (ordem de modelos é irrelevante para a migration).

**m2 — Comentário de cabeçalho do `schema.prisma` desatualizado**

- **Arquivo**: `prisma/schema.prisma`, linhas 1–4
- **Problema**: o cabeçalho ainda diz "Nesta fase existe apenas a tabela
  mínima de infraestrutura" — já era falso desde o piloto (pré-existente, não
  introduzido por este grupo), e fica mais defasado a cada catálogo.
- **Correção**: atualizar o comentário para refletir que o schema contém a
  infraestrutura mínima e os catálogos da fase F1.

## ✅ Destaques Positivos

- **Design D1 implementado fielmente**: `type GroundWireType` na identidade
  (`GroundWire`), não na versão — o tipo de fato não pode variar entre
  versões; enum mapeado para `ground_wire_type` em snake_case; todas as seis
  colunas específicas (3 de aço, 3 de OPGW) anuláveis conforme RNF-09.
- **RNF-08 respeitado**: todos os numéricos de negócio como `Decimal` com
  precisão explícita — inclusive `i2t_ka2s DECIMAL(12,3)`; nenhum float.
  `wire_count`/`fiber_count` como `Int?`, correto para contagens.
- **Consistência com o piloto**: precisões dos campos comuns idênticas às de
  `ConductorCableVersion` (12,4 / 12,2 / 10,3 / 12,2), mesma trinca
  `effective_from @db.Date` + `@@unique([groundWireId, effectiveFrom])` +
  `@@index(..., effectiveFrom(sort: Desc))`, mesma FK `ON DELETE RESTRICT ON
  UPDATE CASCADE`.
- **Migration puramente aditiva**: só `CREATE TYPE/TABLE/INDEX` e
  `ADD CONSTRAINT`; nenhuma tabela existente é tocada. Verificado aplicada
  (`prisma migrate status`: 5 migrations, schema up to date) e o client
  regenerado com `GroundWireType` e `i2tKa2s: Decimal | null` (task 1.3
  confirmada).
- **Mapa de nomenclatura completo e coerente**: os 8 termos do D5 presentes,
  com as formas camelCase/snake_case batendo exatamente com o schema; termos
  entraram no mapa antes do código, como manda o README.
- **Comentários exemplares**: o bloco em pt-BR sobre `GroundWireType`
  documenta a decisão D1 e o risco aceito (invariante de aplicabilidade
  garantida na API), exatamente o registro que o design pede.
- **`prisma validate` e `prisma format --check` limpos.**

## Conformidade com Padrões

| Padrão                | Status                                        |
| --------------------- | --------------------------------------------- |
| Padrões de Código     | ✅ Ok (inglês no código, comentários pt-BR)   |
| Typescript/Node.js    | ✅ Ok (client regenerado, tipos Decimal/enum) |
| Angular/NestJS/React  | N/A neste grupo                               |
| REST/HTTP             | N/A neste grupo                               |
| Testes                | N/A neste grupo (modelo de dados; testes nos grupos 3–4) |
| Logging/Monitoramento | N/A neste grupo                               |
| Formatação (CI gate)  | ❌ `nx format:check` reprova README.md (M1)   |

## Recomendações

1. **(M1, obrigatório antes do commit)** Rodar `npx nx format:write` para
   realinhar a tabela do README e validar com `npx nx format:check` completo —
   nunca com `--files=`, que não verifica nada neste caso.
2. **(m1)** Mover o bloco de cabos de guarda para depois de
   `ConductorCableVersion` no `schema.prisma`, mantendo os pares item+versão
   contíguos por catálogo.
3. **(m2)** Atualizar o comentário de cabeçalho do `schema.prisma`.
4. **(Processo)** Nos próximos grupos, incluir `npx nx format:check` (completo)
   na verificação de cada task que toque arquivo formatável — terceira
   ocorrência desse apontamento tornaria razoável um hook local.

## Veredito

**APROVADO COM OBSERVAÇÕES.** A modelagem está correta e fiel ao design D1/D5,
a migration é aditiva e foi aplicada com o client regenerado. Corrigir M1
(formatação do README) **antes de commitar** — o CI reprovaria como está — e,
aproveitando o mesmo commit, resolver m1/m2. Nenhum retrabalho de modelagem é
necessário; o grupo 2 (contratos em `libs/domain`) pode prosseguir após a
correção.
