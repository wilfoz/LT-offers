# QA — cronograma-chuva-feriados-configuraveis

**Resultado: APROVADO** — 25/25 cenários dos 3 specs verificados e PASSARAM;
nenhum bug de produto encontrado (2 falsos negativos de script E2E,
documentados abaixo).

Data: 2026-09-27. Ambiente: Postgres via Docker (`lt-offers-postgres`,
porta 5432, seed aplicado), API `npx nx serve api` na porta 3000, web
`npx nx serve web` na porta 4200 (proxy `/api` → 3000). Dados criados pelo
QA (versões de vigência futura) removidos ao final — banco devolvido ao
estado do seed (1 versão de cada catálogo).

## Checklist por cenário

Tipos: TU = unidade (suíte), TI = integração (API ao vivo, evidência JSON),
E2E = navegador (Playwright, captura PNG). Evidências em `qa/evidences/`.

### Spec `catalogos/parametros-chuva`

| # | Cenário | Tipo | Resultado | Evidência |
| - | --- | --- | --- | --- |
| 1 | Edição cria nova versão preservando o histórico | TI | PASSOU | `ti2-rainfall-vigencia.json` (POST 2026-10-01 com fator 0,70; versão 2020-01-01 intacta) |
| 2 | Resolução da versão vigente por data de referência | TI | PASSOU | `ti2` — effectiveOn 2026-09-15 → 0,65; 2026-10-15 → 0,70 |
| 3 | Fator fora do intervalo é rejeitado | TI + E2E | PASSOU | `ti3-fator-fora-intervalo.json` (400 pt-BR); `e2e2-rainfall-fator-invalido.png` (tela bloqueia 1.2) |
| 4 | Matriz incompleta é rejeitada identificando a UF | TI | PASSOU | `ti4-matriz-sem-uf.json` (400: "falta a série da UF BA") |
| 5 | Consulta sem edições retorna os valores originais | TI + E2E | PASSOU | `ti1-rainfall-seed.json` (MG original, 5 faixas 1,00→0,65); `e2e1-rainfall-tela.png` |

Extras verificados: vigência duplicada → 409 (`ti5`), PUT → 405 imutável (`ti6`).

### Spec `catalogos/calendario-trabalho`

| # | Cenário | Tipo | Resultado | Evidência |
| - | --- | --- | --- | --- |
| 6 | Edição cria nova versão preservando o histórico | TI + E2E | PASSOU | `ti8-calendar-vigencia.json`; `e2e4-calendario-salvo.png` (snackbar; nova versão 2027-06-01 confirmada por GET effectiveOn=2027-07-01, hoje segue 2020-01-01) |
| 7 | Resolução da versão vigente por data de referência | TI | PASSOU | `ti8` — 2026-11-10 → 22,00; 2027-02-01 → 21,00 |
| 8 | Data de calendário inexistente é rejeitada | TI + TU | PASSOU | `ti9-feriado-data-invalida.json` (400 sem rollover); TU `work-calendar.spec` (isValidCivilDate) e spec da tela; o input nativo `type=date` impede digitação inválida (defesa em profundidade) |
| 9 | Feriado recorrente aplica-se a todos os anos | TU + TI | PASSOU | `work-calendar.spec.ts` (domain); vivo em `ti10`: feriados do seed (ano-ref 2020) descontados em 2026/2027 |
| 10 | Feriado estadual aplica-se apenas à UF | TU | PASSOU | `work-calendar.spec.ts` (escopo BA×MG) |
| 11 | Mês com feriados em dias laborais (30d − 8 fds − 2 fer = 20) | TU | PASSOU | `work-calendar.spec.ts` (junho/2026) |
| 12 | Feriado em dia não laboral não desconta duas vezes | TU + TI | PASSOU | TU + evidência viva `ti10`: nov/2026 = 19 úteis (Finados seg + Consciência Negra sex descontados; Proclamação no DOMINGO não descontada) → fator 0,8636 |
| 13 | Consulta sem edições retorna o calendário padrão | TI + E2E | PASSOU | `ti7-calendar-seed.json` (sáb/dom, 22,00, 9 recorrentes); `e2e3-calendario-tela.png` (recorrente "25/12 (todo ano)") |

### Spec `cronograma` (delta)

| # | Cenário | Tipo | Resultado | Evidência |
| - | --- | --- | --- | --- |
| 14 | Duração 120/(2×6)=10 meses com fatores neutros | TU | PASSOU | `schedule-calculators.spec.ts` |
| 15 | Ajuste pela dificuldade de acesso | TU | PASSOU | `schedule-calculators.spec.ts` |
| 16 | Consumo mês a mês com fatores variáveis (1/1/0,65/0,65 → 7 meses) | TU | PASSOU | `schedule-duration-golden.spec.ts` |
| 17 | Mês com produção zero não trava (alerta e avanço; 600 meses → erro) | TU | PASSOU | `schedule-duration-golden.spec.ts` |
| 18 | Redução de produtividade no período chuvoso (20×0,65=13) | TU | PASSOU | `precipitation-calculator.spec.ts` |
| 19 | Resolução para qualquer UF válida (27; desconhecida = erro explícito) | TU | PASSOU | `precipitation-calculator.spec.ts` |
| 20 | Percentual editado reflete no cálculo; oferta anterior reproduz | TI + TU | PASSOU | `ti2` (0,70 vigente só a partir de 2026-10-01) + `usecases.spec.ts` (resolução pela offerDate) + `ti10`/`ti11`: cronograma da oferta (ref. 2026-03-25) usa a versão antiga |
| 21 | Mês do projeto mapeado ao mês civil real | TU + TI | PASSOU | golden (2027-03-15 + mês 4 → jun/2027); vivo em `ti10`: início 2026-07-01, atividade M3 → set/2026 |
| 22 | Ausência de `scheduleStartDate` gera pendência explícita | TU + E2E | PASSOU | golden + `usecases.spec.ts` (warning propagado); Gantt exibe o rótulo de ancoragem (`schedule-gantt.component.spec.ts`) |
| 23 | Mês com feriados reduz a produção efetiva (19/22) | TU + TI | PASSOU | golden (20/22 → 7,73) + vivo `ti10`: set/2026 fator 0,9545 (21/22, Independência na segunda) |
| 24 | Composição multiplicativa chuva × calendário (≈7,73, 2 casas half-up) | TU + TI | PASSOU | golden (10×0,85×0,9091=7,73); vivo: 36×0,95×0,9545=32,64 (`ti10-schedule-summary.json`) |
| 25 | Grupos de custo fixo fora da penalização | TU | PASSOU | golden (INDIRECTS 18 × produção 28 meses) |

E2E adicional: `e2e5-gantt-fatores.png` — Gantt ancorado ("Obra a partir de
2026-07-01"), 4 tags "fatores em N meses" e banner de alertas renderizados.

## Suítes de unidade e integração

- `npx nx run-many -t test lint -p api web domain calc-engine --skip-nx-cache`:
  domain 89, calc-engine 92, api 251, web 347 — **779 testes verdes**, lint 0 erros.
- `npx nx format:check --all` limpo; `npx prisma migrate status` em dia
  (14 migrations). Meta de cobertura: não há meta configurada nos projetos.
- Paridade a jusante: ver `qa/paridade-jusante.md` (task 6.2).

## Acessibilidade (telas novas e alterada)

- [x] Navegação por teclado: Tab percorre células da grade e faixas
  (evidência E2E6: foco alcança "Limite superior da faixa 2" via aria-label)
- [x] Elementos interativos rotulados: 324 células com aria-label "UF Mês
  (mm)", feriados com aria-label posicional, botões com texto
- [x] Imagens: não há imagens novas (sem `alt` aplicável)
- [x] Contraste: tokens do tema Material (sem hex novo nas telas de
  catálogo); tag de fatores do Gantt herda a paleta legada do componente
- [x] Formulários com rótulos associados (mat-label / aria-label)
- [x] Mensagens de erro claras em pt-BR com `role="alert"`
- [x] Fontes nos tamanhos do design system

## Visual e responsividade

- Estados com dados: `e2e1` (chuva), `e2e3` (calendário), `e2e5` (Gantt).
- Estado de erro: `e2e2` (validação de fator na tela).
- 375px: `e2e7-rainfall-375px.png` e `e2e8-calendario-375px.png` — sem
  estouro horizontal do body (grade rola em `.table-scroll`).
- Estado vazio: não aplicável (catálogos singleton sempre têm a versão seed;
  a ausência de versão vigente responde 404 tratada pela tela como erro de
  carregamento com formulário bloqueado — coberto por TU).

## Bugs e falsos negativos

Nenhum bug de produto. Dois falsos negativos do script E2E, corrigidos no
próprio script (padrão recorrente de QA do projeto):

1. **Corrida de render ao adicionar feriado** — o clique resolve antes do
   Angular renderizar a linha nova e o `fill` acertava a última linha
   antiga. Correção: `waitForFunction` pela contagem de linhas antes de
   preencher.
2. **Asserção errada de vigência futura** — o script esperava a tela exibir
   "vigente desde 2027-06-01" após salvar, mas versão com vigência futura
   corretamente NÃO é a vigente de hoje (comportamento certo do produto);
   asserção trocada por verificação via API com `effectiveOn` futuro.

## Encerramento

Serviços de serve (API 3000 / web 4200) encerrados ao final; Postgres do
Docker mantido. Versões criadas pelo QA removidas do banco (estado = seed).
