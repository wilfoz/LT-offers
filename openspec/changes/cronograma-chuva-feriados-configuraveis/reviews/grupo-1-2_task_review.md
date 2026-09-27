# Review dos Grupos 1 e 2 — Nomenclatura/modelo de dados e Contratos/funções puras de domínio

**Revisor**: AI Code Reviewer
**Data**: 2026-09-27
**Change / Grupo**: cronograma-chuva-feriados-configuraveis / grupos 1 (tasks 1.1–1.5) e 2 (tasks 2.1–2.4)
**Status**: APROVADO COM OBSERVAÇÕES

## Resumo

Os grupos entregam a fundação da change: mapa canônico no README (13 termos), os dois catálogos singleton só-versões no Prisma (`RainfallParameterVersion` + filhas `RainfallSeverityBand`/`RainfallUfRow`; `WorkCalendarVersion` + filha `Holiday`) conforme o design D1, a migration aditiva, o seed idempotente da versão inicial retroativa (D5) e os contratos + funções puras em `libs/domain` (`schedule/rainfall-parameters.ts`, `calendar/work-calendar.ts`) com 88 testes da domain verdes.

Qualidade alta. As três verificações mais críticas para a paridade numérica foram confirmadas de forma independente nesta review:

1. **Paridade da matriz** — comparação programática das 27 UFs × 12 meses entre `DEFAULT_PRECIPITATION_MM_BY_UF` (domain) e `DEFAULT_PRECIPITATION_BY_UF` (calc-engine): **zero divergências**.
2. **Semântica de fronteira** — a decisão deliberada de faixa inclusiva com 1ª faixa em `49.9` reproduz exatamente o `classifyLevel` histórico (`< 50` / `≤ 100` / `≤ 200` / `≤ 300` / aberta) na escala de 1 casa decimal do banco (`Decimal(6,1)`); os testes de fronteira cobrem 49.9→1, 50→2, 100→2, 200→3, 300→4, 310→5 — incluindo os valores exatos presentes na matriz (ES abr=100, PR jan=200, AM abr=300).
3. **Reformat do seed é semanticamente neutro** — provado formatando a versão `HEAD` de `prisma/seed.ts` com o Prettier do projeto e diffando contra a atual: o diff contém **apenas adições** (imports novos + seção 1.11), nenhuma linha removida ou alterada.

Zero problemas críticos e zero majors; 5 minors (nenhum bloqueia os grupos seguintes).

## Arquivos Revisados

| Arquivo                                                                          | Status       | Problemas |
| -------------------------------------------------------------------------------- | ------------ | --------- |
| README.md                                                                         | ✅ Ok        | 0         |
| prisma/schema.prisma                                                              | ⚠️ Problemas | 1 minor   |
| prisma/migrations/20260927102519_add_rainfall_parameters_and_work_calendar/migration.sql | ✅ Ok | 0         |
| prisma/seed.ts                                                                    | ✅ Ok        | 0         |
| libs/domain/src/lib/schedule/rainfall-parameters.ts                               | ⚠️ Problemas | 3 minors  |
| libs/domain/src/lib/schedule/rainfall-parameters.spec.ts                          | ✅ Ok        | 0         |
| libs/domain/src/lib/calendar/work-calendar.ts                                     | ✅ Ok        | 1 minor (nota) |
| libs/domain/src/lib/calendar/work-calendar.spec.ts                                | ✅ Ok        | 0         |
| libs/domain/src/index.ts                                                          | ✅ Ok        | 0         |

## Verificações Executadas

| Verificação                                        | Resultado |
| -------------------------------------------------- | --------- |
| `npx nx run-many -t test lint -p domain --skip-nx-cache` | ✅ 12 suítes / 88 testes verdes; lint 0 erros (2 warnings pré-existentes em `export-contracts.spec.ts`, fora do escopo) |
| `npx nx format:check --all`                         | ✅ para os arquivos deste grupo (as 10 reprovações listadas são pré-existentes: componentes `apps/web/src/app/offers/*` e `camp.ts`/`foundation-quantities.ts`/`quote.ts` — nenhum tocado nesta change; ver Recomendação 4) |
| `npx prisma migrate status`                         | ✅ 14 migrations, schema up to date |
| BOM UTF-8 nos 4 arquivos novos da domain (`head -c3 \| od`) | ✅ ausente (`69 6d 70` = `imp`) |
| Paridade matriz domain × calc-engine (script)       | ✅ 27×12 idênticas |
| Reformat do seed (Prettier sobre HEAD vs atual)     | ✅ diff só com adições |
| Dados no banco (container `lt-offers-postgres`)     | ✅ 1 versão de chuva (2020-01-01, autor `sistema@...`), 5 faixas (49.9/100/200/300/null com 1.0000/0.9500/0.8500/0.7500/0.6500), 27 uf_rows (MG/ES/AM conferidos por amostragem), 1 versão de calendário (22.00, `{0,6}`), 9 feriados recorrentes nacionais |
| Limite de 63 chars nos identificadores Postgres     | ✅ maior nome auto-gerado: `rainfall_severity_band_rainfall_parameter_version_id_fkey` (58); unique explícito onde o auto estouraria (`..._version_id_position_key` teria 65) |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

**MIN-1 — `classifyRainfallBand` compara limites via `Number()` (float) e recebe `precipitationMm: number`**
`libs/domain/src/lib/schedule/rainfall-parameters.ts:529-544`
Os contratos trafegam strings decimais (RNF-08), mas a classificação converte para `number` e o parâmetro de entrada já é `number`. Para comparação (não aritmética) na escala de 1 casa persistida em `Decimal(6,1)` isso é exato e consistente com o `parseFloat` do motor atual — não há bug hoje. Porém, no refit do grupo 3 o motor vai chamar essa função com valores vindos do banco como `Prisma.Decimal`/string; recomenda-se aceitar `string` (ou `string | number`) e comparar via `DecimalValue`/comparação de string normalizada, eliminando o ponto de flutuação da fronteira de uma vez.

**MIN-2 — `validateRainfallParameters` não detecta `position` duplicada entre faixas**
`libs/domain/src/lib/schedule/rainfall-parameters.ts:575-620`
Duas faixas com a mesma `position` passam pela validação estrutural (o sort por posição é ambíguo no empate e a classificação pode escolher a faixa "errada" entre as duas). Hoje o unique do banco (`rainfall_severity_band_version_position_key`) pega na persistência via P2002, mas a violação chegaria como 409 genérico em vez de 400 estruturado. Sugestão: adicionar violação `{ code: 'band-position-duplicated'; position }` no mesmo laço que já ordena as faixas.

**MIN-3 — Nome explícito de índice onde o auto-gerado não estoura os 63 chars**
`prisma/schema.prisma` (modelo `RainfallUfRow`, `@@unique(..., map: "rainfall_uf_row_version_uf_key")`)
O critério da task 1.4 (e o precedente de catalogo-isoladores) é nome explícito SÓ onde o auto-gerado passa de 63 caracteres. O auto de `RainfallUfRow` teria 52 chars (`rainfall_uf_row_rainfall_parameter_version_id_uf_key`) — o map é desnecessário. Em `RainfallSeverityBand` o explícito é correto (auto teria 65). Simetria entre as duas irmãs é defensável, mas registra-se o desvio do critério declarado. Não vale migration só para isso; alinhar se houver outra migration na change.

**MIN-4 — `UF_METADATA_MAP` agora existe em duplicidade (domain × calc-engine)**
`libs/domain/src/lib/schedule/rainfall-parameters.ts:50-83` × `libs/calc-engine/src/lib/schedule/precipitation-calculator.ts:14-47`
Conteúdo idêntico (nome e região das 27 UFs). A duplicação é transitória por construção — o grupo 3 refita o `PrecipitationCalculator` — mas a task 3.1 só menciona remover `DEFAULT_PRECIPITATION_BY_UF`, `classifyLevel` e `PRODUCTIVITY_FACTORS_BY_LEVEL`. Garantir no grupo 3 que o calc-engine passe a importar `UF_METADATA_MAP`/`BRAZILIAN_UFS` da domain (a fronteira `calc-engine → domain` já é usada, ex. `BrazilianRegion`).

**MIN-5 — `DEFAULT_RAINFALL_SEVERITY_BANDS` com 31 caracteres (> 30 do padrão)**
`libs/domain/src/lib/schedule/rainfall-parameters.ts:117`
Um caractere acima do limite de nomenclatura do projeto. Precedente de desvio aceito por nome canônico existe (`allowableCompressionStressKgfCm2`, 32); registrado apenas para rastreabilidade — não se pede mudança.

**Nota (não contabilizada)** — `civilMonthOfProjectMonth` (`work-calendar.ts:104-112`) assume `scheduleStartDate` válida; uma string malformada propaga `NaN` silenciosamente. Coerente com D2 (validação é da borda), mas o grupo 3/4 deve garantir que a data passe por `isValidCivilDate` antes de chegar à função — vale um teste no consumidor.

## ✅ Destaques Positivos

- **Paridade numérica tratada como requisito de primeira classe e provada por teste**: fronteiras 49.9/50/100/200/300 parametrizadas em `it.each`, série de MG assertada valor a valor, defaults validados estruturalmente sem violações, e a decisão da 1ª faixa em `49.9` documentada no próprio contrato com a justificativa da escala.
- **Fonte única real**: o seed consome `DEFAULT_RAINFALL_PARAMETERS`/`DEFAULT_WORK_CALENDAR` da domain via import relativo, com comentário justificando por que o alias de tsconfig não funciona ali — nenhuma cópia dos valores.
- **Funções de calendário puras de verdade**: nenhum `new Date()` sem argumento (nenhuma leitura de relógio); toda aritmética em meia-noite UTC sobre entradas; `isValidCivilDate` com round-trip rejeitando 2027-02-30 e 2026-13-45 sem rollover.
- **Casos de borda de calendário excepcionalmente bem cobertos**: feriado recorrente em 29/02 só em ano bissexto, feriado em domingo sem dupla contagem, feriado nacional + estadual no mesmo dia descontando um único dia, virada de ano na ancoragem do mês do projeto, guarda `all-weekdays-non-working`.
- **Violações tipadas com código + contexto** (`uf`, `position`, `month`, `index`) e mensagens pt-BR delegadas à borda — exatamente o padrão da base de catálogos (`decimalScaleViolation`).
- **Seed idempotente e correto em datas**: check-then-create por `effectiveFrom` para cada catálogo de forma independente; datas `@db.Date` gravadas como meia-noite UTC (evita o bug recorrente de fuso BRT); dados conferidos no banco.
- **Modelo fiel ao design D1** (singleton só-versões, `effectiveFrom @unique`, filhas imutáveis via nested create) e `Holiday` com `@@index` no FK onde não há unique composto cobrindo.
- **Reformat do seed entregue de forma auditável** — separável do conteúdo novo e provadamente neutro.

## Conformidade com Padrões

| Padrão                          | Status |
| ------------------------------- | ------ |
| Padrões de Código               | ✅ Ok (MIN-5 registrado, desvio de 1 char) |
| Typescript/Node.js              | ✅ Ok (sem `any`, contratos tipados, violações discriminadas) |
| Prisma/Modelo de dados          | ✅ Ok (MIN-3 cosmético) |
| Decimal nunca float (RNF-08)    | ✅ Ok nos contratos/persistência (MIN-1: comparação via `Number` na classificação — exata na escala atual) |
| null ≠ zero (RNF-09)            | ✅ Ok (`upperLimitMm: null` só na faixa aberta; UF ausente é violação, nunca zero) |
| Testes                          | ✅ Ok (88 verdes; cenários dos 2 specs de catálogo cobertos na camada domain) |
| Formatação (Prettier/format:check) | ✅ Ok nos arquivos do grupo |

## Recomendações

1. (Grupo 3) Ao refitar o `PrecipitationCalculator`, mudar a assinatura de `classifyRainfallBand` para aceitar string decimal (ou comparar via `DecimalValue`) — resolve MIN-1 no ponto de consumo — e fazer o calc-engine importar `UF_METADATA_MAP`/`BRAZILIAN_UFS` da domain, eliminando a duplicação MIN-4.
2. (Grupo 2, oportunista) Adicionar a violação `band-position-duplicated` em `validateRainfallParameters` com teste (MIN-2) — mudança de ~6 linhas, fecha o único buraco estrutural da validação.
3. (Grupo 4) A validação de **escala** ficou deliberadamente fora da domain: os DTOs devem usar `decimalScaleViolation` com as escalas das colunas — fator 4 casas (`Decimal(5,4)`), mm 1 casa (`Decimal(6,1)`), dias padrão 2 casas (`Decimal(4,2)`). Sem isso, um limite `49.95` seria arredondado em silêncio pelo Postgres para `50.0`, mudando a semântica da fronteira histórica. Exigir também o teste de paridade DTO × contrato (task 4.2, lição MIN-1 de solos-fundações).
4. (Antes da task 6.1) Existem 10 arquivos **pré-existentes** reprovando em `npx nx format:check --all` (offers web + `camp.ts`/`foundation-quantities.ts`/`quote.ts`) — fora do escopo destes grupos, mas a task 6.1 vai esbarrar neles; formatá-los em commit próprio.
5. (Grupo 3/4) Testar no consumidor que `scheduleStartDate` passa por `isValidCivilDate` antes de `civilMonthOfProjectMonth` (nota sobre NaN).

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero críticos e zero majors — terceira entrega consecutiva de fundação (grupos 1) sem major. A paridade numérica, requisito central da change, foi provada por três vias independentes (matriz idêntica, fronteiras testadas com os valores exatos da matriz, seed conferido no banco). Os 5 minors não bloqueiam: MIN-2 é a única correção sugerida ainda dentro da change (barata); MIN-1/MIN-4 têm ponto natural de resolução no grupo 3; MIN-3/MIN-5 são registros. Pode prosseguir para o grupo 3 (refit do motor).
