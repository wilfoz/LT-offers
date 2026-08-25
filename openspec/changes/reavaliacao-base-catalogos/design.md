# Design: reavaliacao-base-catalogos

## Context

Ver `proposal.md — Why`. As 4 implementações de "decimal com escala" divergem em um único eixo — zero permitido (isoladores; o spec só rejeita negativo/não numérico) ou proibido (pesos×alturas de torre; zero é inválido por spec) — e coincidem no resto (pattern `POSITIVE_DECIMAL_PATTERN` da domain + contagem de casas via `split('.')`). As duas bordas precisam distinguir a violação (formato vs escala) para mensagens/erros distintos, então um predicado booleano não basta. `libs/domain` já é dependência de api e web e não pode depender de class-validator nem de Angular (RNF-16 vale para o espírito das libs: puras e portáveis).

## Goals / Non-Goals

**Goals:**

- Uma única fonte da regra de escala, com testes diretos na domain (quita também o minor "helpers novos sem teste direto" da review do grupo 1 de cabos-tirante).
- Refit dos 4 pontos com o critério das extrações anteriores: nenhuma asserção de teste pré-existente muda — exceto as asserções de termo de busca, cujo FORTALECIMENTO é objetivo declarado da change.
- Piloto alinhado aos demais catálogos no tratamento de id de rota malformado, com teste de regressão.

**Non-Goals:**

- Generalizar `missingFields` para coleções ou parametrizar a URL da `VersionedCatalogApi`: 1 ocorrência divergente cada (tabela peso×altura e `TowerTypesApi` de series-torres) — a regra das três ocorrências não disparou; ficam registradas para o próximo catálogo com forma parecida.
- MIN-2 coletivo (casca do modo criação em rota de edição/detalhe com id malformado) — fora por decisão do usuário nesta change.
- Qualquer mudança de rota, status HTTP, mensagem ao usuário ou schema.

## Decisions

### D1 — Violação tipada na domain, não predicado booleano

`libs/domain/src/lib/catalogs/validation.ts` ganha:

```ts
export type DecimalScaleViolation = 'not-decimal' | 'not-positive' | 'scale-exceeded' | null;
export function decimalScaleViolation(value: string, maxScale: number, options?: { nonZero?: boolean }): DecimalScaleViolation;
```

`null` = válido; a função reusa `POSITIVE_DECIMAL_PATTERN` e concentra o `split('.')`. Mensagens continuam nas bordas (RNF-14, mesmo racional do D1 da extração original). Alternativas — predicado booleano: rejeitada, o web precisa mapear formato→`invalidDecimal` e escala→`decimalScale` para mensagens diferentes; lançar erro com metadata: rejeitada, validação não é fluxo excepcional.

### D2 — API: os dois `ValidatorConstraint` viram cascas finas num arquivo só

`PositiveNonZeroDecimal` e `DecimalWithScale` movem para `apps/api/src/catalogs/dto/decimal-scale.validators.ts`, cada um delegando a `decimalScaleViolation` (com e sem `nonZero`). Nomes de classe, assinaturas `@Validate(Classe, [escala])` e mensagens ficam idênticos — os DTOs só trocam o import; nenhum teste muda. Alternativa — uma classe única parametrizada por `[escala, {nonZero}]`: rejeitada, mudaria os call sites dos decoradores sem ganho (a distinção zero-válido/zero-inválido é semântica de spec e merece nome próprio).

### D3 — Web: `decimalScaleValidator` em `form-utils.ts`

`catalogs/form-utils.ts` ganha `decimalScaleValidator(maxScale, options?)` (ValidatorFn) mapeando a violação para os error keys já usados: `not-decimal`→`{invalidDecimal}`, `not-positive`→`{invalidDecimal}` (como o `weightValueValidator` atual faz), `scale-exceeded`→`{decimalScale}`; branco = válido (required é validador próprio). `tower-type-form` e `insulator-form` trocam as funções locais pelo import; templates, mensagens e testes intactos.

### D4 — Retrofit da guarda de id no piloto

`conductor-cable-form.component.ts` adota o construtor dos forms posteriores: `idParam === null` → modo criação; id numérico válido → `prepareEdit`; senão → `serverError('Identificador inválido')` + `form.disable({ emitEvent: false })` (o `save()` já retorna cedo com form desabilitado — mesma malha de proteção do prefill). Teste novo espelha o caso "rejeita identificador malformado na rota sem degradar para criação" do insulator-form.

### D5 — Dívidas de teste: fortalecer, não fiar

- Históricos de conductor-cable e ground-wire: teste "rejeita identificador malformado sem consultar a API" (guarda já existe no código).
- Service specs da API com `expect(where.OR).toBeDefined()`: trocar pela igualdade completa do `where.OR` com o termo (padrão do insulators.service.spec), respeitando os campos reais de cada catálogo (código+descrição nos cabos; nome+projetista na série; sigla no tipo de torre — conferir cada service antes de assertar).

## Risks / Trade-offs

- [Refit regride comportamento de validação] → predicado com testes diretos na domain cobrindo os 4 contratos atuais (zero permitido/proibido × formato/escala) ANTES do refit; suíte completa sem asserção alterada como gate.
- [Asserção fortalecida revela divergência real entre serviço e teste antigo] → é o objetivo: se o `where.OR` real não bater com o esperado, tratar como bug e corrigir na causa, não afrouxar a asserção.
- [Guarda nova no piloto quebra fluxo legítimo] → a guarda só dispara com id não numérico/não positivo; rotas geradas pela própria UI usam ids do banco. Teste de regressão cobre criação e edição válidas intactas.

## Migration Plan

Sem migration de banco. Ordem: (1) predicado + testes na domain; (2) refit API; (3) refit web; (4) retrofit do piloto + dívidas de teste; (5) verificação. Rollback: git revert (mudanças de código puras). Rotina padrão: review do `task-reviewer` por grupo, commit por grupo (staging explícito), `npx nx format:check --all` antes do push, verificação ao vivo do único comportamento novo (form do piloto) antes de fechar.

## Open Questions

- Nenhuma.
