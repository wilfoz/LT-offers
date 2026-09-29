# Review do Grupo 3 — Interface web (tasks 3.1–3.3)

**Revisor**: AI Code Reviewer
**Data**: 2026-09-29
**Change / Grupo**: viabilidade-lote-licitante / grupo 3
**Status**: Aprovado com observações

## Resumo

O grupo 3 entrega a camada web do M13: utilitário compartilhado `format-utils.ts` (extração na 3ª ocorrência — regra das três — com normalização do zero negativo, fechando o MIN-1 do grupo 1), serviço `ViabilityApi`, tela "Parâmetros de viabilidade" no padrão rainfall-parameters, rota + item de menu (app.spec com a lista exata de 17 itens), painel "Viabilidade do Lote (M13)" na aba de parâmetros do detalhe da oferta e o campo `bidderCapex` editável em rascunho no trilho da change A.

Qualidade alta e disciplinada: **todas** as lições institucionais de reviews anteriores vieram aplicadas e testadas de primeira (prefill bloqueante com caso `NEVER`, callback de erro em toda leitura, botão refletindo `form.disabled`, `enable/disable({emitEvent:false})`, sem BOM, `format:check --all` limpo, textos pt-BR, tokens do design system sem hex novo). O refit da regra das três preservou textos e asserções dos consumidores existentes — zero mudança de comportamento fora do zero negativo, que é correção deliberada. Os quatro cenários do spec delta atribuíveis ao painel estão cobertos por teste. Zero problemas críticos ou major; apenas minors.

Verificação executada: `vitest` direcionado nas suítes novas/tocadas (format-utils 3, viability-parameters 8, offer-detail + app + auction-history 42 — todas verdes), `head -c3` sem BOM nos 5 arquivos novos, conferência do diff completo vs HEAD. A suíte completa (392 testes), lint, build e `format:check --all` já haviam sido evidenciados pelo aplicador.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `apps/web/src/app/shared/format-utils.ts` (novo) | ✅ Ok | 1 minor |
| `apps/web/src/app/shared/format-utils.spec.ts` (novo) | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/viability-api.service.ts` (novo) | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/viability-parameters.component.ts` (novo) | ✅ Ok | 1 minor |
| `apps/web/src/app/catalogs/viability-parameters.component.spec.ts` (novo) | ✅ Ok | 0 |
| `apps/web/src/app/offers/offer-detail.component.ts` | ⚠️ Problemas | 3 minors |
| `apps/web/src/app/offers/offer-detail.component.spec.ts` | ⚠️ Problemas | 1 minor |
| `apps/web/src/app/auction-history/auction-history.component.ts` | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/catalogs.routes.ts` | ✅ Ok | 0 |
| `apps/web/src/app/app.ts` / `app.spec.ts` | ✅ Ok | 0 |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

**MIN-1 — Painel sem estado persistente após erro de leitura** (`offer-detail.component.ts:1817-1834`, `3346-3358`)

Quando `GET /viability/assessment` falha (ex.: 404 de parâmetros sem vigência), o erro vai para o snackbar (testado) e `viabilityData` volta a null — mas o snackbar some em 5s e o painel fica renderizado só com o cabeçalho "Viabilidade do Lote (M13)", sem nenhuma orientação residual. O painel vizinho de benchmark ANEEL tem estado inline para ausência (`hasAuctionIdentity()`). Frente ao spec é suficiente (não há cenário "sem parâmetros vigentes" no delta e o seed do grupo 4 garante a versão inicial), mas sugiro guardar a mensagem num signal e exibi-la inline no painel:

```ts
readonly viabilityError = signal('');
// no error handler: this.viabilityError.set(msg);
// no template: @else if (viabilityError()) { <p class="benchmark-line">{{ viabilityError() }}</p> }
```

**MIN-2 — `loadViability` não trata `message` em array** (`offer-detail.component.ts:3352-3356`)

`err.error?.message || '...'` repassa um array de mensagens (formato do ValidationPipe em 400) direto ao `snackBar.open`, que o coagiria a string com vírgulas. A tela de parâmetros já trata (`Array.isArray(message) ? message.join('; ') : ...`, `viability-parameters.component.ts:315-319`). Hoje inalcançável (a web sempre envia ids inteiros válidos), mas vale uniformizar pelo mesmo padrão — inclusive porque esse tratamento já aparece em 2+ lugares (candidato a helper na próxima ocorrência).

**MIN-3 — Ramos do painel sem asserção web** (`offer-detail.component.spec.ts`)

Dois ramos de template só existem na web e nunca são assertados nos testes do componente: (a) o veredito do teto no caminho inviável — texto "inviável nas condições do edital (a RAP mínima excede a RAP máxima)" e classe `viability-bad` em `[data-testid="viability-max-verdict"]` (o cenário do spec "RAP mínima acima do teto" foi coberto na domain/API, mas a sinalização visual desse caso é do painel); (b) o rótulo de origem "informado pelo licitante" (`BIDDER`) — só o fallback "estimativa ANEEL" é exercitado. O QA 4.3 exercita (b) ao vivo; ainda assim, um teste de cada ramo fecharia a lacuna barato (lição guy-wires: em derivações por poda/simetria, conferir o que ficou sem cobertura).

**MIN-4 — `investmentSourceLabel(null)` devolve rótulo enganoso** (`offer-detail.component.ts:3360-3364`)

`source === 'BIDDER' ? 'informado pelo licitante' : 'estimativa ANEEL'` — para `null` responderia "estimativa ANEEL". Hoje inalcançável (o template só chama sob `investmentBase !== null`, e a domain garante origem não nula nesse caso), mas a assinatura aceita `null`; um early return `'origem não informada'` (ou estreitar o tipo para `ViabilityInvestmentSource`) elimina o risco de o guard do template mudar e o rótulo mentir em silêncio.

**MIN-5 — `stripNegativeZero` atua na entrada, não na saída arredondada** (`format-utils.ts:10-21`)

`formatMoney('-0.004')` passaria pelo strip (não casa `^-0(\.0+)?$`) e o `toLocaleString` arredondaria para `-0,00` — o sinal voltaria. Teórico: todas as entradas reais são strings decimais de escala 2 vindas da API (o caso real, `'-0.00'` do `toFixed(2)` da derivação, está coberto e testado). Registro apenas para não ser esquecido se o utilitário ganhar consumidores com escala maior.

## ✅ Destaques Positivos

- **MIN-1 do grupo 1 fechado exatamente como recomendado**: normalização do zero negativo na formatação da web, com teste dedicado cobrindo os três formatadores (`format-utils.spec.ts:16-20`) e negativo real (`'-4.90'`) preservado — a extração pela regra das três veio junto com a correção, sem tocar as asserções dos consumidores.
- **Refit limpo dos consumidores**: `auction-history` e `offer-detail` trocaram métodos por `readonly campo = função importada` sem alterar template nem testes existentes — as funções não usam `this`, então não há hazard de binding; abordagem endossada (menos ruído que métodos delegantes e zero risco de drift de texto).
- **Tela de parâmetros é o padrão rainfall-parameters por inteiro**: prefill bloqueante com comentário explicando o porquê do early return no `save()`, caso `NEVER` testado, falha de leitura bloqueando gravação de versão vazia, `civilDateValidator` com round-trip testado (`2027-02-30` rejeitado), reset do `effectiveFrom` pós-save (evita 409 de vigência duplicada por resubmissão) e recarga da vigente assertada por contagem de chamadas.
- **Validações espelhando a API com fidelidade**: WACC `decimalScaleValidator(2, {nonZero:true})` ↔ `PositiveNonZeroDecimal`, prazo `^\d+$` + min/max 1..60 ↔ `@IsInt @Min @Max`, fatores escala 2 + ≤100 ↔ `DecimalWithScale` + `DecimalUpTo100`; `concessionYears: Number(raw.trim())` coerente com o `@IsInt` do DTO (o pattern `^\d+$` garante inteiro antes do `Number`); payload do POST com exatamente as chaves do `CreateViabilityParametersVersionDto`.
- **Cenários do spec delta cobertos por teste**: painel completo (origem, vereditos, folga em p.p., comparação leilão + base, parâmetros vigentes com vigência), deságio pretendido acima do suportado destacado com `viability-bad` **sem impedir gravação**, entradas faltantes com os três rótulos pt-BR e sem valores inventados (RNF-09, `not.toContain('Deságio máximo suportado:')`), erro → snackbar com mensagem exata do servidor.
- **`bidderCapex` no trilho completo da change A**: rótulo exato do design ("Investimento total estimado pelo licitante (lote inteiro)"), `[readonly]="!isDraft()"` como os demais financeiros, `orNull` no save (vazio → null testado), inválido bloqueando com mensagem pt-BR assertada.
- **Design system respeitado**: painel reutiliza `benchmark-panel`/`benchmark-line`/`font-numeric-tabular`; `viability-good`/`viability-bad` usam `var(--solaris-primary)`/`var(--solaris-error)` — nenhum hex literal novo, nenhum `::ng-deep`/`.mdc-*`.
- **Higiene Windows**: `head -c3` sem BOM nos 5 arquivos novos (armadilha recorrente de escrita via PowerShell não reincidiu).

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ✅ Ok |
| Typescript/Node.js | ✅ Ok |
| Angular | ✅ Ok |
| REST/HTTP | ✅ Ok |
| Testes | ⚠️ Problemas (MIN-3) |
| Logging/Monitoramento | ✅ Ok |

## Respostas aos pontos levantados

1. **`readonly campo = função importada`**: aceitável e preferível a métodos delegantes aqui — as funções são puras (sem `this`), os call sites dos templates não mudaram e não há wrapper para divergir. Único cuidado futuro: se algum formatador passar a depender de estado do componente, aí sim voltar a método.
2. **Normalização de `-0.00` nos consumidores existentes**: sem cenário real de regressão. No `auction-history`, deságios negativos legítimos (`'-4.90'`) preservam o sinal (testado); `'-0.00'` só nasce de arredondamento e exibi-lo com sinal era o defeito apontado no grupo 1. Valores monetários nunca são `-0` na prática. É correção, não regressão.
3. **Reuso de `benchmark-panel` + tokens**: coerente — mesmo vocabulário visual dos dois pareceres da aba, cores semânticas via tokens do tema, zero hex novo (os hex pré-existentes de `.discount-negative` estão fora do escopo).
4. **Tela sem lista/histórico**: conforme — o design D3 declara "sem `list()` enquanto não houver consumidor" e o requirement de vigência do spec exige versões anteriores *consultáveis*, o que o `GET /parameters?effectiveOn=` satisfaz; nenhum cenário do delta pede lista na UI.
5. **404 → snackbar sem estado dedicado**: suficiente frente ao spec (não há cenário de parâmetros ausentes no painel e o seed garante a versão inicial); a observação MIN-1 é só sobre a persistência da orientação após o snackbar expirar.
6. **`concessionYears` como `Number(raw.trim())`**: coerente com o `@IsInt` do DTO; o validator `^\d+$` + required elimina `NaN`/decimal/notação científica antes da conversão.

## Recomendações

1. **(MIN-3)** Adicionar os dois testes de ramo do painel: veredito do teto inviável (`viability-bad` + texto) e origem "informado pelo licitante".
2. **(MIN-1)** Persistir a mensagem de erro do parecer inline no painel (signal `viabilityError`), no padrão do benchmark ANEEL.
3. **(MIN-2)** Uniformizar o tratamento de `message` array no handler do `loadViability` (padrão da tela de parâmetros).
4. **(MIN-4, oportunista)** Estreitar `investmentSourceLabel` para tipo não nulo ou devolver rótulo neutro para `null`.
5. **(Vigiar, sem ação)** `percentUpTo100Validator` (web) × `DecimalUpTo100` (API) é a 2ª implementação de "percentual ≤ limite" (rainfall tem `factorRangeValidator` ≤ 1); na 3ª ocorrência web, extrair para `form-utils`/domain.

## Veredito

**APROVADO COM OBSERVAÇÕES** — zero críticos e zero majors; 3ª entrega web consecutiva sem major. O grupo 3 está pronto para commit como está; os minors 1–4 podem ser tratados no próprio grupo (baratos) ou registrados para o QA/grupo 4 — nenhum bloqueia o avanço para as tasks 4.1–4.3 (seed, verificação completa e QA E2E, que exercita ao vivo os ramos apontados em MIN-3).


## Resolução (pós-review)

- **MIN-1** — signal `viabilityError` adicionado: o erro de leitura agora persiste no painel (`@else if (viabilityError())` com `role="alert"`) além do snackbar; limpo no início de cada carga. Teste do erro estendido para assertar a orientação visível na aba após o snackbar.
- **MIN-3** — teste novo cobrindo os dois ramos: teto inviável (`maxSupportableDiscountPercent` negativo → texto "inviável nas condições do edital" + classe `viability-bad` no `viability-max-verdict`) e rótulo de origem "informado pelo licitante" (BIDDER).
- **MIN-4** — `investmentSourceLabel(null)` agora devolve "não informado" (early return) em vez do fallback enganoso "estimativa ANEEL".
- **MIN-2** (mensagem array no snackbar) e **MIN-5** (`stripNegativeZero` na entrada) registrados sem ação — inalcançáveis com as respostas atuais da API; tratar na 3ª ocorrência.
- **Vigiar** mantido: `percentUpTo100Validator` (web) × `DecimalUpTo100` (API) = 2ª implementação de "percentual ≤ limite"; extrair na 3ª.

Reverificação: `npx nx test web --skip-nx-cache` verde (70 suítes / 393 testes), `npx nx format:check --all` limpo.