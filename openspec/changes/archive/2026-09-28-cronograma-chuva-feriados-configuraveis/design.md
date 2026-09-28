## Context

Motivação no proposal.md. Estado atual relevante:

- `libs/calc-engine/src/lib/schedule/precipitation-calculator.ts` implementa RN-16 com três conjuntos de constantes hardcoded: `DEFAULT_PRECIPITATION_BY_UF` (27 UFs × 12 meses), os limites das 5 faixas em `classifyLevel()` e `PRODUCTIVITY_FACTORS_BY_LEVEL`. Há divergência entre o spec `cronograma` (fator 0,55 para > 250 mm) e o código (0,65 para > 300 mm) — com os valores virando dados, a divergência deixa de existir no código.
- `schedule-calculator.ts` estima a duração com a **média do fator de chuva de uma janela fixa de 6 meses** a partir do mês inicial da atividade, e trata `startMonth` como mês calendário cíclico (módulo 12), sem ano.
- `OfferRevision.scheduleStartDate` (`@db.Date`, anulável) existe no schema mas não é usado pelo motor.
- Não existe nenhum conceito de feriado ou dia não laboral no repositório.
- Padrões consolidados: catálogos versionados por vigência com histórico imutável (RNF-05, vigência derivada sem `vigencia_fim`, funções puras em `catalogs/effectiveness.ts`); data de referência resolvida na borda (controller) — camadas internas nunca leem o relógio; helper `civil-date.ts` (fuso `America/Sao_Paulo`, validação round-trip); tabela filha imutável com a versão via nested create (precedente: peso×altura em series-torres); Decimal nunca float (RNF-08).

Decisões já confirmadas com o usuário nesta exploração: (a) tudo editável nos parâmetros de chuva — fatores, faixas e matriz; (b) persistência como catálogo global versionado por vigência; (c) feriados em calendário civil real ancorado em `scheduleStartDate`.

## Goals / Non-Goals

**Goals:**

- Tornar os parâmetros de chuva (RN-16) e o calendário de trabalho dados configuráveis e versionados, com o motor permanecendo puro e determinístico (parâmetros entram como input).
- Ancorar o cronograma em calendário civil real e penalizar a produção mensal por dias não trabalháveis.
- Substituir a estimativa de duração por média fixa de 6 meses por consumo iterativo mês a mês.

**Non-Goals:**

- Cronograma com granularidade diária ou semanal — a unidade continua sendo o mês; dias úteis entram apenas como fator mensal.
- Importação automática de feriados de fontes externas (ANBIMA, APIs de feriados) — cadastro manual nesta change.
- Override de parâmetros por oferta/revisão — a configuração é global versionada (decisão do usuário); overrides ficam para change futura se houver demanda.
- Recalibração dos valores em si — o seed reproduz os valores atuais da planilha; corrigi-los é tarefa do usuário na aplicação.

## Decisions

### D1 — Dois catálogos de configuração "singleton": só versões, sem tabela de item

Os catálogos existentes modelam *coleções* de itens (cabos, isoladores) com par item+versões. Aqui há exatamente **um** conjunto de parâmetros de chuva e **um** calendário de trabalho no sistema — uma tabela de item com uma única linha seria cerimônia sem informação. Modelo:

- `rainfall_parameter_version` — versão com `effectiveDate`, autor, timestamps; filhas imutáveis via nested create:
  - `rainfall_severity_band` (N faixas ordenadas; `upperLimitMm Decimal?` — null na última faixa, aberta — e `productivityFactor Decimal(5,4)`): seed com as 5 faixas atuais; o número de faixas é flexível no modelo, a UI desta change mantém 5.
  - `rainfall_uf_row` (27 linhas, uma por UF, 12 colunas `janMm..decMm Decimal(6,1)`): espelha a forma da planilha e da grade de edição; evita 324 linhas normalizadas sem ganho de consulta (o motor sempre consome a série completa da UF).
- `work_calendar_version` — versão com `effectiveDate`, `standardWorkingDaysPerMonth Decimal(4,2)` (denominador do fator; ex.: 22,00), `nonWorkingWeekdays Int[]` (0=domingo..6=sábado); filha imutável:
  - `holiday` (`date @db.Date`, `name`, `recurring Boolean` — feriado fixo repete todo ano pelo par mês-dia; móveis como Carnaval são cadastrados por ano —, `uf String?` — null = nacional; estadual só conta quando coincide com a UF da linha).

Resolução de vigência reutiliza as funções puras de `catalogs/effectiveness.ts` (versão vigente = maior `effectiveDate` ≤ data de referência). A base extraída de catálogo (`VersionedCatalogApi`, `controller-shared.ts`) assume item+versões e URL de coleção — **não** será forçada aqui; os endpoints são de configuração (`GET/POST /schedule-parameters/rainfall`, `/schedule-parameters/work-calendar` com `?referenceDate=`), reutilizando apenas as peças que servem (pipes, resolveAuthor, resolveReferenceDate, prisma-errors).

*Alternativa rejeitada*: par item+versões com item único seed 'DEFAULT' — uniformiza com a base extraída, mas cria rota de coleção sem coleção e lista de um item na UI.

### D2 — Motor recebe parâmetros como input; borda resolve a versão vigente

`PrecipitationCalculator` deixa de ler `DEFAULT_*` e passa a operar sobre um objeto `RainfallParameters` (faixas + matriz) recebido por parâmetro; novo `WorkCalendarCalculator` idem com `WorkCalendarParameters`. Os valores hoje hardcoded migram para o **seed** (fonte única: constantes exportadas de `libs/domain` consumidas pelo seed e pelos testes golden). A API resolve a versão vigente pela data de referência na borda (controller/adapter do contexto `schedule`) e injeta no cálculo — padrão D2 do piloto, mantendo RNF-04/RNF-16.

*Alternativa rejeitada*: motor com fallback interno para os defaults quando não recebe parâmetros — esconderia a ausência de configuração (viola RNF-09) e criaria duas fontes de verdade.

### D3 — Ancoragem civil: mês do projeto → mês civil via `scheduleStartDate`

Mês civil do mês N do projeto = `addMonths(scheduleStartDate, N-1)` (aritmética de data civil no helper existente, sem `new Date()` nas camadas internas). Dias úteis do mês civil = dias do mês − dias caindo em `nonWorkingWeekdays` − feriados aplicáveis que caem em dia que seria laboral (feriado em sábado não desconta duas vezes). Fator de calendário do mês = `diasÚteis ÷ standardWorkingDaysPerMonth`, arredondado a 4 casas half-up (mesma escala do fator médio de chuva atual).

**Ausência de `scheduleStartDate` é pendência de primeira classe (RNF-09)**: sem a data, o cronograma calcula como hoje (meses cíclicos para chuva, sem fator de calendário) e emite alerta explícito de que feriados não foram considerados — nunca assume um ano silenciosamente.

### D4 — Produção efetiva composta e duração por consumo mês a mês

Produção efetiva da atividade no mês civil `m`:

`efetiva(m) = nominal × equipes × fatorChuva(UF, m) × fatorCalendário(m) ÷ dificuldadeAcesso`, arredondada a 2 casas half-up por mês (consistente com `calculateEffectiveProduction` atual).

Duração: consumir o quantitativo total subtraindo `efetiva(m)` mês a mês a partir do mês inicial; duração = número de meses até o saldo zerar (teto no último mês parcial). A produção mensal exigida para a validação RN-15 passa a ser a produção efetivamente programada em cada mês (não mais a divisão linear total÷duração). Guarda anti-loop: se `efetiva(m)` = 0 (fator zerado pelo usuário ou mês sem dias úteis), avançar o mês acumulando alerta; horizonte máximo de 600 meses aborta com erro explícito em vez de laço infinito.

Fatores de chuva e calendário aplicam-se apenas a atividades dimensionadas por produção; grupos `INDIRECTS` e `CAMPS` (custo mensal fixo) permanecem fora, como hoje.

### D5 — Seed como versão inicial com vigência retroativa

Migration aditiva + seed criando a versão 1 de cada catálogo com `effectiveDate` retroativa fixa (ex.: `2020-01-01`) e os valores atuais: matriz e faixas hoje em código; calendário com sáb+dom não laborais, 22 dias úteis padrão e feriados nacionais fixos do Brasil. Qualquer data de referência existente resolve para a versão 1, preservando reprodutibilidade e paridade.

## Risks / Trade-offs

- [Datas e fuso — ponto fraco recorrente do projeto] → todo manuseio via `civil-date.ts` com validação round-trip de calendário; colunas `@db.Date`; feriado com data inválida (ex.: 2027-02-30) rejeitado com 400 em pt-BR; teste de borda BRT 21h–24h.
- [Mudança do método de duração (média 6 meses → mês a mês) altera resultados existentes] → testes golden antes/depois quantificando o desvio; a suíte de paridade numérica (F4) é o critério de aceite; se a paridade com a planilha exigir, o método antigo pode ser mantido atrás de flag de cálculo — decidir com evidência, não de antemão.
- [Efeito cascata: durações alimentam histograma, desembolso e resultado econômico] → rodar as suítes de paridade desses módulos na change; desvios esperados documentados no QA.
- [Fator zero configurável pelo usuário pode estagnar atividades] → guarda de horizonte máximo + alerta explícito por mês pulado (D4); nunca falha silenciosa.
- [Catálogo singleton é forma nova — base extraída não cobre] → reutilização parcial consciente (D1); se um terceiro catálogo singleton surgir, extrair base própria (regra das três ocorrências).
- [Feriados recorrentes vs. por ano podem confundir o usuário] → UI distingue visualmente e o feriado recorrente exibe o mês-dia sem ano; QA cobre Carnaval (móvel, por ano) e 1º de janeiro (fixo, recorrente).

## Migration Plan

1. Migration aditiva (tabelas novas, nenhuma alteração em tabelas existentes) + seed (D5).
2. Refit do motor com parâmetros injetados; API passa a resolver do banco. Sem período de convivência: a versão seed reproduz os valores hardcoded, então o deploy é comportamentalmente neutro no eixo chuva; o eixo calendário só atua quando `scheduleStartDate` está preenchida.
3. Rollback: reverter migration (drop das tabelas novas) e o refit — nenhum dado existente é tocado.

## Open Questions

- Layout exato da grade UF×12 na tela de parâmetros de chuva (edição inline vs. modal por UF) — não altera specs nem tasks de API/motor.
- Lista exata de feriados nacionais no seed (RN de negócio não existe; qualquer lista inicial é editável pelo usuário).
