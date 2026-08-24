# Review do Grupo 5 — Interface de manutenção

**Revisor**: AI Code Reviewer
**Data**: 2026-08-24
**Change / Grupo**: catalogo-cabos-tirante / grupo 5 (tasks 5.1–5.3)
**Status**: Aprovado com observações

## Resumo

O grupo 5 entrega a UI de manutenção do catálogo de cabos de tirante: `GuyWiresApi` (20 linhas — estende `VersionedCatalogApi` sem override, pois não há filtro de tipo), componentes `guy-wire-list/-form/-history`, 4 rotas sob `/catalogs/guy-wires` e o link na navegação. O critério do design D4/D5 — código novo só com o específico do catálogo, sem blocos condicionais nem filtro de tipo — foi verificado por comparação linha a linha com os componentes `ground-wire-*`: o form é o precedente menos `type`/`selectedType`/`clearInactiveTypeFields`/fieldsets condicionais; a lista é o precedente menos o filtro; nada da base (`VersionedCatalogApi`, `form-utils`, patterns da domain) foi reimplementado. **Todas as lições institucionalizadas das reviews anteriores foram incorporadas e testadas**: callback de erro nas três leituras, prefill bloqueante com `disable/enable({emitEvent: false})`, botão refletindo `form.disabled`, id malformado rejeitado sem degradar para criação, branco→null via `form-utils` com `wireCount` numérico assertado no payload, vigência `dd/MM/yyyy` UTC e `createdAt` local. Verificado nesta review: `npx nx run-many -t test lint -p web domain` verde (41 testes no web, 12 novos), `npx nx format:check` completo com exit 0 e **nenhum BOM** nos 7 arquivos novos (checado byte a byte — o minor do grupo 1 não se repetiu). Restam apenas apontamentos minor de cobertura de teste.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| apps/web/src/app/catalogs/guy-wires-api.service.ts (novo) | ✅ Ok | 0 |
| apps/web/src/app/catalogs/guy-wire-list.component.ts (novo) | ✅ Ok | 0 |
| apps/web/src/app/catalogs/guy-wire-form.component.ts (novo) | ⚠️ Problemas | 1 (minor, herdado do precedente) |
| apps/web/src/app/catalogs/guy-wire-history.component.ts (novo) | ✅ Ok | 0 |
| apps/web/src/app/catalogs/guy-wire-list.component.spec.ts (novo) | ⚠️ Problemas | 1 (minor, busca sem teste) |
| apps/web/src/app/catalogs/guy-wire-form.component.spec.ts (novo) | ✅ Ok | 0 |
| apps/web/src/app/catalogs/guy-wire-history.component.spec.ts (novo) | ⚠️ Problemas | 1 (minor, guarda de id sem teste) |
| apps/web/src/app/catalogs/catalogs.routes.ts | ✅ Ok | 0 |
| apps/web/src/app/app.html | ✅ Ok | 0 |

## Verificação dos pontos de atenção solicitados

1. **Callback de erro em toda leitura** — as três leituras (`list` na listagem, `history` no prefill do form, `history` no histórico) têm callback de erro com mensagem pt-BR distinta, cada uma com teste (`exibe erro quando a API falha, em vez de fingir catálogo vazio`; `bloqueia o salvar e exibe erro quando o prefill falha`; `exibe erro quando o histórico não carrega`). O major recorrente da change anterior não se repetiu.
2. **Prefill bloqueante** — `prepareEdit` faz `form.disable({ emitEvent: false })` antes do `history(id)` e `enable({ emitEvent: false })` só no `next`; em erro o form permanece travado. `save()` retorna cedo com `form.disabled`, com comentário explicando o porquê (versão toda nula). Testado nos dois modos: prefill pendente (`NEVER`) e falho (`throwError`), ambos assertando que `createVersion` não é chamado.
3. **Botão submit** — `[disabled]="saving() || form.disabled"` (guy-wire-form.component.ts:150). Conforme.
4. **Id malformado** — form: `Number(idParam)` + `Number.isInteger(id) && id > 0`; reprova → "Identificador inválido" + form travado, testado (`rejeita identificador malformado na rota sem degradar para criação`, assertando que nem `create` nem `createVersion` são chamados). Histórico: guarda equivalente presente (guy-wire-history.component.ts:87-91), porém sem teste (minor 2).
5. **branco→null** — `orNull`/`intOrNull` importados de `./form-utils` (linha 15), não redeclarados; `toInput` cobre os 8 campos + spread condicional de `effectiveFrom`. Teste asserta `utsKn: null`, `galvanizationClass: null` e `wireCount: 7` (número, não string) no payload (RNF-09/RNF-08).
6. **Datas e a11y** — vigência com `date: 'dd/MM/yyyy' : 'UTC'` (data civil, teste asserta `01/07/2026` sem regressão de fuso); `createdAt` com `'dd/MM/yyyy HH:mm'` sem timezone (timestamp local) — a distinção da memória institucional respeitada. A11y: todo input com `label for`/`id`, erros com `role="alert"`, form de busca com `role="search"`, tabelas com `caption` e `th scope="col"`. Nenhum `role="status"` estático (vício apontado no piloto).
7. **Base sem duplicação** — `GuyWiresApi` estende sem override algum (correto: sem filtro de tipo, o `list(search?)` da base atende); patterns de validação vêm da `@lt-offers/domain` (D1); nenhuma cópia local de helper. A duplicação de template entre componentes é a decisão explícita do design (non-goal: abstração de UI).
8. **Cenários do spec** — pendências: teste da listagem com `strengthGrade: null` exibindo "Pendente: grau de resistência" (cenário literal do spec) + "Sem versão vigente"; histórico: versões com atributos, autor e data civil; validações do form (código obrigatório, fios fracionário rejeitado com mensagem pt-BR). Busca: comportamento implementado (termo → `list(term)`, vazio → `list(undefined)`), mas sem teste de componente (minor 1); o cenário do spec está coberto no nível da API (grupo 4).
9. **BOM UTF-8** — verificado byte a byte nos 7 arquivos novos: nenhum BOM (primeiros bytes `69 6D 70` = `imp`).
10. **`nx format:check`** — executado completo nesta review: exit 0. `run-many -t test lint -p web domain` verde (cache Nx para domain; web executado: 41 testes, lint limpo).

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

1. **Busca sem teste de componente** — `guy-wire-list.component.spec.ts`: não há teste assertando que o termo digitado é repassado a `api.list` (nem que termo vazio vira `undefined`). O precedente cobria o repasse do termo no teste «repassa o filtro por tipo à API mantendo o termo de busca» — que não foi trazido porque o filtro não existe aqui, levando junto a cobertura do termo. Sugestão:

   ```ts
   it('repassa o termo de busca à API', async () => {
     apiMock.list.mockReturnValue(of([]));
     const fixture = await mount();
     fixture.componentInstance.term.set('CT-HS');
     fixture.componentInstance.search(new Event('submit'));
     expect(apiMock.list).toHaveBeenLastCalledWith('CT-HS');
   });
   ```

2. **Guarda de id malformado do histórico sem teste** — `guy-wire-history.component.ts:87-91` rejeita id inválido com "Identificador inválido" sem chamar a API, mas `guy-wire-history.component.spec.ts` só testa id válido (sucesso e falha de rede). O form tem o teste equivalente; espelhá-lo no histórico custa ~10 linhas (montar com `id: 'abc'` e assertar mensagem + `api.history` não chamado). O precedente `ground-wire-history` tem a mesma lacuna — corrigir aqui evita propagá-la ao 4º catálogo.

3. **Rota de edição com id malformado renderiza a casca do modo criação (herdado do precedente)** — `guy-wire-form.component.ts`: com id inválido, `editId()` fica `null`, então o `<h2>` mostra "Novo cabo de tirante" e o campo código aparece (travado). Sem risco funcional — o form está desabilitado, o salvar é bloqueado e há teste garantindo que nada é enviado — mas a tela fica ambígua junto ao alerta "Identificador inválido". Comportamento idêntico ao `ground-wire-form` (paridade intencional); sem ação obrigatória nesta change — se for ajustar, alinhar os três catálogos de uma vez.

## ✅ Destaques Positivos

- **A extração provou-se também no front**: o serviço de API do terceiro catálogo tem 20 linhas (só o construtor com a base URL); o form não tem nenhum resquício de discriminador de tipo (nem `clearInactiveTypeFields`, nem fieldsets condicionais) — exatamente "o precedente menos o que não se aplica", como o design D4/D5 pedia.
- **Todas as lições das reviews anteriores institucionalizadas com teste**: erro em toda leitura, prefill bloqueante (incluindo o caso `NEVER`, que pega regressão de corrida), id malformado, payload null/número — os quatro majors/críticos históricos do web têm teste de regressão neste catálogo.
- **Comentário certeiro no guard do `save()`** explicando a consequência real (versão toda nula por cima dos valores vigentes) — conhecimento institucional da review do grupo 4 do piloto materializado.
- **Datas exemplares**: vigência como data civil em UTC com teste comentado sobre a regressão de fuso; `createdAt` local sem timezone — a distinção mais errada historicamente no projeto, correta aqui por construção.
- **Testes enxutos e comportamentais**: 12 testes assertam texto renderizado e chamadas à API (nunca internals), descrições em pt-BR narrando o requisito («em vez de fingir catálogo vazio», «evita versão toda nula»).
- **A11y consistente**: `role="search"`, `role="alert"` só em erros reais, `caption` nas tabelas, labels associados.

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ✅ Ok (inglês nos identificadores, pt-BR na UI/testes; sem números mágicos; funções curtas) |
| Typescript/Node.js | ✅ Ok (sem `any`; contratos da domain tipando signals e payloads) |
| Angular/NestJS/React | ✅ Ok (standalone + signals + `@if`/`@for`; rotas lazy pela feature; DI via `inject`) |
| REST/HTTP | ✅ Ok (consome a base `VersionedCatalogApi`; mensagens do servidor exibidas, incluindo array de validação) |
| Testes | ⚠️ Problemas (12 testes verdes cobrindo os pontos institucionais; 2 lacunas minor: busca e id do histórico) |
| Logging/Monitoramento | ✅ Ok (erros de API sempre visíveis ao usuário; nada a acrescentar nesta fase) |

## Recomendações

1. (Minor 1) Adicionar o teste de repasse do termo de busca em `guy-wire-list.component.spec.ts` — pode entrar junto com o commit do grupo ou no grupo 6 antes do QA.
2. (Minor 2) Espelhar no `guy-wire-history.component.spec.ts` o teste de id malformado do form (mensagem + API não chamada); considerar retrofitar no `ground-wire-history` na mesma oportunidade.
3. (Minor 3) Sem ação nesta change; se a casca do modo criação com id inválido incomodar no QA, tratar nos três catálogos juntos.
4. (Pendência da review anterior) O minor 1 do grupo 2-3-4 (helpers `decimalMessage`/`countMessage` triplicados nos DTOs da API) segue sem decisão — resolver ou registrar como dívida explícita antes do archive (grupo 6).

## Veredito

**Aprovado com observações.** Nenhum problema crítico ou major. O grupo 5 fecha a UI do catálogo de tirantes fiel ao design (D4/D5) e ao spec, com todas as lições institucionalizadas das reviews anteriores incorporadas e testadas — incluindo os dois pontos que já foram major no passado (format:check e callbacks de erro), ambos verificados limpos nesta review. Os três minors não bloqueiam o commit do grupo; os minors 1 e 2 são baratos e valem entrar antes do QA do grupo 6.
