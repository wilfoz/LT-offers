# Review do Grupo 1 (tasks 1.1 e 1.2)

**Revisor**: AI Code Reviewer
**Data**: 2026-08-25
**Change / Grupo**: catalogo-solos-fundacoes / grupo 1
**Status**: Aprovado com observações

## Resumo

Grupo 1 entrega a nomenclatura (task 1.1) e o modelo de dados (task 1.2) do 6º
catálogo corporativo (DB_FUN): bloco de solos/fundações no mapa canônico do
README (31 linhas novas) e os três pares item + versão no `prisma/schema.prisma`
(`SoilType`/`SoilTypeVersion`, `FoundationType`/`FoundationTypeVersion` com
`enum FoundationApplication`, `FoundationVolume`/`FoundationVolumeVersion`) com
migration aditiva `20260825102737_add_soil_foundation_catalogs`.

A implementação segue o design D1 à risca: todas as precisões conferem (12,2
para tensão/peso do solo; 10,3 para ângulo/coesão; 12,3 uniforme nas 34
quantidades da matriz), as 17 contagens e as 34 quantidades batem coluna a
coluna com D1 e com o spec, a identidade composta da tripla está única no banco
com nome explícito, e os nomes de índice que estourariam o NAMEDATALEN foram
nomeados manualmente — verificados no Postgres real sem truncamento. Nenhum
minor recorrente de grupos-1 anteriores reincidiu (bloco no final do schema,
sem BOM, format:check --all limpo, cabeçalho do schema ainda coerente,
comentários pt-BR). Zero problemas críticos ou major; três minors de
documentação/nomenclatura.

## Arquivos Revisados

| Arquivo                                                                  | Status | Problemas |
| ------------------------------------------------------------------------ | ------ | --------- |
| `README.md` (mapa canônico, +31 linhas)                                   | ⚠️ Ok com minor | 1 |
| `prisma/schema.prisma` (+155 linhas, 3 pares + enum + back-relations)     | ⚠️ Ok com minor | 2 |
| `prisma/migrations/20260825102737_add_soil_foundation_catalogs/migration.sql` | ✅ Ok | 0 |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

1. **README.md — rótulo com abreviações**: `faixa de NSPT (mín incl. / máx excl.)`.
   O padrão do mapa é rótulo por extenso (minor já apontado no grupo-1 de
   catalogo-series-torres com "função (susp. | anc.)" — 2ª ocorrência do
   padrão de rótulo abreviado). Sugestão: `faixa de NSPT (mínimo inclusivo /
   máximo exclusivo)`. Cosmético; o significado está inequívoco e o mesmo texto
   por extenso já existe no comentário do schema e no spec.
2. **schema.prisma:263 — identificador com 32 caracteres**:
   `allowableCompressionStressKgfCm2` excede a diretriz de 30 caracteres do
   projeto. É o nome canônico definido no proposal (Impact) e no design D5 —
   o sufixo de unidade `KgfCm2` segue o padrão `Kn`/`Mm` dos catálogos e
   encurtar perderia clareza. Desvio aceito e registrado; nenhuma ação
   requerida nesta change (se incomodar nos DTOs/web, tratar na validação §02
   das unidades, que já está sinalizada como aditiva).
3. **proposal.md × design/spec — redação da identidade do tipo de fundação**:
   o proposal (What Changes) diz "identidade = sigla + aplicação", o que
   sugeriria `@@unique([code, application])`; o design D1 e o spec dizem
   "sigla única no catálogo" e o schema implementa `code String @unique`
   (aplicação intrínseca ao tipo — `4FZ` é autoportante por construção). O
   código está correto contra design e spec (que são a autoridade de
   comportamento); apenas a frase do proposal ficou ambígua. Sugestão: ajustar
   a redação do proposal em alguma atualização futura da change para "sigla
   única + aplicação imutável na identidade".

## ✅ Destaques Positivos

- **Fidelidade total ao D1**: as 34 colunas `Decimal(12,3)` da matriz e as 17
  contagens `Int?` da composição batem uma a uma com o design e o spec,
  incluindo a ordem das famílias (escavação → perfuração → aço → concreto →
  complementos → metragens de estaca) e os nomes com sufixo de unidade.
- **Lição do NAMEDATALEN aplicada com critério**: nomes explícitos SOMENTE
  onde os auto-gerados passariam de 63 chars (`foundation_volume_version_
  foundation_volume_id_effective_from_key` teria 65; a unique da tripla
  passaria de 67) — `foundation_volume_tower_soil_foundation_key` (43) e
  `foundation_volume_version_volume_id_effective_from_{key,idx}` (54). Onde o
  auto-gerado cabe (`foundation_type_version_…` com 61, `soil_type_version_…`
  com 49) ficou implícito, mantendo a convenção Prisma. Verificado no Postgres
  real: 15 índices, maior nome com 61 chars, zero truncamento.
- **Comentário-documentação no bloco novo** explica exatamente as decisões não
  óbvias (identidade composta, por que os nomes de índice são explícitos,
  semântica da faixa de NSPT min inclusivo/max exclusivo com risco aceito do
  CHECK, RNF-09 nas contagens, unidades inferidas com referência à premissa do
  proposal) — em pt-BR, como manda a convenção.
- **Todos os precedentes institucionais aplicados de primeira**: enum com
  `@@map` snake_case (padrão `GroundWireType`/`TowerFunction`), aplicação na
  identidade imutável, vigência `@db.Date` + `@@unique([itemId,
  effectiveFrom])` + índice desc, colunas de negócio anuláveis (RNF-09,
  incluindo o primeiro `Boolean?` de negócio, `submerged`), FKs Restrict
  (cinturão do RF-11 futuro), bloco novo no FINAL do schema, back-relations
  `volumes` uniformes nos três pais.
- **Higiene de entrega**: sem BOM nos três arquivos (verificado `head -c3 |
  od`), `npx nx format:check --all` limpo, `npx prisma validate` ok,
  `migrate status` up to date e `migrate diff --from-config-datasource` sem
  diferença (zero drift banco ↔ schema), `nx run-many -t test lint -p api
  domain` verde (cache schema-aware via `sharedGlobals`).
- **README realinhado corretamente**: a célula nova mais larga obrigou o
  Prettier a realinhar a tabela inteira — feito de uma vez, sem reprovar no
  gate de formatação (a série de reincidências desse major segue quebrada).

## Conformidade com Padrões

| Padrão                  | Status |
| ----------------------- | ------ |
| Padrões de Código       | ⚠️ Minor (identificador de 32 chars, desvio aceito) |
| Typescript/Node.js      | ✅ Ok (n/a neste grupo — sem código TS) |
| Angular/NestJS/React    | ✅ Ok (n/a neste grupo) |
| REST/HTTP               | ✅ Ok (n/a neste grupo) |
| Testes                  | ✅ Ok (grupo de schema/nomenclatura; suíte existente verde, testes dos recursos chegam nos grupos 3–5) |
| Logging/Monitoramento   | ✅ Ok (n/a neste grupo) |

## Recomendações

1. (Minor 1) Escrever o rótulo da faixa de NSPT por extenso no README —
   correção de uma linha, pode entrar no commit do grupo.
2. (Minor 3) Ajustar a frase de identidade do tipo de fundação no proposal
   quando a change for atualizada (não bloqueia; design e spec já estão
   corretos e o schema os segue).
3. (Registro) Manter `allowableCompressionStressKgfCm2` como está — desvio da
   regra de 30 chars aceito por ser nome canônico com sufixo de unidade;
   reavaliar apenas se a validação §02 das unidades renomear a coluna.
4. (Para os grupos 3–5) O comentário do schema promete `nsptMin < nsptMax`
   garantido na API — o cenário "faixa invertida" do spec e a validação do DTO
   (task 3.1) são o pagamento dessa promessa; a review dos próximos grupos deve
   conferir também a mensagem pt-BR e a ordem formato→positivo→escala.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero críticos e zero majors; o modelo de dados
está fiel ao design D1 (precisões, uniques, índices, FKs, anulabilidade),
verificado contra o banco real sem drift nem truncamento de nomes, e o mapa de
nomenclatura cobre todos os termos do D5 antes de qualquer código. Os três
minors são de documentação/rotulagem e não bloqueiam: o grupo pode ser
commitado (staging explícito por caminho: `README.md`, `prisma/schema.prisma`,
`prisma/migrations/20260825102737_add_soil_foundation_catalogs/`,
`openspec/changes/catalogo-solos-fundacoes/`), idealmente já com a correção de
uma linha do minor 1. Prosseguir para o grupo 2 (contratos na domain).
