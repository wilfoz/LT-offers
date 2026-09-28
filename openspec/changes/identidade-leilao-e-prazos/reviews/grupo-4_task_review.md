# Review do Grupo 4 (parcial — tasks 4.1 a 4.3)

**Revisor**: AI Code Reviewer
**Data**: 2026-09-28
**Change / Grupo**: identidade-leilao-e-prazos / grupo 4 ("Seed, fixtures e verificação"; task 4.4 de QA E2E fica para a skill executar-qa)
**Status**: Aprovado com observações

## Resumo

O grupo aplica a decisão D6 do design: a oferta-mestre do seed ganha a identidade normalizada do Leilão 4/2026 da ANEEL (`auctionNumber '004/2026'`, `lotNumber 4`, `subLotCode null`) e os prazos do edital (`contractSigningDate 2027-02-26`, `constructionDeadlineMonths 60`), com três correções de dados fundamentadas e comentadas (data do leilão 2026-03-27 → 2026-10-30, CAPEX de custo EPC → estimativa oficial ANEEL do lote inteiro, `winningRap` → null por leilão não realizado, RNF-09). As fixtures de paridade trocam apenas o rótulo `auction` para leilões de transmissão reais, sem tocar em nenhum número. O diff é mínimo e cirúrgico — 5 arquivos, sendo um deles o próprio `tasks.md`.

Toda a verificação da task 4.3 foi reexecutada de forma independente nesta review e está verde. Os valores do seed foram conferidos diretamente no Postgres e batem campo a campo com o D6, incluindo as datas civis sem desvio de fuso. Restam apenas dois apontamentos minor, sendo o principal uma lacuna na nota do seed: a oferta-mestre dispara **dois** alertas RN-02, mas a nota documenta apenas um.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `prisma/seed.ts` | ⚠️ Problemas | 2 minor |
| `libs/calc-engine/src/lib/parity/fixtures/solaris-mg-500kv.fixture.ts` | ✅ Ok | 0 |
| `libs/calc-engine/src/lib/parity/fixtures/reidi-direct-bill.fixture.ts` | ✅ Ok | 0 |
| `libs/calc-engine/src/lib/parity/fixtures/tucano-multiline.fixture.ts` | ✅ Ok | 0 |
| `openspec/changes/identidade-leilao-e-prazos/tasks.md` | ✅ Ok | 0 |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

**MIN-1 — Nota do seed documenta um alerta RN-02, mas a oferta-mestre dispara dois** (`prisma/seed.ts:1251-1252`)

A nota afirma que o alerta `DEADLINE_AFTER_COD` é esperado (data-limite 2032-02-26 > entrada em operação 2029-06-30) — correto e conferido contra `offer-derivations.ts`. Porém os dados semeados também satisfazem a condição de `START_BEFORE_SIGNING` (`libs/domain/src/lib/offers/offer-derivations.ts:121`): `scheduleStartDate 2026-07-01` é anterior a `contractSigningDate 2027-02-26`. O detalhe da oferta-mestre exibirá **dois** itens de alerta, e a nota (bem como o D6, que não previu essa interação) explica apenas um. Risco prático: o QA da task 4.4 (ou um usuário) pode interpretar o segundo alerta como bug. Correção sugerida — estender a última frase da nota:

```ts
'... o alerta RN-02 de data-limite contratual posterior à entrada em operação é ESPERADO nesta oferta, assim como o alerta de início do cronograma (2026-07-01) anterior à assinatura do contrato (2027-02-26).'
```

**MIN-2 — Estilos decimais mistos no mesmo bloco do seed** (`prisma/seed.ts:1247-1248` vs. restante do arquivo)

Os valores novos entram como string (`'4110000000.00'`, `'762630000.00'`) — a forma correta por RNF-08, e estritamente mais segura: o antigo `2382080065.89` como number literal não tem representação exata em double, enquanto `Prisma.Decimal` a partir de string preserva o valor. O restante do seed, porém, segue com number literals em campos `Decimal` (ex.: `nominalVoltageKv: 525.0`, `destinationPercentagePrimary: 60.0`, linhas 1260-1268). A mistura no mesmo `create` é aceitável nesta change (migrar o seed inteiro está fora de escopo), mas fica registrada como candidata a chore: padronizar valores monetários/decimais do seed como string, priorizando os que têm casas decimais não exatas em binário.

## ✅ Destaques Positivos

- **Verificação reproduzida integralmente pela review, tudo verde**: `npx nx run-many -t test lint -p api web domain calc-engine --skip-nx-cache` (inclui a suíte de paridade — as fixtures alteradas passam sem qualquer ajuste numérico), `npx nx format:check --all` com exit 0 (gate do CI, sem a armadilha da checagem vazia), `npx prisma migrate status` up to date (15 migrations).
- **Valores conferidos diretamente no Postgres** e idênticos ao D6, campo a campo: `004/2026`, `4`, `null`, `2026-10-30`, `2027-02-26`, `60`, `4110000000.00`, `762630000.00`, `winning_rap null`. As datas com `new Date('YYYY-MM-DDT00:00:00.000Z')` em colunas `@db.Date` gravaram exatamente o dia civil pretendido — o padrão UTC-explícito pré-existente do arquivo foi mantido e não tem o risco de fuso dos `new Date()` sem hora que já causou problema em outras changes.
- **Fixtures: mudança exatamente do tamanho prometido.** Só o campo `auction` mudou nas três fixtures; grep confirma que nenhum spec/teste do workspace asserta esses rótulos (o único uso é o contrato `parity.types.ts:71`); `celeo-lote-04` já dizia `004/2026` e não foi tocado. Zero alteração numérica confirmada por diff e pela suíte de paridade sem cache.
- **Correções de dados com fonte e justificativa no próprio código**: os comentários explicam por que o sublote é nulo (planilha-mestre cobre 4A+4B), por que o CAPEX mudou de semântica (estimativa ANEEL vs. custo EPC produzido pelo motor) e por que `winningRap` é null (RNF-09) — exatamente o tipo de comentário que agrega em arquivo de dados.
- **Lições institucionais aplicadas de primeira**: sem BOM nos 4 arquivos editados no Windows (conferido `head -c3`), `format:check --all` completo em vez das variantes vacuamente verdes, `--skip-nx-cache` na suíte.

## Conformidade com Padrões

| Padrão | Status |
|--------|--------|
| Padrões de Código | ✅ Ok |
| Typescript/Node.js | ✅ Ok |
| Angular/NestJS/React | ✅ Ok (não tocado neste grupo) |
| REST/HTTP | ✅ Ok (não tocado neste grupo) |
| Testes | ✅ Ok (suíte completa verde sem cache; grupo é de dados, sem código novo a testar) |
| Logging/Monitoramento | ✅ Ok (logs do seed mantidos no padrão do arquivo) |

## Recomendações

1. **(MIN-1)** Estender a nota da oferta-mestre para citar também o alerta `START_BEFORE_SIGNING` esperado — idealmente antes da task 4.4, para o roteiro de QA já contar com dois alertas na oferta seedada (re-rodar o seed após o ajuste).
2. **(MIN-2)** Registrar como chore futura a padronização dos decimais do seed como string (RNF-08), priorizando valores com fração não exata em binário.
3. Prosseguir para a task 4.4 (QA E2E via skill executar-qa); nenhum bloqueio identificado.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero problemas críticos ou major. O grupo entrega exatamente o que o D6 e as tasks 4.1–4.3 pedem, com verificação reproduzível e valores conferidos no banco. Os dois minors são de documentação/consistência de estilo em arquivo de dados; o MIN-1 vale corrigir antes do QA E2E para evitar um falso positivo no roteiro da task 4.4. Após o ajuste da nota (e re-seed), o grupo está pronto para commit e para o QA.

---

## Resolucao (pos-review, antes do commit do grupo)

- **MIN-1 corrigido**: nota do seed estendida citando os DOIS alertas RN-02 esperados (data-limite posterior a entrada em operacao E inicio do cronograma anterior a assinatura); seed reexecutado.
- MIN-2 (estilos decimais mistos no seed legado) registrado como chore futura.
