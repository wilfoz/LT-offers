# Review dos Grupos 1 e 2 (tasks 1.1–1.4 e 2.1–2.3)

**Revisor**: AI Code Reviewer
**Data**: 2026-08-25
**Change / Grupo**: reavaliacao-base-catalogos / grupos 1 e 2
**Status**: Aprovado com observações

## Resumo

Reavaliação da base extraída de catálogos devida após o 5º catálogo (change com `skip_specs: true` — refactor + testes, nenhum requisito muda). O grupo 1 extrai o predicado `decimalScaleViolation` para `libs/domain` e elimina as 4 cópias da validação "decimal com escala" (2 na API, 2 no web); o grupo 2 retrofita a guarda de id malformado no form do piloto (única mudança de comportamento observável), quita a dívida de teste da guarda nos históricos de conductor-cable e ground-wire e fortalece as asserções do termo de busca nos service specs antigos da API.

Entrega de alta qualidade: zero problemas críticos e zero majors. O critério de refit foi cumprido — o diff dos specs pré-existentes contém apenas fiação (mounts parametrizados) e as duas exceções declaradas no proposal (strings de `it()` renomeadas em guy/ground onde a asserção foi fortalecida). A ordem das checagens do predicado (formato → positivo → escala), o zero permitido no `DecimalWithScale`, os error keys do web (`invalidDecimal`/`decimalScale`, com `not-positive`→`invalidDecimal` como antes) e todas as mensagens pt-BR foram preservados. Restam apenas minors cosméticos.

Verificação executada nesta review: `npx nx run-many -t test lint -p domain api web --skip-nx-cache` verde (domain 7 testes / 2 suítes, api 187 / 16 suítes, web 111 / 19 suítes) e `npx nx format:check --all` limpo; sem BOM nos 4 arquivos novos/centrais (`head -c3 | od`: `69 6d 70` / `2f 2a 2a`); grep confirma zero referências remanescentes às implementações antigas.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `libs/domain/src/lib/catalogs/validation.ts` | ✅ Ok | 0 |
| `libs/domain/src/lib/catalogs/validation.spec.ts` (novo) | ✅ Ok | 1 minor |
| `apps/api/src/catalogs/dto/decimal-scale.validators.ts` (novo) | ✅ Ok | 0 |
| `apps/api/src/catalogs/dto/tower-weight-point.dto.ts` | ⚠️ Problemas | 1 minor |
| `apps/api/src/catalogs/dto/insulator-version-fields.dto.ts` | ⚠️ Problemas | 1 minor |
| `apps/web/src/app/catalogs/form-utils.ts` | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/tower-type-form.component.ts` | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/insulator-form.component.ts` | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/conductor-cable-form.component.ts` | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/conductor-cable-form.component.spec.ts` | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/conductor-cable-history.component.spec.ts` | ✅ Ok | 0 |
| `apps/web/src/app/catalogs/ground-wire-history.component.spec.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogs/conductor-cables.service.spec.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogs/ground-wires.service.spec.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogs/guy-wires.service.spec.ts` | ✅ Ok | 0 |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

1. **Comentários órfãos nos DTOs refitados** — `apps/api/src/catalogs/dto/tower-weight-point.dto.ts:5-9` e `apps/api/src/catalogs/dto/insulator-version-fields.dto.ts:5-8`. Os blocos de comentário que documentavam as classes `PositiveNonZeroDecimal`/`DecimalWithScale` (removidas para `decimal-scale.validators.ts`) permaneceram nos arquivos originais, agora soltos entre os imports e o DTO. Ainda são úteis como contexto (explicam por que a escala é limitada), mas a redação foi escrita para uma classe que não está mais ali, e o racional agora existe em dois lugares. Sugestão: encurtar cada bloco para uma linha apontando para `decimal-scale.validators.ts` (onde o racional de zero-válido/zero-inválido já está documentado), ou movê-los para junto dos `@Validate` que de fato aplicam a regra.

2. **Cobertura "null-safe" da task 1.1 não é exercitável no spec da domain** — `libs/domain/src/lib/catalogs/validation.spec.ts`. A task prometia "branco/`null`-safe"; branco está coberto (`''` → `'not-decimal'`), mas a assinatura tipada (`value: string`) impede passar `null` sem `as never`. A null-safety real vive nas bordas (typeof-guard nas classes da API; `String(control.value ?? '')` no web) e está coberta indiretamente por testes pré-existentes. Nada a corrigir no código — registrado como discrepância cosmética entre o texto da task e o que o spec pode cobrir.

## ✅ Destaques Positivos

- **Extração fiel ao design, comportamento provadamente preservado**: a ordem das checagens do predicado (formato → positivo → escala) reproduz exatamente os validators originais, e o teste `'com nonZero, formato inválido prevalece sobre a checagem de positivo'` (`validation.spec.ts:39-43`) trava essa ordem — mitigação direta do risco nº 1 do design ("refit regride comportamento de validação").
- **Cascas finas de verdade**: `decimal-scale.validators.ts` mantém nomes de classe, `@ValidatorConstraint({ name })`, assinaturas `@Validate(Classe, [escala])` e mensagens idênticos — os DTOs só trocaram o import, e nenhum teste de DTO foi tocado (critério D2 cumprido à risca).
- **Web sem regressão de error keys**: `decimalScaleValidator` mapeia `not-decimal`/`not-positive`→`invalidDecimal` e `scale-exceeded`→`decimalScale`, exatamente como `weightValueValidator` e `decimalWithScale` locais faziam; templates e specs dos dois forms intactos. Branco segue válido (required é validador próprio), preservando RNF-09.
- **Retrofit do piloto com a lição institucional completa**: `form.disable({ emitEvent: false })` (evita a armadilha do `valueChanges` reemitido), `save()` com early return em form desabilitado, e teste que cobre mensagem, ausência de chamada à API e bloqueio do save — espelho do caso do insulator-form como pedia o D4.
- **Asserções de busca agora uniformes nos 5 catálogos com busca**: os três specs fortalecidos assertam `where.OR` por igualdade completa contra os campos reais dos services (código+descrição — conferidos nesta review contra `conductor-cables/ground-wires/guy-wires.service.ts`), no padrão do insulators; a lacuna do piloto (busca nunca testada desde o piloto) foi fechada; zero `toBeDefined()` restantes em `apps/api/src`.
- **Isolamento de mocks correto**: `vi.clearAllMocks()` no `beforeEach` dos specs sustenta os `not.toHaveBeenCalled()` dos testes novos sem vazamento entre casos.
- **Higiene de entrega**: sem BOM nos arquivos novos (armadilha recorrente do Windows), `format:check --all` limpo antes da review, barrel da domain já exportava `validation.ts` (`export *` — nenhuma fiação extra necessária).

## Conformidade com Padrões

| Padrão | Status |
|--------|--------|
| Padrões de Código | ✅ Ok |
| Typescript/Node.js | ✅ Ok |
| Angular/NestJS/React | ✅ Ok |
| REST/HTTP | ✅ Ok (nenhuma rota/status/mensagem alterada, como prometido) |
| Testes | ✅ Ok (7 domain + 187 api + 111 web verdes, sem cache) |
| Logging/Monitoramento | ✅ Ok (n/a nesta change) |

Notas de conformidade:

- Código em inglês com comentários/mensagens/describes em pt-BR (RNF-14) — conforme, incluindo os arquivos novos.
- RNF-08/RNF-09 preservados: zero segue valor informado válido no `DecimalWithScale` e no validator web sem `nonZero`; branco→null intacto.
- MIN-2 coletivo (id malformado renderiza a casca do modo criação — h2 "Novo cabo condutor" e campo Código desabilitado visíveis) permanece no piloto, **conforme decisão explícita de escopo** no proposal/design; não é apontamento desta review.
- Non-Goals respeitados: `missingFields` e `VersionedCatalogApi` não foram tocados (1 ocorrência divergente cada, regra das três não disparou).

## Recomendações

1. (Minor 1, opcional antes do commit) Encurtar os comentários órfãos dos dois DTOs para uma linha referenciando `decimal-scale.validators.ts`, evitando o racional duplicado em dois arquivos.
2. (Sem ação de código) Registrar no fechamento que a cobertura "null-safe" da task 1.1 é estrutural (assinatura tipada) e vive nas bordas — evita a mesma discussão em reviews futuras.
3. (Grupo 3) Na validação ao vivo (task 3.1), além do form do piloto com id malformado, exercitar o smoke de escala nos dois forms refitados com um valor `not-positive` no tower-type (ex.: `0`) para evidenciar que o mapeamento `not-positive`→`invalidDecimal` mostra a mesma mensagem de antes.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero críticos e zero majors — nada bloqueia o commit dos grupos 1 e 2. Os dois minors são cosméticos; o nº 1 (comentários órfãos) é um ajuste de 2 linhas que vale fazer no próprio commit do grupo. Próximos passos: commit por grupo com staging explícito por caminho (nunca `git add -A` neste repo), seguir para o grupo 3 (validação ao vivo + suíte completa + CI verde no push).
