# Review do Grupo 1 — Nomenclatura, domain e modelo de dados

**Revisor**: AI Code Reviewer
**Data**: 2026-09-29
**Change / Grupo**: viabilidade-lote-licitante / grupo 1 (tasks 1.1–1.4)
**Status**: Aprovado com observações

## Resumo

O grupo entrega a base do módulo M13: mapa canônico no README (11 termos novos), contratos `viability.ts`, derivações puras `viability-derivations.ts` (fator de recuperação de capital, anuidade, RAP bruta mínima, deságio máximo suportado e o parecer composto `assessViability`), campo `bidderCapex` nos três contratos de oferta, modelo `ViabilityParameterVersion` (singleton versionado, padrão rainfall) e coluna `bidder_capex` em `offer_revision` com migration aditiva.

Qualidade geral muito alta. **Todos os valores canônicos do spec foram reproduzidos por esta review com um script decimal.js independente** (CRF `0.0888274`, anuidade `365080751.22`, RAP mínima `496657825.69`, deságio máximo `34.88`, deságios `21.32`/`47.55`, margens `13.56`/`-12.67`, negativo `-4.90`) — todos batem. Verifiquei em runtime que o `Decimal.clone({ precision: 40 })` **não vaza**: `Decimal.precision` global permanece 20 após importar o módulo (mesmo precedente do `EngineDecimal` precision 34 do calc-engine). Null-safety RNF-09 exemplar: entrada inválida ≡ ausente, `missingInputs` tipado com mensagens delegadas às bordas.

Único apontamento estrutural (major): desvios pontuais dos padrões de código do workspace nas assinaturas/tamanho das funções — barato de corrigir agora, antes de o grupo 2 consumir as assinaturas na API.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `README.md` (mapa canônico, +11 linhas) | ✅ Ok | 1 minor |
| `libs/domain/src/lib/viability/viability.ts` | ✅ Ok | 0 |
| `libs/domain/src/lib/viability/viability-derivations.ts` | ⚠️ Problemas | 1 major, 1 minor |
| `libs/domain/src/lib/viability/viability-derivations.spec.ts` | ⚠️ Problemas | 2 minors |
| `libs/domain/src/lib/offers/offers.ts` | ✅ Ok | 0 |
| `libs/domain/src/index.ts` | ✅ Ok | 0 |
| `prisma/schema.prisma` | ✅ Ok | 0 |
| `prisma/migrations/20260929100720_viability_parameters_and_bidder_capex/migration.sql` | ✅ Ok | 0 |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

**MAJ-1 — Desvios dos padrões de código nas funções de derivação** (`viability-derivations.ts:70-75`, `119-180`, `125-134`, `86-88`)

Três desvios correlatos, resolvíveis com um único refactor estrutural:

1. **`minimumGrossRap` tem 4 parâmetros** (`annuity, pisCofinsPercent, operationMaintenancePercent, incomeTaxPercent`) — o padrão do workspace limita a 3 (objeto a partir daí). O design D2 prescreveu essa assinatura literalmente, mas o design não sobrepõe o padrão de código, e nenhuma outra função da domain passa de 3. Como o grupo 2 ainda não consumiu a assinatura, este é o momento barato de corrigir.
2. **`assessViability` tem ~57 linhas de corpo** (limite: 50) — o excesso vem da resolução do investimento base inline.
3. **Non-null assertions `inputs.bidderCapex!` / `inputs.estimatedCapex!`** (linhas 129/131) e o cast `factor as Decimal` (linha 87) — corretos pelo invariante de `decimalOrNull`, mas o invariante vive na cabeça do leitor, não no tipo.

Correção sugerida (resolve os três de uma vez, sem mudar comportamento — os 20 testes continuam válidos com ajuste mecânico de chamada):

```ts
function validDecimalStringOrNull(value: string | null | undefined): string | null {
  return value != null && POSITIVE_DECIMAL_PATTERN.test(value) ? value : null;
}

export function minimumGrossRap(
  annuity: string | null | undefined,
  deductions: Pick<
    ViabilityParameters,
    'pisCofinsPercent' | 'operationMaintenancePercent' | 'incomeTaxPercent'
  >,
): string | null {
  const base = decimalOrNull(annuity);
  const pisCofins = decimalOrNull(deductions.pisCofinsPercent);
  const operationMaintenance = decimalOrNull(deductions.operationMaintenancePercent);
  const incomeTax = decimalOrNull(deductions.incomeTaxPercent);
  if (base === null || pisCofins === null || operationMaintenance === null || incomeTax === null) {
    return null;
  }
  // ... laço sem cast
}

// em assessViability:
const bidderCapex = validDecimalStringOrNull(inputs.bidderCapex);
const estimatedCapex = validDecimalStringOrNull(inputs.estimatedCapex);
const investmentBase = bidderCapex ?? estimatedCapex;
const investmentSource =
  bidderCapex !== null ? 'BIDDER' : estimatedCapex !== null ? 'ANEEL_ESTIMATE' : null;
```

O helper elimina as assertions, o objeto `deductions` elimina o 4º parâmetro e o cast, e a extração encolhe `assessViability` para dentro do limite.

### 🟢 Problemas Minor

**MIN-1 — Saída `'-0.00'` possível em `maxSupportableDiscountPercent`** (`viability-derivations.ts:107-110`)

Quando a RAP mínima excede a máxima por menos de 0,005 p.p., `toFixed(2)` produz `'-0.00'`. Verifiquei em runtime que `new Decimal('-0.00').isNegative()` é `true` no decimal.js, então o veredito `viableAtMaxRap: false` fica **correto** (mínima > máxima é de fato inviável) — o problema é só cosmético: o painel exibiria "-0,00%". Tratar na formatação da web (grupo 3) ou normalizar o zero negativo na saída (`.toFixed(2).replace(/^-(0\.00)$/, '$1')` ou equivalente com Decimal). Registrar para o grupo 3 é suficiente.

**MIN-2 — Lacunas pontuais de teste** (`viability-derivations.spec.ts`)

- O fallback com `bidderCapex` **malformado** (ex.: `'abc'`) caindo para `estimatedCapex` com origem `ANEEL_ESTIMATE` não é exercitado — é um branch real (inválido ≡ ausente em `decimalOrNull`) e é a semântica que o grupo 2 vai herdar; o teste atual só cobre `bidderCapex: null`.
- No teste "RAP mínima acima do teto" (linha 155), `discountMarginPoints: null` com `maxSupportableDiscountPercent` presente não é assertado (o caso todo-null cobre a outra ponta, mas não a combinação parcial).

**MIN-3 — Asserção numérica via `Number()` em valor de negócio** (`viability-derivations.spec.ts:161`)

`expect(Number(assessment.maxSupportableDiscountPercent)).toBeLessThan(0)` converte o decimal de negócio para float na asserção. Para a checagem de sinal é inócuo, mas o padrão RNF-08 pede vigilância — preferir `expect(assessment.maxSupportableDiscountPercent!.startsWith('-')).toBe(true)` ou assertar o literal exato (que aliás está determinado: `-94.55...` para 9 bi).

**MIN-4 — README: par `ViabilityAssessment` / `viability` foge do padrão da tabela** (`README.md:302`)

Nas demais linhas o segundo termo é a tabela snake_case; aqui `viability` é o contexto/rota da API. Inócuo, mas vale um qualificador na célula (ex.: `viability` (contexto/rota)) quando o grupo 2 materializar a rota — como já se faz em "deságio publicado (%) … (histórico de leilões)".

## ✅ Destaques Positivos

- **Valores canônicos verificados de forma independente**: reproduzi toda a cadeia (CRF → anuidade → RAP mínima → deságio máximo → margens) com script decimal.js separado; os 8 literais dos testes batem exatamente. O encadeamento com arredondamento intermediário (anuidade `toFixed(2)` alimentando a RAP mínima) é o mesmo do spec — testes e pipeline são coerentes entre si.
- **`Decimal.clone({ precision: 40 })` local está correto e não vaza**: `Decimal.precision` global permanece 20 após o import (verificado em runtime); precisão 40 é mais que suficiente para `(1.08)^30` com saída a 2 casas; o padrão segue o precedente `EngineDecimal` (precision 34) do calc-engine.
- **Reuso de `discountPercent` de `offer-derivations`** para o deságio pretendido: garante que o painel do M13 exiba exatamente o mesmo número que o cabeçalho da oferta (uma única implementação, RNF-08) — e `discountMarginPoints` subtrai os valores **já arredondados**, então a aritmética exibida fecha visualmente (34.88 − 21.32 = 13.56).
- **Null-safety RNF-09 exemplar**: entrada inválida tratada como ausente, nunca zero; `missingInputs` como union tipada com mensagens pt-BR delegadas às bordas (mesmo padrão de `ScheduleWarningCode`); teste do caso vazio trava o objeto inteiro com `toEqual`.
- **Guardas matemáticas completas**: WACC zero (divisão por zero no CRF), prazo não inteiro/`< 1`, fator de dedução ≥ 100% (produto líquido ≤ 0) e RAP máxima zero — todos viram null com teste.
- **Schema e migration fiéis ao design D1**: espelho exato da tabela do design, padrão singleton do rainfall (`effective_from @unique @db.Date`), migration puramente aditiva, `prisma generate` proativo (o client gerado já contém o modelo — lição das changes anteriores) e `migrate status` em dia.
- **README no padrão consolidado**: derivados sem coluna snake_case (precedente `contractualDeadlineDate`/`discountPercent`), `pisCofinsPercent` coerente com o módulo tributário existente.
- **Higiene impecável**: BOM ausente nos 3 arquivos novos (verificado byte a byte), `nx format:check --all` limpo, código em inglês com comentários/testes pt-BR, contratos aditivos sem quebra (suíte da api verde sem cache).

## Conformidade com Padrões

| Padrão | Status |
|--------|--------|
| Padrões de Código | ⚠️ Problemas (MAJ-1: 4 params / ~57 linhas / non-null assertions) |
| Typescript/Node.js | ✅ Ok (sem `any`; casts pontuais cobertos pelo MAJ-1) |
| Angular/NestJS/React | ✅ Ok (n/a neste grupo) |
| REST/HTTP | ✅ Ok (n/a neste grupo) |
| Testes | ✅ Ok (20 testes novos, 170/170 domain verdes sem cache; lacunas pontuais em MIN-2/MIN-3) |
| Logging/Monitoramento | ✅ Ok (n/a — funções puras) |

Verificações executadas nesta review: `npx nx run-many -t test lint -p domain --skip-nx-cache` (170 testes verdes), `npx nx run-many -t test build -p api --skip-nx-cache` (verde), `npx nx format:check --all` (limpo), `npx prisma validate` + `npx prisma migrate status` (17 migrations, banco em dia), script decimal.js independente para os valores canônicos, checagem de BOM e de vazamento da precisão global.

## Recomendações

1. **(MAJ-1, antes do grupo 2)** Refatorar `minimumGrossRap` para receber o objeto `deductions` (Pick de `ViabilityParameters`) e extrair a resolução do investimento base de `assessViability` para um helper `validDecimalStringOrNull` — elimina de uma vez o 4º parâmetro, as non-null assertions, o cast `as Decimal` e o excesso de linhas. O momento é agora: o grupo 2 vai fixar essas assinaturas na API.
2. **(MIN-2, junto com o item 1)** Acrescentar o teste do fallback com `bidderCapex` malformado (`'abc'` → origem `ANEEL_ESTIMATE`) e assertar `discountMarginPoints: null` no cenário do teto sem RAP vencedora.
3. **(MIN-1, registrar para o grupo 3)** Tratar a exibição de `'-0.00'` na formatação pt-BR do painel (ou normalizar o zero negativo na saída da derivação).
4. **(MIN-3, oportunista)** Trocar a asserção via `Number()` por checagem de string/literal exato.
5. **(MIN-4, no grupo 2)** Qualificar a célula `viability` do README quando a rota do contexto existir.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero críticos. A matemática está correta e verificada de forma independente, a null-safety é exemplar, o modelo de dados segue os precedentes à risca e todas as verificações automatizadas passam sem cache. O único major é estrutural e barato (assinaturas ainda não consumidas por ninguém): recomendo aplicar o item 1 das recomendações **antes de iniciar o grupo 2**, aproveitando para fechar o item 2. Os demais minors podem seguir nos grupos indicados. Com o item 1 aplicado, o grupo está pronto para commit.

---

## Resolucao (pos-review, antes do commit do grupo)

- **MAJ-1 corrigido**: minimumGrossRap passou a receber ViabilityDeductions (Pick dos 3 fatores — 2 parametros), non-null assertions eliminadas via validDecimalStringOrNull, e assessViability enxugado com resolveInvestmentBase extraido.
- **MIN-2 corrigido**: testes novos — bidderCapex malformado recua ao CAPEX ANEEL; discountMarginPoints null com desagio maximo presente.
- **MIN-3 corrigido**: assercao por startsWith('-') em vez de Number().
- MIN-1 ('-0.00' na exibicao — tratar no grupo 3) e MIN-4 (celula viability do README — qualificar no grupo 2) registrados.
