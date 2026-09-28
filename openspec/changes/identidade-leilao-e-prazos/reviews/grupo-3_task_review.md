# Review do Grupo 3 — Interface web (tasks 3.1–3.5)

**Revisor**: AI Code Reviewer
**Data**: 2026-09-28
**Change / Grupo**: identidade-leilao-e-prazos / grupo 3
**Status**: APROVADO COM OBSERVAÇÕES

## Resumo

O grupo entrega a identidade normalizada do leilão e os prazos do edital nas duas telas de oferta (criação e aba "Parâmetros e Datas da Revisão"), a pré-visualização ao digitar da data-limite contratual e do deságio via `offer-derivations` da domain (implementação única, como o design D2 exige), o alerta RN-02 com um item por código e mensagens pt-BR, o deságio ao lado da RAP com formato `50,00%`/"não informado"/destaque negativo, as ações "Marcar vencedora" e "Iniciar execução" com confirm + snackbar de 409, e a clonagem com identidade de destino pré-preenchida enviando `target*`. Qualidade alta: zero críticos, todas as lições institucionais aplicadas (callbacks de erro testados, botão refletindo `form.disabled`, mensagens por igualdade exata, spy de `navigate` instalado antes do `createComponent` via hook `beforeCreate`, encoding limpo após o incidente do PowerShell). Verificação local: 361/361 testes web + domain verdes com `--skip-nx-cache`, `format:check --all` limpo, ausência de BOM e mojibake confirmada byte a byte nos 4 arquivos.

Um único major: o fluxo de clonagem envia `targetLotNumber` sem validação — entrada não numérica vira `NaN`, que o `JSON.stringify` serializa como `null`, e a clonagem mantém silenciosamente o lote da origem com snackbar de sucesso.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `apps/web/src/app/offers/offer-form.component.ts` | ✅ Ok | 1 minor (compartilhado, MIN-1) |
| `apps/web/src/app/offers/offer-detail.component.ts` | ⚠️ Problemas | 1 major, 6 minors |
| `apps/web/src/app/offers/offer-form.component.spec.ts` | ✅ Ok | 0 |
| `apps/web/src/app/offers/offer-detail.component.spec.ts` | ✅ Ok | 0 |
| `openspec/changes/identidade-leilao-e-prazos/tasks.md` | ✅ Ok | 0 (BOM pré-existente removido de quebra) |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

**M1 — Clonagem com lote de destino não numérico mantém silenciosamente o lote da origem**
`apps/web/src/app/offers/offer-detail.component.ts:2806`

O prompt do lote de destino não valida a entrada antes de enviar:

```ts
targetLotNumber: intOrNull(newLotNumber),
```

`intOrNull('abc')` devolve `Number('abc') = NaN`; o `HttpClient` serializa o corpo com `JSON.stringify`, que converte `NaN` em `null`; o `clone-offer.usecase` interpreta `null` como "não informado" e copia o lote da origem. Resultado: o usuário digita lixo acreditando ter alterado o lote, a clonagem "sucede" com snackbar de sucesso e a oferta nova carrega a identidade da origem — degradação silenciosa de dados, o mesmo modo de falha que reviews anteriores classificaram como major (prefill silencioso). Os campos análogos nas telas têm `Validators.pattern(/^\d+$/)` que bloqueia o save; só o caminho da clonagem fica sem guarda (`targetAuctionNumber` inválido pelo menos gera 400 pt-BR no snackbar; `NaN` não chega a produzir erro). Correção sugerida — validar antes de enviar, abortando com snackbar:

```ts
const trimmedLot = newLotNumber.trim();
if (trimmedLot !== '' && !/^\d+$/.test(trimmedLot)) {
  this.snackBar.open(
    'O número do lote de destino deve ser um número inteiro.',
    'Fechar',
    { duration: 5000 },
  );
  return;
}
```

Adicionar teste: clonagem com lote de destino `'abc'` → `api.clone` não é chamado e a mensagem aparece no snackbar.

### 🟢 Problemas Minor

**MIN-1 — `civilDateValidator` duplicado nos dois componentes e declarado no meio do bloco de imports**
`offer-form.component.ts:36-41` e `offer-detail.component.ts:51-56`

A mesma função de 5 linhas aparece idêntica nos dois arquivos (2ª ocorrência — a regra das três dispararia na próxima), e no detail ela foi inserida **entre** os imports (`form-utils` na linha 47, a função nas linhas 51–56, `StakingTableComponent` na linha 57). É válido em TS (imports são içados) e o ESLint atual não acusa, mas quebra a organização do arquivo. Como `form-utils.ts` já é o lar dos validadores compartilhados da web (`decimalScaleValidator`), mover `civilDateValidator` para lá agora resolve a duplicação e o posicionamento de uma vez.

**MIN-2 — Token CSS inexistente `--solaris-surface-low` no bloco novo `.derived-inline`**
`offer-detail.component.ts:2164`

O token definido em `styles.scss` é `--solaris-surface-container-low`; `--solaris-surface-low` não existe em lugar nenhum do projeto, então o `var()` resolve para nada e o fundo fica transparente. O uso novo copiou 4 ocorrências pré-existentes do mesmo token fantasma no próprio arquivo (linhas 1826/1871/2039/2195) — e o offer-form novo usa o token **correto** (`derived-preview`, `--solaris-surface-container-low`), deixando as duas telas visualmente inconsistentes. Corrigir a ocorrência nova é uma palavra; as pré-existentes podem ir juntas ou ficar para uma passada de consolidação.

**MIN-3 — Hex literals novos estendem desvio pré-existente do DESIGN.md**
`offer-detail.component.ts:1923-1928, 1958-1967, 2174-2181`

Os chips/dots `WON`/`IN_EXECUTION` e o estado `discount-negative` usam ~12 hex literals novos (`#ca8a04`, `#7c3aed`, `#fef9c3`, `#fee2e2`, `#991b1b`…). O DESIGN.md (autoridade de layout, linhas 112 e 210) proíbe hex literal em componentes — mas o componente inteiro já viola a regra (chips DRAFT/FROZEN/DELIVERED, alert-schedule), e a consistência local com a paleta existente foi a escolha certa aqui. Registrar para uma change de consolidação de tokens; não corrigir isoladamente.

**MIN-4 — Mensagens de validação do detail divergem do espelho exato da API**
`offer-detail.component.ts:1467-1471, 1591-1596`

O offer-form espelha as mensagens da API por igualdade exata (assertado nos testes); o detail combina pares em uma mensagem só: lote → "deve ser um número inteiro maior ou igual a 1" (API separa `IsInt` e `Min`), prazo → "deve ser um número inteiro entre 1 e 240 meses" (API separa em três). Aceitável para mat-error único por campo, mas se a API devolver 400 o snackbar exibirá um texto diferente do inline. Registrar; alinhar se incomodar no QA.

**MIN-5 — `cloneCurrentOffer` com 60 linhas (limite do projeto: 50)**
`offer-detail.component.ts:2764-2823`

Os 3 prompts novos levaram o método acima do limite. Extrair a coleta da identidade de destino para um `private promptCloneIdentity(rev): CloneIdentity | null` resolve e é o lugar natural para a validação do M1.

**MIN-6 — Botões "Marcar vencedora"/"Iniciar execução" sem `[disabled]="saving()"`**
`offer-detail.component.ts:293-318`

Duplo clique dispararia dois `PUT` (o segundo levaria 409 no-op-ou-rejeição). Segue o padrão pré-existente de `freezeRevision`/`markDelivered` (também sem guarda) e o `confirm()` mitiga; registrar para tratar os quatro juntos.

**MIN-7 — Clonagem com 5 prompts sequenciais (padrão `prompt()` esticado)**
`offer-detail.component.ts:2768-2798`

O D5/task 3.4 fala em "diálogo"; a decisão de manter `prompt()` pela consistência com o componente (que usa prompt/confirm em toda parte) é aceita — funcionalmente o cenário está coberto (pré-preenchimento assertado nos testes, `target*` enviados, vazio = mantém origem conforme D3). Mas 5 prompts em série sem validação nem visão de conjunto é o limite prático do padrão; registrar a migração para `MatDialog` (dívida já anotada como matDatepicker/mat-dialog na change design-system-swiss) quando a clonagem ganhar mais um campo.

## ✅ Destaques Positivos

1. **Implementação única das derivações provada na prática**: web e API consomem as mesmas `discountPercent`/`contractualDeadlineDate`/`scheduleWarnings` da domain — a pré-visualização reage à digitação sem duplicar regra alguma, exatamente o que o D2 queria evitar (4ª duplicação). A derivação ao vivo no detail é ainda **necessária**, não só conveniente: o envelope da API carrega apenas os códigos (`ScheduleWarningCode[]`), e a mensagem de `DEADLINE_AFTER_COD` precisa citar a data derivada, que só o `ScheduleWarning` completo da função traz.
2. **`warningMessage` com `switch` exaustivo sem `default`**: um código novo na domain quebra a compilação da web — o drift entre códigos e mensagens é impossível em silêncio.
3. **Espelhamento exato das mensagens da API no offer-form**, assertado por igualdade completa nos testes (formato NNN/AAAA, lote ≥ 1, sublote ≤ 3, data civil com round-trip, prazo 1..240) — incluindo `2027-02-30` rejeitado sem rollover pelo `civilDateValidator` sobre `isValidCivilDate` (achado recorrente nº 1 do projeto, coberto na web de primeira).
4. **Limpeza de campos funciona de ponta a ponta**: `orNull('')` envia `null` explícito, que o fix do MIN-1 do grupo 2 na API interpreta como "limpar o campo" — a recomendação da review anterior foi consumida corretamente.
5. **Testes fortes e específicos**: payload com os 5 campos e sublote uppercase (`'4a'` → `'4A'`), prompts da clonagem assertados por posição (`toHaveBeenNthCalledWith` 3–5) com pré-preenchimento da origem, 409 assertado pela mensagem pt-BR completa da API, três alertas RN-02 com textos exatos renderizados na aba, botões submit desabilitados via `form.disable()` real no DOM, e o hook `beforeCreate` no `mount` que instala o spy de `navigate` **antes** do `createComponent` — solução limpa para testar efeito de erro no construtor.
6. **Higiene do mock apertado**: `mockDetail` ganhou os derivados obrigatórios do contrato (`contractualDeadlineDate`/`discountPercent`/`scheduleWarnings`) com `discountPercent: '16.00'` consistente com as RAPs do próprio mock (25M/21M) — o mock não mente.
7. **Incidente de encoding bem resolvido**: a corrupção via `Set-Content` foi restaurada do HEAD e reaplicada via Edit; verificação byte a byte confirma ausência de BOM (`69 6d 70`) e de mojibake nos 4 arquivos ("Ã"/"Â" encontrados são LEILÃO/PARÂMETROS legítimos). De quebra, o BOM U+FEFF pré-existente do `tasks.md` foi removido.
8. **Fluxo de status coerente com a máquina de estados da API**: botões por estado (`DELIVERED` → vencedora, `WON` → execução), "Nova revisão" disponível nos estados imutáveis, chips/dots com os 5 status, e o botão de salvar parâmetros só renderiza em rascunho (`@if (isDraft())`) além de refletir `invalid`/`disabled`.

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ⚠️ Problemas (MIN-1 duplicação/posicionamento; MIN-5 método > 50 linhas) |
| Typescript/Node.js | ✅ Ok (sem `any`; tipos da domain importados; exaustividade em compilação) |
| Angular/NestJS/React | ⚠️ Problemas (M1 validação ausente no fluxo de prompt; MIN-2 token CSS inexistente; MIN-3 hex vs DESIGN.md) |
| REST/HTTP | ✅ Ok (endpoint de atualização reutilizado; 409 exibido; null explícito limpa campos) |
| Testes | ✅ Ok (11 testes novos cobrindo os cenários web do delta spec; 361/361 verdes sem cache) |
| Logging/Monitoramento | ✅ Ok (snackbar com mensagem da API e fallback pt-BR em toda mutação/leitura) |

## Recomendações

1. **(M1)** Validar `targetLotNumber` (e por simetria `targetAuctionNumber` contra `AUCTION_NUMBER_PATTERN`, opcional) no fluxo de clonagem antes do envio, com snackbar e abort; teste de regressão para entrada não numérica. Corrigir antes do commit do grupo.
2. **(MIN-1)** Mover `civilDateValidator` para `form-utils.ts` (resolve duplicação e o posicionamento no meio dos imports de uma vez).
3. **(MIN-2)** Trocar `--solaris-surface-low` por `--solaris-surface-container-low` na `.derived-inline`; avaliar corrigir as 4 ocorrências pré-existentes na mesma passada.
4. **(MIN-5)** Extrair `promptCloneIdentity` de `cloneCurrentOffer` — lugar natural para o fix do M1.
5. **(MIN-3, MIN-6, MIN-7)** Registrar sem ação nesta change: consolidação de hex → tokens, guarda `saving()` nos 4 botões de status, migração da clonagem para `MatDialog`.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero críticos; um major pontual no fluxo de clonagem (entrada não numérica silenciosamente ignorada via `NaN → null`) com correção pequena e localizada, e minors de organização/estilo. As três decisões destacadas pelo implementador foram escrutinadas e aceitas: (1) `prompt()` na clonagem — consistente com o componente, condicionado à validação do M1 e com a dívida MatDialog registrada (MIN-7); (2) alerta RN-02 derivado ao vivo do formulário — não só aceito como necessário, pois o envelope só traz códigos e a mensagem precisa da data derivada; (3) envelope `scheduleWarnings` sem uso direto na web — sem risco de drift, já que é a mesma função da domain nas duas bordas. Corrigir o M1 (e de preferência MIN-1/MIN-2, ambos triviais) antes do commit do grupo; prosseguir para o grupo 4 em seguida.

---

## Resolucao (pos-review, antes do commit do grupo)

- **M1 corrigido**: cloneCurrentOffer valida o lote de destino com ^\d+$ antes do envio (nao numerico -> snackbar e aborta, sem chamar a API); teste de regressao adicionado (362 testes verdes).
- **MIN-1 corrigido**: civilDateValidator extraido para catalogs/form-utils.ts (mesma domain da API); copias locais removidas dos dois componentes e imports do detail reorganizados.
- **MIN-2 corrigido**: token CSS da .derived-inline trocado para --solaris-surface-container-low (o --solaris-surface-low nao existe).
- Warnings de non-null assertion introduzidos nos 2 specs trocados por optional chaining (18 warnings restantes sao pre-existentes).
- MIN-3 (hex literals, desvio pre-existente do DESIGN.md), MIN-4, MIN-5, MIN-6 e MIN-7 (divida MatDialog na clonagem) registrados sem acao nesta change.
