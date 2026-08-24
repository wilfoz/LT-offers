# Review do Grupo 4 — catalogo-cabos-guarda-opgw

**Revisor**: AI Code Reviewer
**Data**: 2026-08-23
**Change / Grupo**: catalogo-cabos-guarda-opgw / grupo 4 (Interface de manutenção, tasks 4.1–4.5)
**Status**: Aprovado com observações

## Resumo

O grupo entrega a interface de manutenção do catálogo de cabos de guarda: serviço HTTP, listagem com busca + filtro por tipo + pendências, formulário com campos condicionais ao tipo (seleção travada na edição), histórico com colunas específicas do tipo, rótulos centralizados em `ground-wire-labels.ts`, quatro rotas novas e link de navegação. Todas as lições das reviews do piloto foram institucionalizadas nesta entrega: callback de erro em todo subscribe de leitura (com testes de regressão), prefill da edição bloqueando o salvar via `form.disable()` (pendente e em falha), `format:check` limpo, coluna Bobina na listagem, badge de pendência sem `role="status"`, guarda de `:id` no histórico e `effectiveFrom` obrigatório no tipo da nova versão (`NewGroundWireVersionInput`). A exibição de datas mantém a distinção exata: vigência (data civil) com `date: 'dd/MM/yyyy' : 'UTC'`, `createdAt` (timestamp) no fuso local.

Não há problema crítico. Há **um major**: no modo de criação, um valor inválido digitado num campo específico e depois **ocultado pela troca de tipo** mantém o formulário inválido — o Salvar passa a não fazer nada, sem nenhuma mensagem visível (o erro está dentro do fieldset não renderizado). É um beco sem saída de UX, recuperável apenas voltando ao tipo anterior.

Verificação executada pelo revisor: `npx nx run-many -t test lint -p web domain` → 7 suites, 27 testes (16 novos do grupo), tudo verde; lint limpo. `npx nx format:check` **completo** → limpo (gate do CI, `.github/workflows/ci.yml`).

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `apps/web/src/app/catalogs/ground-wires-api.service.ts` | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/ground-wire-labels.ts` | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/ground-wire-list.component.ts` | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/ground-wire-form.component.ts` | ⚠️ Problemas | 1 major, 3 minors |
| `apps/web/src/app/catalogs/ground-wire-history.component.ts` | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/catalogs.routes.ts` | ✅ Ok | 0 |
| `apps/web/src/app/app.html` | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/ground-wire-list.component.spec.ts` | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/ground-wire-form.component.spec.ts` | ✅ Ok | falta regressão do M1 |
| `apps/web/src/app/catalogs/ground-wire-history.component.spec.ts` | ✅ Ok | 1 minor (compartilhado, ver minor 4) |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

**M1 — Campo inválido oculto pela troca de tipo trava o Salvar sem nenhum feedback**

- Arquivo: `apps/web/src/app/catalogs/ground-wire-form.component.ts:319-327` (fluxo `save()`), `:111-176` (fieldsets condicionais), `:281-295` (nenhum reset na troca de tipo)
- Reprodução (modo criação): selecionar tipo **Aço**, digitar `wireCount` inválido (ex.: `abc` ou `0`), trocar o tipo para **OPGW** e preencher tudo corretamente → Salvar. O `markAllAsTouched()` + `form.invalid` bloqueiam o envio, mas a mensagem de erro do `wireCount` está dentro do fieldset de aço, que **não é renderizado** com o tipo OPGW — e `serverError` segue vazio. Resultado: botão Salvar aparentemente funcional que não faz nada, sem qualquer mensagem na tela. O simétrico vale para `i2tKa2s`/`fiberCount` inválidos ao voltar de OPGW para aço. Os controles do outro tipo nunca são resetados (só **anulados no payload** pelo `toInput()` — correto para RNF-09, mas insuficiente para o estado de validação).
- **Correção sugerida**: limpar os controles do tipo não selecionado antes da checagem de validade no `save()` (não no `valueChanges` de `type`, que também emite `''` durante `disable()`/`enable()` do prefill e apagaria valores pré-preenchidos):

```ts
save(): void {
  if (this.form.disabled) {
    return;
  }
  this.resetInactiveTypeFields();
  this.form.markAllAsTouched();
  if (this.form.invalid) {
    return;
  }
  // ...
}

private resetInactiveTypeFields(): void {
  const inactive =
    this.selectedType() === 'STEEL'
      ? (['manufacturer', 'i2tKa2s', 'fiberCount'] as const)
      : (['galvanizationClass', 'strengthGrade', 'wireCount'] as const);
  for (const name of inactive) {
    this.form.controls[name].reset('');
  }
}
```

  Acrescentar teste de regressão: tipo aço com `fiberCount: '2.5'` residual → trocar para o payload/fluxo do outro tipo → `save()` deve enviar (campo residual não pode bloquear nem vazar).

### 🟢 Problemas Minor

1. **Contorno frágil da reemissão do `enable()`** — `ground-wire-form.component.ts:383-385`: o comentário documenta que `form.enable()` reemite `valueChanges` de `type` com `''` e o `selectedType.set(history.type)` posterior corrige. A ordem é de fato garantida (as emissões do `enable()` são síncronas e o re-set roda depois, no mesmo callback), mas a correção depende dessa ordem e de o leitor conhecer o detalhe. `this.form.enable({ emitEvent: false })` elimina a reemissão, o re-set duplicado e o comentário. No mesmo tema, o subscribe de `valueChanges` no construtor (`:283-285`) ficaria mais idiomático com `takeUntilDestroyed()` (inofensivo hoje — o form morre com o componente).
2. **Botão Salvar habilitado com o formulário desabilitado** — `ground-wire-form.component.ts:197` (`[disabled]="saving()"`): com o prefill pendente ou falho, o clique cai no guard `form.disabled` (`:322`) e vira no-op silencioso — o guard está correto (evita a versão toda nula), mas o botão parece funcional. Usar `[disabled]="saving() || form.disabled"` comunica o estado (e dispensa o clique morto).
3. **Id de edição malformado cai no modo de criação** — `ground-wire-form.component.ts:287-294`: em `/catalogs/ground-wires/abc/edit`, `Number('abc')` reprova a guarda e o componente abre como "Novo cabo de guarda" (com código/tipo exigidos), em vez de sinalizar o problema — inconsistente com o histórico, que mostra "Identificador inválido" (`ground-wire-history.component.ts:106-108`). Se `idParam !== null` e a conversão falhar, exibir o mesmo erro em vez de degradar para criação.
4. **Terceira ocorrência dos padrões de validação duplicados** — `ground-wire-form.component.ts:13-15` repete `DECIMAL_PATTERN`/`POSITIVE_INT_PATTERN`/`DATE_PATTERN` que já existem em `conductor-cable-form.component.ts` e na API (`version-fields.dto.ts:3`). Pela regra das três ocorrências (design do piloto), este é o momento de mover os patterns para `libs/domain` (junto dos contratos), garantindo que web e API validem com a mesma regex por construção.

## ✅ Destaques Positivos

- **Todas as lições do grupo 4 do piloto aplicadas e testadas**: callback de erro nas três leituras (listagem distingue "erro" de "vazio", histórico não fica em "Carregando…" eterno, prefill falho bloqueia o salvar com aviso) — cada estado com teste de regressão; prefill via `form.disable()` fecha inclusive a janela de corrida entre carregamento e submit rápido, com o guard documentado em `save()`.
- **Minors do piloto fechados por padrão**: coluna Bobina (m) presente na listagem; badge de pendência como `<strong>` (sem `role="status"`); guarda de `:id` no histórico; `NewGroundWireVersionInput` com `effectiveFrom` obrigatório no contrato (o compilador agora protege o `createVersion`); `maxlength` espelhado nos campos de texto (50/200/50/50/100, idênticos aos `MaxLength` da API).
- **RNF-09 com a novidade da change bem resolvida no payload**: `orNull`/`intOrNull` + anulação dos campos do outro tipo no `toInput()`, com teste assertando que `manufacturer`/`fiberCount` digitados antes da troca para aço **não vazam** (`manufacturer: null`, `fiberCount: null`) — exatamente o cenário de aplicabilidade por tipo do spec.
- **Espelhamento fiel da validação da API**: `DECIMAL_PATTERN` idêntico ao `POSITIVE_DECIMAL_PATTERN` da API (zero permitido — coerente com RNF-09, onde zero é valor válido distinto de null), `^[1-9]\d*$` para contagens espelhando `IsInt`+`Min(1)`, mensagens pt-BR com exemplo de formato.
- **Datas exatas**: vigência com `date: 'dd/MM/yyyy' : 'UTC'` (imune ao off-by-one em BRT) e `createdAt` no fuso local — a distinção data civil × instante preservada, com teste assertando `01/02/2026`.
- **Cenários do spec cobertos com asserções no DOM e no payload**: tipo exibido na listagem, pendência com rótulo pt-BR do campo, filtro por tipo **mantendo o termo de busca** (asserção `toHaveBeenLastCalledWith('CG', 'OPGW')`), campos condicionais alternando, tipo travado na edição (`select#type` ausente + "fixo desde a criação"), payload da nova versão sem `type`, histórico com colunas específicas por tipo.
- **Acessibilidade básica**: `label for`/`id` em todos os campos, `fieldset`/`legend` nos blocos condicionais, `role="alert"` nas mensagens de erro, `role="search"` no form de busca, `caption` e `scope="col"` nas tabelas, `inputmode` decimal/numeric.
- **`ground-wire-labels.ts` como módulo de apresentação**: rótulos de tipo e resumo dos atributos específicos centralizados, com "—" para não informado (ausência visível, nunca zero) — boa separação entre domínio e exibição.

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ✅ Ok |
| TypeScript/Node.js | ✅ Ok |
| Angular (standalone + signals, D4) | ⚠️ Problemas (M1 — estado de validação na troca de tipo) |
| REST/HTTP (consumo) | ✅ Ok (erro tratado em toda leitura) |
| pt-BR na interface / código em inglês (RNF-14) | ✅ Ok |
| Decimal como string (D3/RNF-08) | ✅ Ok |
| Null ≠ zero (RNF-09) | ✅ Ok |
| Acessibilidade básica | ✅ Ok |
| Testes | ⚠️ Problemas (16 novos verdes; falta a regressão do M1) |
| Formatação (`nx format:check` completo) | ✅ Ok |
| Logging/Monitoramento | ✅ Ok (nada exigido no grupo) |

## Recomendações

1. **(M1)** Resetar os controles do tipo não selecionado no início do `save()` (não no `valueChanges` de `type`, para não interferir no prefill da edição), com teste de regressão do fluxo "valor inválido digitado → troca de tipo → salvar".
2. Trocar `form.enable()` por `form.enable({ emitEvent: false })` no prefill, removendo o re-set do `selectedType` e o comentário de contorno (minor 1).
3. Refletir `form.disabled` no `[disabled]` do botão Salvar (minor 2) e sinalizar id de edição malformado como erro em vez de degradar para criação (minor 3).
4. Mover `DECIMAL_PATTERN`/`POSITIVE_INT_PATTERN`/`DATE_PATTERN` para `libs/domain` — terceira ocorrência, a regra do design do piloto manda extrair agora (minor 4); pode ser feito nesta change ou registrado como task da próxima.
5. Registrar no QA (task 5.1) a verificação ao vivo do fluxo de troca de tipo no formulário, que é a novidade desta change e onde mora o M1.

## Veredito

**APROVADO COM OBSERVAÇÕES.** O grupo 4 entrega a interface completa e aderente ao design D4, com todos os padrões obrigatórios herdados do piloto aplicados e testados — tratamento de erro nas leituras, prefill bloqueante, datas civis em UTC, RNF-09 de ponta a ponta com anulação por tipo, `format:check` completo limpo. Não há defeito crítico nem risco de corrupção de dados. Antes do commit do grupo (ou junto dele), corrigir o M1 — o beco sem saída do Salvar com campo inválido oculto pela troca de tipo — com sua regressão; os minors 1–3 são de baixo custo e cabem no mesmo commit; o minor 4 (extração dos patterns para `libs/domain`) pode ser registrado para a sequência.
