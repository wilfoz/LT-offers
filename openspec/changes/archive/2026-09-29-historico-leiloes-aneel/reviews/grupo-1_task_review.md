# Review do Grupo 1 — Nomenclatura, domain e modelo de dados

**Revisor**: AI Code Reviewer
**Data**: 2026-09-28
**Change / Grupo**: historico-leiloes-aneel / grupo 1 (tasks 1.1–1.4)
**Status**: Aprovado com observações

## Resumo

Primeiro grupo da primeira integração com dados públicos da ANEEL: mapa canônico e
seção de integrações no README (1.1), contratos e funções puras de normalização na
domain com 31 testes (1.2–1.3) e modelo snapshot + log imutável no Prisma com
migration aditiva (1.4). A entrega é fiel aos designs D1 e D2, aplica de primeira as
lições institucionais (round-trip de data civil via `isValidCivilDate`, decimal como
string — RNF-08, null ≠ zero — RNF-09) e chega limpa em todos os gates (146 testes da
domain, lint, `format:check --all`, `prisma validate`/`migrate status`, sem BOM em
nenhum dos arquivos tocados). Zero problemas críticos ou major; três minors, todos
sobre robustez do parser diante de variações não observadas do dataset — a serem
vigiados na primeira sincronização real (grupo 2).

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `README.md` | ✅ Ok | 0 |
| `libs/domain/src/lib/auction-history/auction-history.ts` | ✅ Ok | 0 |
| `libs/domain/src/lib/auction-history/auction-normalization.ts` | ⚠️ Problemas | 3 minors |
| `libs/domain/src/lib/auction-history/auction-normalization.spec.ts` | ✅ Ok | 0 |
| `libs/domain/src/index.ts` | ✅ Ok | 0 |
| `prisma/schema.prisma` | ✅ Ok | 0 |
| `prisma/migrations/20260929001813_auction_history_snapshot/migration.sql` | ✅ Ok | 0 |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

1. **`parseAneelDecimal` — ramo numérico sem validação de padrão**
   (`auction-normalization.ts:27-29`). O ramo `typeof value === 'number'` devolve
   `String(value)` direto, sem passar pelo `DECIMAL_RESULT_PATTERN` aplicado ao ramo
   de texto. Um número em notação de expoente (`1e21` → `"1e+21"`, `1e-7` → `"1e-7"`)
   escaparia como string fora do contrato "string decimal" (o `Decimal` aceita, mas o
   `DECIMAL(16,2)` do banco não, e a violação seria detectada só na inserção). Risco
   real baixíssimo — no dataset os campos de valor são texto e os numéricos chegam
   como inteiros — mas o endurecimento custa uma linha:

   ```ts
   if (typeof value === 'number') {
     if (!Number.isFinite(value)) return null;
     const text = String(value);
     return DECIMAL_RESULT_PATTERN.test(text) ? text : null;
   }
   ```

2. **Ambiguidade de milhar com ponto sem vírgula**
   (`auction-normalization.ts:32-35`). O separador de milhar só é removido quando há
   vírgula. Um valor publicado como `"1.500"` (milhar sem casas decimais) casaria com
   o `DECIMAL_RESULT_PATTERN` e viraria `1.5` silenciosamente — o único caminho do
   normalizador que produz valor errado em vez de `null`. A decisão está documentada
   no docblock e é coerente com as amostras verificadas (decimais sempre com vírgula),
   mas é inerente à ambiguidade da fonte: registrar como item de observação na
   primeira sincronização real (grupo 2 / task 4.3), por exemplo conferindo
   `MdaSubEstacoesMVA` e `MdaExtensaoLinhaTransmissaoKm` de lotes conhecidos.

3. **`fractionToPercent` sem limite superior × `DECIMAL(5,2)`**
   (`auction-normalization.ts:42-48` + `schema.prisma` `discountPercent`). Se a fonte
   publicar `PctDesagio` já em percentual por engano (`"48"` em vez de `"0,48"`), a
   função devolve `"4800.00"`, que estoura o `DECIMAL(5,2)` na inserção — a
   sincronização abortaria (snapshot preservado, comportamento correto), porém com
   erro genérico do Prisma em vez de mensagem pt-BR. Tratar no grupo 2: ou mapear o
   overflow numérico do Prisma para a exceção de domínio de "resposta fora do esquema
   esperado", ou validar o intervalo plausível (0–100) na normalização.

## ✅ Destaques Positivos

- **Lição institucional de datas aplicada de primeira**: `parseAneelDate` extrai o
  prefixo `AAAA-MM-DD` do ISO com timestamp (sem `new Date(text)` e sem rollover),
  converte `dd/mm/aaaa` e valida por round-trip com o `isValidCivilDate` já existente
  em `calendar/work-calendar.ts` — o teste cobre `"30/02/2024"` → null. O ponto fraco
  recorrente do projeto chegou blindado no primeiro grupo.
- **RNF-09 levado a sério no lote deserto**: `winnerName === null` força
  `winningRap`/`discountPercent` a null **mesmo quando a fonte publica `"0"`** — o
  zero da fonte em lote sem vencedor é placeholder, não valor de negócio. O teste
  exercita exatamente `VlrRAPVencedorLeilao: '0'` e `PctDesagio: '0'`. Decisão
  correta e alinhada ao cenário do spec; o caso legítimo (vencedor com deságio zero)
  continua funcionando (`fractionToPercent('0')` → `"0.00"`).
- **Abortar em vez de descartar em silêncio**: registro sem identidade mínima (ano,
  leilão, lote, empreendimento) → `null`, com o docblock explicitando que a
  sincronização deve abortar — coerente com o cenário "resposta fora do esquema
  esperado" do spec. A responsabilidade do abort fica no use case do grupo 2 (task
  2.4 já prevê o teste).
- **Armadilha da vírgula dupla coberta**: `"12,34,56"` → após a normalização sobra
  uma vírgula, o padrão rejeita e devolve null — teste presente.
- **Schema fiel ao D1, byte a byte**: precisões (12,3 / 12,2 / 16,2 / 5,2), anuláveis,
  `@db.Date` na data do leilão, `VarChar(15)`/`VarChar(30)`, FK com `onDelete:
  Cascade`, índice `(auction_number, lot_number)` **sem unique** (decisão registrada
  com rationale — multiplicidade aparece na consulta em vez de derrubar a
  importação); nome de índice auto-gerado com 44 chars, longe do limite de 63.
  Migration aditiva e `migrate status` limpo.
- **Nomenclatura consistente com o precedente**: funções de derivação pura com nome
  substantivo (`auctionBenchmark`) seguem o padrão de `offer-derivations`
  (`discountPercent`, `contractualDeadlineDate`); `discountPercent` duplicado no mapa
  canônico do README vem desambiguado por contexto ("histórico de leilões").
- **Benchmark com semântica de null correta**: lista vazia e "só desertos" devolvem
  contagens reais e estatísticas null (nunca zero); média com `Decimal` half-up e
  duas casas, deserto contado por `winnerName === null` (lote com vencedor mas sem
  deságio publicado não é contado como deserto).
- **Higiene Windows**: nenhum BOM nos 6 arquivos (verificado `head -c3 | od`);
  `format:check --all` exit 0 — a série de reincidências do gate de formatação segue
  quebrada.

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ✅ Ok |
| Typescript/Node.js | ✅ Ok |
| Angular/NestJS/React | ✅ Ok (n/a neste grupo) |
| REST/HTTP | ✅ Ok (n/a neste grupo) |
| Testes | ✅ Ok |
| Logging/Monitoramento | ✅ Ok (n/a neste grupo) |

## Recomendações

1. (MIN-1) Passar o ramo numérico de `parseAneelDecimal` pelo mesmo
   `DECIMAL_RESULT_PATTERN` do ramo de texto — uma linha, fecha a única porta para
   string fora do contrato.
2. (MIN-3) No grupo 2, garantir que overflow numérico na inserção (ex.
   `discountPercent` > 999.99) caia na exceção de domínio com mensagem pt-BR de
   "resposta fora do esquema esperado" — ou validar intervalo 0–100 na normalização.
3. (MIN-2) Na primeira sincronização real (task 4.3), conferir amostras de campos
   numéricos publicados sem vírgula (`"1.500"`?) contra o snapshot gravado; se a
   fonte usar milhar sem decimais, revisitar a heurística do separador.
4. Grupo 2: ao persistir `auctionDate` (string `AAAA-MM-DD`) na coluna `@db.Date`,
   construir a data em UTC (`new Date(\`${text}T00:00:00.000Z\`)` ou helper
   `civil-date.ts`) — nunca `new Date(text)` com fuso local (ponto fraco recorrente
   do projeto).

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero problemas críticos ou major; os três minors são
endurecimentos de robustez contra variações não observadas do dataset — MIN-1 é uma
linha e pode entrar junto com o grupo 2; MIN-2 e MIN-3 viram itens de vigilância da
sincronização real. O grupo 1 está pronto para commit e o grupo 2 pode iniciar sobre
esta base.

---

## Resolucao (pos-review, antes do commit do grupo)

- **MIN-1 corrigido**: ramo numerico de parseAneelDecimal valida contra DECIMAL_RESULT_PATTERN (expoente/NaN -> null); teste adicionado.
- **MIN-2** (milhar com ponto sem virgula vira decimal errado) registrado como vigilancia da 1a sincronizacao real.
- **MIN-3** (fractionToPercent sem teto x DECIMAL(5,2)) sera tratado no grupo 2: sync valida desagio em [0,100] antes de inserir e aborta com mensagem pt-BR.
