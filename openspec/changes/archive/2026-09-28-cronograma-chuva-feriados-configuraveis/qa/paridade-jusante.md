# Paridade numérica a jusante — task 6.2

Data: 2026-09-27. Escopo: impacto da mudança do método de duração do
cronograma (média fixa de 6 meses → consumo do quantitativo mês a mês, com
fator de calendário novo) sobre os módulos a jusante (histograma, desembolso
e resultado econômico).

## Suítes executadas

| Suíte | Resultado |
| --- | --- |
| `calc-engine` completo (19 suítes / 92 testes, inclui Camp, Histogram, Cashflow, EconomicResult) | verde |
| `calc-engine` filtro `parity` (business-rules-boundary, parity-validation, performance-benchmark — 10 testes) | verde |
| `api` completo (45 suítes / 251 testes, inclui contextos histogram, economics, baseline) | verde |
| `nx format:check --all` | limpo (exit 0) |
| `prisma migrate status` | 14 migrations, schema em dia |

## Desvios de duração esperados (documentação do risco do design)

Quantificados pelos testes golden de
`libs/calc-engine/src/lib/schedule/schedule-duration-golden.spec.ts`, que
reimplementam o método legado e comparam com o consumo mês a mês sobre os
parâmetros default (idênticos ao seed):

- **Fixture curta** (120 fundações, 2 equipes × 10/mês, MG, início em
  fevereiro): legado 7 meses × novo 7 meses — **desvio zero**. Atividades
  curtas dentro da janela de 6 meses tendem a coincidir.
- **Fixture longa** (200 unidades, 1 equipe × 10/mês, MG, início em maio,
  cruzando dois períodos chuvosos): legado 21 meses × novo 23 meses —
  **desvio +2 meses**. A janela fixa de 6 meses a partir da estação seca não
  enxergava os meses severos seguintes; o consumo mês a mês enxerga. O novo
  método é mais conservador (durações maiores) em atividades longas iniciadas
  em estação seca, e o efeito propaga para custo recorrente (RN-14),
  histograma de recursos e desembolso dessas atividades.
- **Fator de calendário**: efeito novo, ausente do método legado; só atua
  quando `scheduleStartDate` está preenchida na revisão (sem a data o motor
  emite pendência explícita e calcula sem o fator — RNF-09). Ordem de
  grandeza com o seed default: fator mensal típico entre 19/22 ≈ 0,86 e
  23/22 ≈ 1,05 conforme o mês civil.

## Limite conhecido

O pipeline de paridade F4 (`full-offer-pipeline-runner.ts` /
`parity-validation.spec.ts`) ainda não integra o módulo de cronograma — a
paridade de duração contra a planilha Calculo LT segue pendente de fixture
dedicada (critério de aceite da fase F4, fora do escopo desta change). O
método legado permanece reproduzível pelos helpers do teste golden caso a
paridade com a planilha exija revisão da decisão (mitigação prevista no
design, seção Risks).
