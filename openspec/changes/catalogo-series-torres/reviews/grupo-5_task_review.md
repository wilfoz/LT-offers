# Review do Grupo 5 — Interface de manutenção (UI Angular)

**Revisor**: AI Code Reviewer
**Data**: 2026-08-24
**Change / Grupo**: catalogo-series-torres / grupo 5 (tasks 5.1 a 5.5)
**Commit**: `be9690a`
**Status**: Aprovado com observações

## Resumo

O grupo entrega a interface completa do catálogo de séries e torres: `StructureSeriesApi` estendendo `VersionedCatalogApi` (com `get(id)` adicional para a página de detalhe), `TowerTypesApi` standalone com `seriesId` explícito em toda rota (limite D4 documentado no próprio serviço), listagem/form/histórico de séries no padrão consolidado dos catálogos, página de detalhe da série com a tabela de tipos de torre vigentes, e o formulário de tipo de torre com a **primeira ocorrência de `FormArray` no projeto** (tabela peso × altura com validação por linha, escala espelhando o banco 3/2, duplicata de altura apontada antes do submit com comparação numérica).

Qualidade alta: **zero problemas críticos e zero majors** — terceira entrega de UI seguida sem major. Todas as lições institucionais das reviews anteriores vieram aplicadas e testadas de primeira, incluindo a lacuna recorrente dos históricos (guarda de id malformado agora testada nos dois componentes de histórico). A condição registrada no MIN-3 da review dos grupos 2-3-4 (UI validar por linha antes do submit, para o usuário não ver o prefixo cru `weights.0.` da API) **foi cumprida**. Encontrados apenas 4 minors, todos em estados de erro/rota malformada ou lapidação.

Verificação executada: `npx nx run-many -t test lint -p web domain` (web 81/81 testes verdes, 38 novos; lint limpo), `npx nx format:check` **completo** limpo, sem BOM UTF-8 em nenhum arquivo novo (`head -c3 | od`).

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `apps/web/src/app/catalogs/structure-series-api.service.ts` | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/tower-types-api.service.ts` | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/structure-series-list.component.ts` (+spec) | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/structure-series-form.component.ts` (+spec) | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/structure-series-history.component.ts` (+spec) | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/structure-series-detail.component.ts` (+spec) | ⚠️ Problemas | 1 minor |
| `apps/web/src/app/catalogs/tower-type-form.component.ts` (+spec) | ⚠️ Problemas | 3 minors (1 compartilhado) |
| `apps/web/src/app/catalogs/tower-type-history.component.ts` (+spec) | ⚠️ Problemas | 1 minor (compartilhado) |
| `apps/web/src/app/catalogs/tower-function-labels.ts` | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/catalogs.routes.ts` | ✅ Ok | 0 |
| `libs/domain/src/lib/catalogs/validation.ts` | ✅ Ok | 0 |
| `apps/web/src/app/app.html` | ✅ Ok | 0 |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

**MIN-1 — Links de navegação com segmento nulo quando um id de rota é malformado**

- Arquivos: `apps/web/src/app/catalogs/tower-type-form.component.ts:179` (link Cancelar) e `apps/web/src/app/catalogs/tower-type-history.component.ts:19` (link "Voltar à série")
- Quando um dos ids da rota é malformado, `seriesId()` permanece `null` e o template renderiza `[routerLink]="['/catalogs/structure-series', seriesId()]"` com segmento nulo. Verificado no fonte do Angular 22.0.6: `validateCommands` (que rejeita comando nulo com RuntimeError 4008) só roda em `Router.navigate` — o `RouterLink` computa o href via `createUrlTree` sem validação, então **não quebra a renderização** (os testes com id malformado passam), mas o href gerado é `/catalogs/structure-series/null`. Clicar leva ao detalhe com "Identificador inválido" — degradação graciosa, porém o destino correto era a listagem.
- Agravante no histórico do tipo: a guarda valida os dois ids em conjunto e retorna **antes** de `this.seriesId.set(seriesId)` (`tower-type-history.component.ts:106-115`) — quando só o id do TIPO é malformado e o `seriesId` é válido, um link "Voltar à série" que poderia funcionar também degrada para o href nulo.
- Correção sugerida: setar `seriesId` assim que validado (guardas independentes) e, nos templates, fallback para a listagem quando nulo:

```html
<a [routerLink]="seriesId() !== null
  ? ['/catalogs/structure-series', seriesId()]
  : ['/catalogs/structure-series']">
```

**MIN-2 — Detalhe com id malformado exibe estado vazio enganoso na seção de tipos**

- Arquivo: `apps/web/src/app/catalogs/structure-series-detail.component.ts:85-86` (e `:17`)
- Com id malformado o construtor seta `seriesError` e `typesLoading=false`, mas a seção de tipos cai no ramo `types().length === 0` e mostra "Nenhum tipo de torre cadastrado nesta série." abaixo do erro "Identificador inválido"; o `<h2>` fica com travessão pendurado ("Série de estrutura — "). Parente do minor recorrente da "casca do modo criação" já registrado para os 3 catálogos de cabos — cosmético, tratar em conjunto se for tratado.
- Correção sugerida: suprimir a seção de tipos (ou exibir "—") quando `seriesError()` está setado e `seriesId()` é nulo.

**MIN-3 — Lição do FormArray sem teste direto: remover a linha inválida desbloqueia o Salvar**

- Arquivo: `apps/web/src/app/catalogs/tower-type-form.component.spec.ts:51-61`
- O análogo FormArray da lição institucional dos campos condicionais ocultados (controle inválido invisível travando o submit sem mensagem) aqui é: linha com valor inválido → `removeWeight` → form volta a ser válido e o Salvar funciona. O comportamento é correto por construção (`removeAt` remove os controles do array e revalida), mas o teste de add/remove só conta linhas — o cenário-lição não está fixado contra regressão.
- Correção sugerida: teste que adiciona linha inválida, confirma submit bloqueado, remove a linha e assert que `save()` chama a API.

**MIN-4 — Chaves de erro do validador de linha com nome enganoso para a coluna de altura**

- Arquivo: `apps/web/src/app/catalogs/tower-type-form.component.ts:33-45`
- `weightValueValidator` devolve `{ weightValue }` / `{ weightScale }` também para o controle `heightM` — "weight" no nome da chave para um erro de altura lê mal em depuração. Sugerido: `invalidDecimal` / `decimalScale` (neutros à coluna). Nit de nomenclatura; comportamento correto.

## ✅ Destaques Positivos

1. **Condição do MIN-3 da review anterior cumprida**: validação por linha no `FormArray` antes do submit — `required` + decimal positivo + **escala espelhando a precisão do banco** (altura 3 casas, peso 2, com mensagens pt-BR por linha e `role="alert"`). O usuário normalmente nunca vê o prefixo cru `weights.0.` do 400 da API; a decisão registrada na review dos grupos 2-3-4 se sustenta.
2. **Duplicata de altura por comparação numérica** ("24" ≡ "24.000", como a API compara) apontada antes do submit e testada exatamente nesse caso de zeros à direita.
3. **RNF-09 exemplar no caso mais traiçoeiro do levantamento**: zero estais enviado como número `0` (autoportante) e branco como `null`, ambos com teste de payload; aviso na tela explica a distinção. `NON_NEGATIVE_INT_PATTERN` novo na domain, documentado, consistente com o `@IsInt @Min(0)` da API.
4. **A lacuna recorrente dos históricos foi fechada**: guarda de id malformado TESTADA nos dois componentes de histórico (era o minor em aberto desde ground-wires/guy-wires).
5. **Todas as lições institucionais aplicadas de primeira**: erro de API em toda leitura com teste (incl. os dois erros independentes do detalhe — série falha sem esconder tipos e vice-versa); prefill bloqueante via `form.disable()`/`enable({emitEvent:false})` com testes `NEVER` e `throwError`; botão `[disabled]="saving() || form.disabled"`; id malformado não degrada para criação (testado com os DOIS ids); vigência `dd/MM/yyyy` UTC vs `createdAt` local; sem BOM; format:check completo limpo.
6. **Limite D4 da base extraída documentado no ponto exato**: comentário no `TowerTypesApi` explica por que não estende `VersionedCatalogApi`, com referência ao design — insumo honesto para a reavaliação da abstração.
7. **Ordem das rotas correta**: `structure-series/:id` (detalhe) declarada por último, não capturando `new` nem as rotas aninhadas de tower-types.
8. **Histórico do tipo por época**: cada versão como `article` com sua tabela completa, versão sem pontos sinalizada ("Sem pontos na tabela peso × altura"), teste asserta as duas tabelas preservadas por época — cobre fielmente o cenário "Versão anterior preserva a tabela da época" do spec.
9. **38 testes novos** (web 81 total) mapeando 1:1 os cenários de UI do spec: pendências dos dois níveis (série sem SIL, tipo sem pontos, zero estais sem pendência), busca repassada à API (o teste que tinha sido podado no guy-wires está presente aqui), `towerTypeCount`, série sem versão vigente.

## Conformidade com Padrões

| Padrão | Status |
|--------|--------|
| Padrões de Código | ✅ Ok |
| TypeScript/Node.js | ✅ Ok (sem `any`, contratos da domain, signals tipados) |
| Angular | ✅ Ok (standalone, signals, control flow `@if`/`@for`, lazy routes) |
| REST/HTTP | ✅ Ok (rotas aninhadas espelhando a API, seriesId explícito) |
| Testes | ✅ Ok (81/81 verdes; MIN-3 é lacuna pontual de cenário) |
| Idiomas (código EN / UI pt-BR) | ✅ Ok (rótulos de função pt-BR via `TOWER_FUNCTION_LABELS`) |
| Formatação (`nx format:check` completo) | ✅ Ok |

## Recomendações

1. (MIN-1) Setar `seriesId` assim que validado nos componentes de tipo de torre e dar fallback para a listagem nos links quando nulo — elimina os hrefs `/catalogs/structure-series/null` nos estados de rota malformada.
2. (MIN-3) Acrescentar o teste "linha inválida removida desbloqueia o Salvar" no spec do tower-type-form, fixando a lição do FormArray contra regressão.
3. (MIN-4) Renomear as chaves de erro do validador de linha para nomes neutros à coluna (`invalidDecimal`/`decimalScale`).
4. (MIN-2) Tratar o estado vazio enganoso do detalhe com id malformado junto com o minor cosmético equivalente já registrado para os 3 catálogos de cabos, se/quando for tratado.
5. Prosseguir para o grupo 6 (QA + fechamento); nenhuma correção é bloqueante.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero críticos e zero majors — a primeira ocorrência de `FormArray` no projeto chegou com validação por linha, duplicata numérica pré-submit e prefill corretos e testados, e todas as lições institucionais acumuladas (incluindo a lacuna dos históricos, enfim coberta) vieram aplicadas de primeira. Os 4 minors estão confinados a estados de rota malformada, um nit de nomenclatura e uma lacuna pontual de teste; podem ser tratados no grupo 6 ou registrados como lapidação futura. O grupo está pronto para o QA (task 6.1).
