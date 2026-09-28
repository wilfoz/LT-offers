# Review do Grupo 1 — Nomenclatura, domain e modelo de dados

**Revisor**: AI Code Reviewer
**Data**: 2026-09-28
**Change / Grupo**: identidade-leilao-e-prazos / grupo 1 (tasks 1.1–1.5)
**Status**: MUDANÇAS SOLICITADAS

## Resumo

O grupo 1 entrega a base da change: mapa canônico do README com os sete termos
novos e o enum de cinco status (task 1.1), campos novos nos contratos da domain
(task 1.2), as três derivações puras `discountPercent` /
`contractualDeadlineDate` / `scheduleWarnings` com `decimal.js` (task 1.3),
testes de unidade cobrindo todos os cenários exigidos (task 1.4) e o modelo
Prisma com migration aditiva conforme o design D4 (task 1.5).

A qualidade da implementação da domain é alta — derivações puras sem relógio,
null ≠ zero rigoroso, clamp de fim de mês com aritmética inteira de meses (sem
objeto `Date` na soma, eliminando o rollover silencioso), reuso de
`isValidCivilDate`/`daysInCivilMonth` e testes citando RN-02/RNF-08/RNF-09.
Porém, o grupo deixa o projeto **api sem compilar**: os três derivados foram
declarados **obrigatórios** em `OfferRevisionItem`, e o presenter da API (que
só será atualizado na task 2.5) não os fornece — duas suítes da api falham em
compilação (TS2739) e o gate do CI (`nx affected -t lint test build`)
reprovaria o commit do grupo isolado. Por isso o veredito é MUDANÇAS
SOLICITADAS, com correção pequena e três opções de fix descritas em C1.

## Resumo da Task

- **Contexto**: proposal — normalizar a identidade do leilão publicada pela
  ANEEL (`auctionNumber` NNN/AAAA, `lotNumber`, `subLotCode`) e os prazos do
  edital (`contractSigningDate`, `constructionDeadlineMonths`) na revisão da
  oferta; derivar data-limite contratual, deságio e alertas RN-02 em funções
  puras da domain (design D2); tornar `WON`/`IN_EXECUTION` persistíveis (D4).
- **Requisitos**: RF-01, RF-02, RN-02, RNF-08, RNF-09, RNF-14.
- **Dependências**: `daysInCivilMonth`/`isValidCivilDate` de
  `calendar/work-calendar.ts`; `POSITIVE_DECIMAL_PATTERN` de
  `catalogs/validation.ts`; 1ª dependência de `decimal.js` na domain (decisão
  D2 aceita no design).
- **Riscos previstos no design**: `ALTER TYPE ADD VALUE` em transação
  (mitigado: migration só adiciona valores, sem `UPDATE`), ampliação do que a
  domain carrega para a web (aceito).

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `README.md` | ✅ Ok | 0 |
| `libs/domain/src/lib/offers/offers.ts` | ❌ Crítico | 1 (C1) |
| `libs/domain/src/lib/offers/offer-derivations.ts` | ⚠️ Problemas | 2 (MIN-2, MIN-4) |
| `libs/domain/src/lib/offers/offer-derivations.spec.ts` | ⚠️ Problemas | 1 (MIN-3) |
| `libs/domain/src/index.ts` | ✅ Ok | 0 |
| `prisma/schema.prisma` | ⚠️ Problemas | 1 (MIN-1) |
| `prisma/migrations/20260928100615_offer_auction_identity_and_deadlines/migration.sql` | ✅ Ok | 0 |

## Problemas Encontrados

### ⛔ Problemas Críticos

**C1. Derivados obrigatórios em `OfferRevisionItem` quebram a compilação da
api antes do grupo 2**

- Arquivo: `libs/domain/src/lib/offers/offers.ts` (linhas 88–90) →
  `apps/api/src/contexts/offers/infrastructure/http/presenters/offer.presenter.ts:88`
- Os campos `contractualDeadlineDate: string | null`,
  `discountPercent: string | null` e `scheduleWarnings: ScheduleWarningCode[]`
  foram declarados **sem `?`** no contrato, mas quem fornece esses valores é o
  `OfferPresenter.toRevisionItem` — que só será alterado na task 2.5 (grupo 2).
  Resultado, verificado com `npx nx test api --skip-nx-cache`:

  ```
  offer.presenter.ts:88:5 - error TS2739: Type '{ ... }' is missing the
  following properties from type 'OfferRevisionItem':
  contractualDeadlineDate, discountPercent, scheduleWarnings
  ```

  Duas suítes falham em compilação (`offers.controller.spec.ts` e
  `context-modules-di.spec.ts`; 43/45 passam). O CI roda
  `npx nx affected -t lint test build` (`.github/workflows/ci.yml:49`) — test
  **e** build da api reprovariam o commit do grupo 1 isolado, quebrando a
  convenção do projeto de um commit por grupo com CI verde. A verificação do
  grupo rodou apenas `-p domain`, o que não pega o vazamento do contrato para
  a api.

- Correções possíveis (em ordem de preferência):
  1. **Tornar os três derivados opcionais no grupo 1** (`contractualDeadlineDate?:
     string | null;` etc., mantendo o comentário "derivados em leitura") e
     **apertar para obrigatórios na task 2.5**, no mesmo commit que atualiza o
     presenter — preserva a fronteira dos grupos e o contrato final do design D3
     fica idêntico;
  2. Antecipar para o grupo 1 a fiação mínima do presenter (3 linhas chamando
     `offer-derivations`) — funcional, mas antecipa metade da task 2.5 sem os
     testes dela;
  3. Commitar grupos 1 e 2 juntos — última opção, contraria o histórico de um
     commit por grupo.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

**MIN-1. Churn de reformatação no diff do `prisma/schema.prisma`**

- O realinhamento de colunas dos blocos `WorkCrewVersion` e `StakingTower` e a
  remoção das linhas em branco finais são colaterais do `prisma format`
  (canônicos e inócuos), mas poluem o diff do grupo com ~60 linhas não
  relacionadas à change. Aceitável; citar no corpo do commit ("inclui
  reformatação canônica do prisma format") para não confundir leitura futura
  do histórico.

**MIN-2. Funções de derivação sem verbo no nome**

- `offer-derivations.ts:41,69,100` — `discountPercent`,
  `contractualDeadlineDate` e `scheduleWarnings` violam o padrão "função
  começa com verbo". **Desvio consciente aceito**: o design D2 fixa esses
  nomes, e a derivação nomeada pelo valor derivado espelha 1:1 os campos do
  contrato (`OfferRevisionItem.contractualDeadlineDate` ← função homônima), o
  que facilita a fiação do presenter. Registrado para que a exceção não vire
  regra fora de derivações.

**MIN-3. Falta o teste do caso `winningRap = '0.00'` → deságio `'100.00'`**

- `offer-derivations.spec.ts` cobre RAP máxima zero → null, mas não o dual da
  RNF-09: RAP vencedora **informada como zero** é valor real e deve produzir
  `'100.00'`, não null. É exatamente a fronteira null ≠ zero que a função
  implementa corretamente (o `POSITIVE_DECIMAL_PATTERN` aceita `0.00` e só a
  máxima passa por `isZero()`), mas sem teste ela fica desprotegida contra uma
  futura "simplificação" que rejeite zero nas duas pontas. Sugestão:

  ```typescript
  it('deve calcular 100.00 quando a RAP vencedora informada é zero (zero ≠ ausente)', () => {
    expect(discountPercent('100.00', '0.00')).toBe('100.00');
  });
  ```

**MIN-4. `catalogs/validation.ts` consolidado como validação genérica sob o
caminho errado**

- `offer-derivations.ts:9` importa `POSITIVE_DECIMAL_PATTERN` de
  `../catalogs/validation` — 3º consumidor fora de catálogos (calendar já
  importa `DATE_PATTERN` e `POSITIVE_DECIMAL_PATTERN`, `work-calendar.ts:1`).
  Pela regra das três ocorrências, os patterns genéricos merecem um caminho
  neutro (ex.: `lib/shared/validation.ts` com reexport em `catalogs/` para não
  quebrar imports). Cosmético, não bloqueia; candidato a housekeeping em change
  futura.

## ✅ Destaques Positivos

- **Aritmética de meses inteira, sem `Date` na soma**
  (`offer-derivations.ts:82-91`): `year * 12 + (month − 1) + months` com clamp
  via `daysInCivilMonth` elimina por construção o rollover silencioso de
  `Date.setMonth` — o ponto fraco recorrente de datas do projeto tratado de
  primeira, com clamp e ano bissexto testados (`2027-01-31 + 1 = 2027-02-28`,
  `2028-01-31 + 1 = 2028-02-29`).
- **Round-trip de calendário reaproveitado**: entradas passam por
  `isValidCivilDate` (regex + round-trip UTC); `2027-02-30` vira null sem
  alerta, com teste dedicado — a lição institucional das datas inválidas
  aplicada sem retrabalho.
- **RNF-08/RNF-09 rigorosos**: deságio em `decimal.js` com `toFixed(2)`
  half-up (default da lib; nenhum `Decimal.set` global no workspace que pudesse
  alterá-lo), half-up coberto por teste (`33.33`/`66.67`); ausência/invalidez →
  null, nunca zero; RAP máxima zero → null com teste explícito "nunca zero
  silencioso".
- **Alertas com códigos tipados sem texto** (`SCHEDULE_WARNING_CODES` +
  `ScheduleWarning` carregando a data-limite usada) — segue o padrão de
  violações tipadas de `decimalScaleViolation`; mensagens pt-BR ficam nas
  bordas, como manda o D2. Comparação lexicográfica de datas documentada e
  segura (ano com `padStart(4)`).
- **Migration exatamente como o design D4**: somente `ALTER TYPE ADD VALUE` e
  `ALTER TABLE ADD COLUMN`, sem `UPDATE` com os valores novos;
  `npx prisma migrate status` up to date e `npx prisma validate` ok.
- **Testes 1:1 com o delta spec**, describes em pt-BR citando RN-02/RNF-08/
  RNF-09, `it.each` para os inválidos, incluindo o cenário nominal do spec
  (`2027-02-26 + 60 = 2032-02-26`) e o combinado com os três alertas.
- **Higiene**: sem BOM nos sete arquivos tocados (verificado `head -c3 | od`),
  `nx format:check --all` limpo, lint limpo, import `type`-only de
  `ScheduleWarningCode` em `offers.ts` (sem ciclo), README com derivados sem
  coluna snake_case (nunca persistidos — coerente com o contrato).

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ⚠️ Problemas (MIN-2, desvio aceito pelo design) |
| Typescript/Node.js | ❌ Crítico (C1 — api não compila com o grupo isolado) |
| Angular/NestJS/React | ✅ Ok (web verde: test + lint sem cache) |
| REST/HTTP | ✅ Ok (nada de HTTP neste grupo) |
| Testes | ⚠️ Problemas (MIN-3; domain 115/115 verde) |
| Logging/Monitoramento | ✅ Ok (nada aplicável neste grupo) |

## Recomendações

1. **(C1 — obrigatório antes do commit)** Tornar `contractualDeadlineDate`,
   `discountPercent` e `scheduleWarnings` opcionais em `OfferRevisionItem` no
   grupo 1 e apertá-los para obrigatórios na task 2.5, junto com o presenter;
   reexecutar `npx nx run-many -t test lint build -p api web domain
   --skip-nx-cache` antes do commit do grupo. (Alternativas: antecipar a fiação
   mínima do presenter, ou commitar grupos 1+2 juntos.)
2. **(MIN-3)** Adicionar o teste `discountPercent('100.00', '0.00') →
   '100.00'` para travar a fronteira null ≠ zero na RAP vencedora.
3. **(MIN-1)** Mencionar no corpo do commit que o diff do schema inclui
   reformatação canônica do `prisma format` em blocos não relacionados.
4. **(MIN-4)** Registrar como housekeeping futuro a extração dos patterns
   genéricos de `catalogs/validation.ts` para um caminho neutro (3º consumidor
   fora de catálogos).
5. **(Processo)** Nos próximos grupos desta change, incluir a api no comando de
   verificação mesmo quando o grupo "só toca a domain": contratos da domain
   vazam para a api pelo typecheck (foi exatamente o que o `-p domain` não
   pegou aqui).

## Veredito

**MUDANÇAS SOLICITADAS.** A domain entregue é exemplar — derivações puras,
datas civis com round-trip, decimal half-up testado, migration aditiva
impecável — mas o contrato `OfferRevisionItem` com derivados obrigatórios
quebra a compilação (test **e** build) da api enquanto a task 2.5 não chega, e
o CI reprovaria o commit do grupo isolado. A correção é pequena (tornar os três
campos opcionais até a task 2.5, ou antecipar a fiação do presenter); aplicada
e com a suíte da api verde, o grupo está pronto para aprovação — nenhum outro
apontamento bloqueia.

---

## Resolucao (pos-review, antes do commit do grupo)

- **C1 corrigido**: os tres derivados de OfferRevisionItem viraram opcionais com comentario apontando o aperto na task 2.5; nx run-many -t test lint build -p api web domain --skip-nx-cache verde apos o fix (falha unica em work-crew-form.component.spec.ts confirmada como flake — passou 2x na reexecucao).
- **MIN-3 corrigido**: teste do desagio 100.00 com RAP vencedora '0.00' (zero informado != ausente, RNF-09) adicionado em offer-derivations.spec.ts.
- MIN-1 (churn do prisma format), MIN-2 e MIN-4 registrados sem acao nesta change.
