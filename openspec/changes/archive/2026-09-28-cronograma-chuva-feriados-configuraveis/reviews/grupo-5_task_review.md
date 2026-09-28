# Review do Grupo 5 — Interface web (parâmetros de chuva, calendário de trabalho e Gantt)

**Revisor**: AI Code Reviewer
**Data**: 2026-09-27
**Change / Grupo**: cronograma-chuva-feriados-configuraveis / grupo 5 (tasks 5.1–5.4)
**Status**: APROVADO COM OBSERVAÇÕES

## Resumo

O grupo entrega as duas telas de configuração do cronograma — parâmetros de chuva (faixas de severidade + grade UF × 12 meses com 324 inputs via FormArray) e calendário de trabalho (dias úteis padrão, 7 checkboxes de dias não laborais com bloqueio quando todos marcados, FormArray de feriados com validação de data civil da domain e UF opcional normalizada) — sobre um service HTTP simples (`ScheduleParametersApi`), respeitando a decisão D1 de não forçar a `VersionedCatalogApi` em catálogo singleton. No Gantt, a ancoragem civil vira KPI ("Obra a partir de X" / "Data de início não informada" — RNF-09), o plano mensal vira tooltip na barra e um tag "fatores em N meses" sinaliza os meses penalizados; os alertas novos do motor fluem pelo banner de warnings existente sem código novo.

**Todas as lições institucionais vieram aplicadas de primeira e testadas**: prefill bloqueante com `disable`/`enable({emitEvent: false})` (incluindo o caso `NEVER`), callback de erro em toda leitura com teste, `save()` com early-return em `form.disabled`, botão `[disabled]="saving() || form.disabled"`, Prettier limpo, sem BOM, textos e descrições de teste em pt-BR. Zero problemas críticos e zero majors; 6 minors — a maioria lacunas de cobertura em caminhos secundários de validação e dívidas cosméticas do Gantt legado. Suíte web verde sem cache (67 suítes / 344 testes, +20 testes novos), lint 0 erros.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| catalogs/schedule-parameters-api.service.ts | ⚠️ Problemas | 1 minor |
| catalogs/rainfall-parameters.component.ts | ⚠️ Problemas | 2 minors |
| catalogs/rainfall-parameters.component.spec.ts | ⚠️ Problemas | (MIN-1) |
| catalogs/work-calendar.component.ts | ✅ Ok | 1 nota |
| catalogs/work-calendar.component.spec.ts | ⚠️ Problemas | 1 minor |
| catalogs/catalogs.routes.ts | ✅ Ok | 0 |
| app.ts / app.spec.ts | ✅ Ok | 0 |
| offers/schedule-gantt.component.ts | ⚠️ Problemas | 2 minors |
| offers/schedule-gantt.component.spec.ts | ✅ Ok | 0 |

## Verificações Executadas

| Verificação | Resultado |
|-------------|-----------|
| `npx nx run-many -t test lint -p web --skip-nx-cache` | ✅ 67 suítes / 344 testes verdes; lint 0 erros |
| `npx prettier --check` nos 10 arquivos do grupo | ✅ todos no estilo |
| BOM UTF-8 nos 5 arquivos novos (`head -c3 \| od`) | ✅ ausente (arquivos escritos sem PowerShell, armadilha do Windows não reincidiu) |
| Contratos web × API | ✅ envelope `{id, effectiveFrom, createdBy, createdAt, parameters/calendar}` confere com os `*VersionRecord` da porta (`contexts/schedule/domain/ports/schedule-parameters.port.ts`); rotas `GET/POST /api/schedule-parameters/{rainfall,work-calendar}` conferem com o controller do grupo 4 |
| Exports da domain consumidos | ✅ `DATE_PATTERN`, `decimalScaleViolation` (via `form-utils`), `isValidCivilDate`, `BRAZILIAN_UFS`, `UF_METADATA_MAP`, `DEFAULT_RAINFALL_PARAMETERS`, `DEFAULT_WORK_CALENDAR` — todos exportados por `libs/domain/src/index.ts` |
| Smoke visual | Não executado (opcional; QA da task 6.3 fará E2E) |

## Análise dos Pontos Solicitados

1. **Cenários de spec**: todos cobertos no nível web. Percentual fora de 0–1 → `factorRangeValidator` bloqueia o save com "O fator deve estar entre 0 e 1" (teste com asserção da mensagem e de `createRainfallVersion` não chamado); 2027-02-30 → `civilDateValidator` sobre `isValidCivilDate` da domain rejeita sem rollover ("Data de calendário inexistente", testado); recorrente exibido como `25/12 (todo ano)` sem o ano (teste de `monthDayOf` + texto renderizado); edição sempre `POST` criando nova versão (payload assertado por igualdade completa — última faixa `upperLimitMm: null`, UF em branco → `null` nacional), com recarga do vigente após salvar. A imutabilidade em si é garantida pela API (grupo 4, PUT/PATCH → 405) e o texto da tela comunica o comportamento ("versões anteriores permanecem imutáveis").
2. **Faixas fixas na UI**: aceitável nesta change. A UI na verdade renderiza N faixas — `rebuildForm` itera as faixas da versão vigente ordenadas por `position` e trata a última como aberta por posição —, só não oferece adicionar/remover. É exatamente o recorte documentado no design D1 ("o número de faixas é flexível no modelo, a UI desta change mantém 5"); se uma versão com N≠5 faixas for criada via API, a tela a exibe e edita corretamente. Nenhuma ação requerida.
3. **Acessibilidade e tela estreita**: cada uma das 324 células tem `aria-label` "UF Mês (mm)" (ex.: "SP Jan (mm)"), inputs de faixa e de feriado idem, `inputmode="decimal"` nos numéricos, erros com `role="alert"`, e as duas tabelas estão em `.table-scroll` (grade com `.dense`). Baseline adequado; a validação real de responsividade fica para o QA 6.3.
4. **app.spec**: lista exata do menu confere com `app.ts` (dois itens novos ao final, após "Equipes de trabalho") e o length 15 confere (`links` tem 15 entradas; `systemLinks` fica fora do `mat-nav-list`). Ícones `rainy`/`event_available` válidos no Material Symbols.
5. **work-calendar**: `monthDayOf('')` retorna `''` (guarda `DATE_PATTERN.test`), o que oculta o preview via `@if` — comportamento correto, porém o branch de data vazia não tem teste (MIN-2). O bloqueio por `allNonWorkingError()` mesmo com form válido está no `save()` (`if (this.form.invalid || this.allNonWorkingError())`) e tem teste dedicado assertando a mensagem e o POST não disparado.

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

**MIN-1 — Validação client-side da grade UF×12 e do limite de faixa sem nenhum teste** — `rainfall-parameters.component.spec.ts`
Os testes cobrem os erros de fator (`factorRange`, escala 4) e a rejeição estrutural vinda do servidor, mas `matrixError()` (rainfall-parameters.component.ts:307–324, incluindo a mensagem RNF-09 "precipitação ausente não vira zero"), `bandLimitError()` (linhas 276–288) e `ufName()` não são exercitados por nenhum teste — o guard client-side da parte mais volumosa da tela (324 inputs) está sem cobertura. Sugestão: um teste limpando uma célula (`component.ufSeries.at(i).controls.monthlyMm.at(j).setValue('')`) + `save()`, assertando a mensagem identificando a UF e o POST não disparado; outro com escala >1 no limite de faixa.

**MIN-2 — Branches secundários do work-calendar sem teste** — `work-calendar.component.spec.ts`
Sem teste para: `monthDayOf`/`recurringPreview` com data vazia (branch de guarda, work-calendar.component.ts:333–345), nome de feriado obrigatório ("Campo obrigatório") e UF desconhecida ("UF inválida", `ufValidator` linha 47–55). São caminhos simples, mas o padrão institucional (reavaliacao-base-catalogos) é travar mensagens de validação por teste.

**MIN-3 — Hex literais novos no Gantt** — `schedule-gantt.component.ts:749–757`
`.factor-tag` introduz `#e0f2fe`/`#0369a1`. O arquivo é legado pré-DESIGN.md e já usa hex (não é regressão), mas o CSS **novo** amplia a dívida frente à proibição de hex do design system — as duas telas novas do grupo usam `var(--mat-sys-error)` corretamente. Ao refitar o Gantt para o tema Swiss, incluir o tag; alternativa imediata seria a classe utilitária `.badge` global.

**MIN-4 — Tooltip do plano mensal só via atributo `title`** — `schedule-gantt.component.ts:235 e 300`
`[title]="breakdownTooltip(act)"` é mouse-only: inacessível por teclado e touch, e o `\n` depende do render nativo do navegador. Aceitável nesta change (o dado principal — tag "fatores em N meses" e KPI — é visível sem hover), mas registrar para o refit do Gantt: `matTooltip` ou linha expandível.

**MIN-5 — Mensagem da grade não aponta o mês** — `rainfall-parameters.component.ts:315–320`
Em 324 células, `matrixError()` identifica só a UF ("Precipitação de MG..."); incluir o mês (`monthLabels[índice]`) barateia localizar a célula inválida. Uma linha por mensagem.

**MIN-6 — Envelopes de versão duplicados no service web** — `schedule-parameters-api.service.ts:13–28`
`RainfallParametersVersion`/`WorkCalendarVersion` re-declaram à mão os `*VersionRecord` da porta da API (que vive em `apps/api`, inacessível ao web) — mesmo drift estrutural já registrado nos catálogos. Quando os contratos de resposta forem promovidos à domain (pendência da extração do catálogo genérico), migrar estes dois junto.

### Notas (sem ação requerida)

- `formArrayName="monthlyMm"` está em cada `<td>` (324 instâncias da diretiva) em vez de uma vez num contêiner da linha — funciona e o custo é desprezível, mas é forma incomum.
- `matrixError()`/`allNonWorkingError()` são chamados a cada ciclo de change detection (varredura de até 324 controles) — desprezível nesta escala; se crescer, converter para signal derivado de `statusChanges`.
- `Number(entry.rainfallFactor) < 1` em `penalizedMonths` é comparação de exibição, não cálculo de negócio — RNF-08 preservado (strings decimais fluem intactas até o tooltip).
- Os testes usam `DEFAULT_WORK_CALENDAR` com `'22.00'`, mas a API real pode devolver `'22'` (Decimal `.toString()` solta zeros à direita — REC-5 do grupo 4); o prefill continua válido para `decimalScaleValidator(2)`, só a formatação visual difere do teste.
- Cosmético: no parágrafo dos feriados há espaço antes do `;` quando o preview aparece; e o KPI exibe a data ISO ("Obra a partir de 2026-07-01") — consistente com "Versão vigente desde ..." das demais telas; padronizar dd/mm/aaaa é decisão de formatação de datas da UI como um todo, não deste grupo.
- Durante o save o form não é desabilitado (só o botão via `saving()`) — consistente com os demais forms de catálogo.

## ✅ Destaques Positivos

1. **Todas as lições institucionais aplicadas e testadas de primeira**: prefill bloqueante com `disable`/`enable({emitEvent: false})`, caso `NEVER` testado, callback de erro em toda leitura com teste de que o save fica inerte, `save()` early-return comentado com o porquê ("gravaria uma versão vazia por cima dos parâmetros vigentes"), botão refletindo `form.disabled`. A série de majors históricos de formatação e de subscribes sem erro segue quebrada.
2. **Zero duplicação de conhecimento de domínio**: validação de escala via `decimalScaleValidator`→`decimalScaleViolation` (base da reavaliacao-base-catalogos), data civil via `isValidCivilDate`, UFs via `BRAZILIAN_UFS`/`UF_METADATA_MAP`, datas via `DATE_PATTERN` — a tela não re-declara nenhuma lista nem regra da domain.
3. **Payloads assertados por igualdade completa** (lição series-torres/guy-wires): `bands[4]` com `upperLimitMm: null`, feriado Carnaval com `uf: null`, `nonWorkingWeekdays` `[0, 6]` — nada de `toBeDefined`.
4. **RNF-09 visível na UI**: célula em branco não vira zero (required + mensagem explícita), UF em branco é decisão explícita de feriado nacional (`orNull` → `null`), pendência de `scheduleStartDate` aparece no KPI do Gantt.
5. **Acessibilidade pensada em grade densa**: `aria-label` individual nas 324 células com UF+mês+unidade, `role="alert"` nos erros, `title` com o nome completo da UF na linha, `inputmode="decimal"`.
6. **Gantt com refit mínimo**: alertas novos fluem pelo banner existente sem código novo; teste do breakdown usa números realistas alinhados ao smoke do grupo 4 (calendarFactor `0.9545` = 21/22); pluralização mês/meses correta.
7. **Decisão D1 respeitada com sobriedade**: service de 77 linhas sem herança forçada da `VersionedCatalogApi`; rotas novas com comentário explicando o singleton (sem lista nem histórico próprio).

## Conformidade com Padrões

| Padrão | Status |
|--------|--------|
| Padrões de Código | ✅ Ok |
| TypeScript/Node.js | ✅ Ok (zero `any` nos arquivos do grupo) |
| Angular | ✅ Ok (standalone, signals, reactive forms tipados, control flow `@if`/`@for`) |
| Design system (DESIGN.md) | ⚠️ Problemas (MIN-3: hex novo no Gantt legado; telas novas conformes) |
| Testes | ⚠️ Problemas (MIN-1/MIN-2: caminhos de validação client-side sem cobertura; cenários principais todos cobertos) |
| Formatação/BOM | ✅ Ok |

## Recomendações

1. (MIN-1) Adicionar teste da validação client-side da grade: célula vazia → mensagem identificando a UF + POST não disparado; limite de faixa com escala > 1.
2. (MIN-2) Travar por teste as mensagens "Campo obrigatório" (nome do feriado), "UF inválida" e o branch de data vazia de `monthDayOf`.
3. (MIN-5) Incluir o mês na mensagem de `matrixError()` para localizar a célula entre as 324.
4. (MIN-3/MIN-4) Registrar no refit futuro do Gantt: tokens `--mat-sys-*` no `.factor-tag` e `matTooltip` (ou detalhe expandível) no plano mensal.
5. (MIN-6) Na extração dos contratos de resposta para a domain, migrar os dois envelopes do `schedule-parameters-api.service.ts`.

## Veredito

**APROVADO COM OBSERVAÇÕES** — zero críticos, zero majors. O grupo 5 fecha a implementação da change com as duas telas de configuração e a visualização dos fatores no Gantt, todos os cenários de interface dos specs cobertos por teste (percentual fora de 0–1, 2027-02-30 sem rollover, recorrente mês-dia sem ano, POST criando nova versão) e a suíte web verde sem cache. Os 6 minors são lacunas de cobertura em caminhos secundários e dívidas cosméticas do Gantt legado — nenhum bloqueia o avanço. Próximos passos: (a) opcionalmente fechar MIN-1/MIN-2/MIN-5 antes do commit (baratos); (b) seguir para o grupo 6 — `npx nx run-many -t test lint -p api web domain calc-engine`, `format:check --all` (lição: sem flags o check é vácuo em árvore limpa), paridade a jusante e QA (task 6.3) com E2E dos três specs.
