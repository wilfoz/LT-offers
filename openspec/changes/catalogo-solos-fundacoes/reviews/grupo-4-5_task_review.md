# Review dos Grupos 4 e 5 (tasks 4.1, 4.2, 5.1, 5.2)

**Revisor**: AI Code Reviewer
**Data**: 2026-08-25
**Change / Grupo**: catalogo-solos-fundacoes / grupos 4 e 5
**Status**: Aprovado com observações

## Resumo

Entrega das APIs de `foundation-types` (7º catálogo, com filtro de aplicação e
pendência composta) e `foundation-volumes` (1º recurso de identidade composta
do projeto: tripla torre × solo × fundação, recurso plano com filtros
parciais). Zero problemas críticos e zero majors — 3ª entrega seguida limpa no
gate de formatação. Todos os cenários dos requirements cobertos pelos grupos
estão testados, incluindo os pontos que o design marcou como delicados: P2002
ambíguo mitigado com mensagens distintas por operação (lição series-torres,
com asserção das mensagens exatas), 404 nomeando a referência ausente com
`it.each` das três e garantia de que nada grava, busca + filtro assertados por
igualdade completa do `where` (lição guy-wires) e zero ≠ null exercitado nas
duas pontas (DTO e pendência) com `Prisma.Decimal` real na conversão. Dois
desvios deliberados avaliados e aceitos: o decorator composto `Quantity`
(applyDecorators) e o mock `versionRow` gerado da lista da domain. Quatro
minors de registro, nenhum bloqueante.

Verificação executada nesta review: `npx nx run-many -t test lint -p api
domain --skip-nx-cache` (292 testes, 22 suites, lint limpo), `npx prettier
--check` nos 14 arquivos novos (limpo), BOM ausente (`head -c3` = `imp` em
todos), paridade tripla conferida campo a campo: 17 contagens e 34 quantidades
idênticas em schema.prisma ↔ domain ↔ DTO ↔ mappers.

## Arquivos Revisados

| Arquivo                                                              | Status       | Problemas |
| -------------------------------------------------------------------- | ------------ | --------- |
| `apps/api/src/catalogs/dto/foundation-type-version-fields.dto.ts`     | ⚠️ Problemas | 1 (minor) |
| `apps/api/src/catalogs/dto/create-foundation-type.dto.ts`             | ✅ Ok        | 0         |
| `apps/api/src/catalogs/dto/create-foundation-type-version.dto.ts`     | ✅ Ok        | 0         |
| `apps/api/src/catalogs/dto/foundation-volume-quantities.dto.ts`       | ⚠️ Problemas | 1 (minor) |
| `apps/api/src/catalogs/dto/create-foundation-volume.dto.ts`           | ✅ Ok        | 0         |
| `apps/api/src/catalogs/dto/create-foundation-volume-version.dto.ts`   | ✅ Ok        | 0         |
| `apps/api/src/catalogs/foundation-types.service.ts`                   | ✅ Ok        | 0         |
| `apps/api/src/catalogs/foundation-types.controller.ts`                | ✅ Ok        | 0         |
| `apps/api/src/catalogs/foundation-types.service.spec.ts`              | ✅ Ok        | 0         |
| `apps/api/src/catalogs/foundation-types.controller.spec.ts`           | ⚠️ Problemas | 1 (minor) |
| `apps/api/src/catalogs/foundation-volumes.service.ts`                 | ✅ Ok        | 0         |
| `apps/api/src/catalogs/foundation-volumes.controller.ts`              | ⚠️ Problemas | 1 (minor) |
| `apps/api/src/catalogs/foundation-volumes.service.spec.ts`            | ✅ Ok        | 0         |
| `apps/api/src/catalogs/foundation-volumes.controller.spec.ts`         | ⚠️ Problemas | 1 (minor) |
| `apps/api/src/catalogs/catalogs.module.ts`                            | ✅ Ok        | 0         |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

**MIN-1 — Sem trava de paridade DTO ↔ lista da domain: campo esquecido no DTO
seria descartado em silêncio pela whitelist** —
`apps/api/src/catalogs/dto/foundation-volume-quantities.dto.ts` e
`dto/foundation-type-version-fields.dto.ts`.

Hoje a paridade está correta (conferi as 34 quantidades e as 17 contagens uma
a uma contra `FOUNDATION_VOLUME_QUANTITY_FIELDS`/`FOUNDATION_ELEMENT_COUNT_FIELDS`
e o schema). Mas nada trava essa paridade: os DTOs são classes soltas (não
`implements` o contrato da domain) e o `ValidationPipe {whitelist: true}`
descarta sem erro qualquer propriedade sem decorator. Se uma 35ª coluna entrar
na lista da domain + schema e o decorator faltar no DTO, o valor enviado pelo
cliente é silenciosamente descartado e a versão imutável persiste null — o
mesmo modo de falha do "prefill silencioso" já registrado como lição, agora na
borda de entrada. Os mappers do service estão protegidos (o mapped type
`FoundationVolumeQuantities` força completude em compile time); o elo fraco é
só o DTO. Correção sugerida — teste de paridade que constrói um payload com
todas as chaves da lista com valor inválido e espera um erro por campo
(garante que cada campo da lista tem decorator):

```ts
it('valida todas as quantidades da lista da domain (paridade DTO)', async () => {
  const payload = Object.fromEntries(
    FOUNDATION_VOLUME_QUANTITY_FIELDS.map((field) => [field, 'abc']),
  );
  const errors = await validate(dto({ ...triple, ...payload }));
  expect(errors.map((e) => e.property).sort()).toEqual(
    [...FOUNDATION_VOLUME_QUANTITY_FIELDS].sort(),
  );
});
```

Nota conexa: o mock `versionRow` do service.spec da matriz gerado de
`FOUNDATION_VOLUME_QUANTITY_FIELDS` (linhas 13–22) foi avaliado e é
**aceitável** — melhor que listar na mão, porque acompanha automaticamente o
mapper que itera a mesma lista. O ponto cego autoconsistente (lista e mock da
mesma fonte) é exatamente o que o teste de paridade acima fecharia pelo outro
lado.

**MIN-2 — Assimetria de estilo entre os dois grupos na mesma change: pilha
explícita 3×17 no DTO de contagens vs decorator composto no de quantidades** —
`apps/api/src/catalogs/dto/foundation-type-version-fields.dto.ts:17-100`.

O DTO da matriz introduziu `Quantity(label)` via `applyDecorators` (avaliado
como aceitável — ver Destaques), mas o DTO de fundação manteve 17 repetições
de `@IsOptional() + @IsInt + @Min(0)` com o mesmo rótulo duplicado em duas
mensagens idênticas por campo (34 chamadas de `nonNegativeCountMessage`). Não
é violação — a pilha explícita é o padrão dos seis catálogos anteriores — mas
a fronteira do critério ficou implícita (17 repetições toleradas, 34 não).
Sugestão: num próximo toque no arquivo, extrair `Count(label)` análogo ao
`Quantity`, ou registrar o critério de corte na próxima reavaliação da base.

**MIN-3 — Testes de borda prometem "mensagem em português" no título mas só
assertam o tipo da exceção** —
`apps/api/src/catalogs/foundation-types.controller.spec.ts:57-61` (filtro de
aplicação fora do enum) e
`apps/api/src/catalogs/foundation-volumes.controller.spec.ts:71-82` (filtros
não numéricos).

Os testes de DTO assertam o conteúdo pt-BR das mensagens, mas os dois testes
de borda do controller só verificam `BadRequestException` — o título afirma
mais do que a asserção prova (mesmo padrão que já motivou asserções de termo
exato em reviews anteriores). Correção barata: assertar substring —
`expect(() => controller.list(undefined, 'ESTAIADA')).toThrow('autoportante')`
e `.toThrow('identificador numérico')` no caso dos filtros.

**MIN-4 — `optionalId` com `Number()` aceita notação científica e hexadecimal
nos filtros de query** —
`apps/api/src/catalogs/foundation-volumes.controller.ts:90-101`.

`Number('1e2')` → 100 e `Number('0x10')` → 16 passam como filtros válidos,
enquanto o `createIdPipe` (ParseIntPipe) dos ids de rota é mais estrito.
Inofensivo na prática (os filtros virão de selects da UI no grupo 8) e o
comportamento para inválidos reais está correto (400 pt-BR, testado com
`it.each`). Registro apenas; se incomodar, validar com o mesmo padrão
`/^\d+$/` antes do `Number()`.

## ✅ Destaques Positivos

1. **P2002 ambíguo da matriz mitigado de primeira** (lição series-torres): as
   duas uniques (`tripla` no item, `[itemId, effectiveFrom]` na versão) têm
   mensagens distintas por operação, e os testes assertam as **mensagens
   exatas** (`foundation-volumes.service.spec.ts:131-144` e `:230-241`), não
   só o tipo — se as mensagens forem trocadas entre si, o teste quebra.
2. **404 nomeando a referência ausente com `it.each` das três** e
   `expect(create).not.toHaveBeenCalled()` garantindo que nada grava
   (`foundation-volumes.service.spec.ts:110-129`); checagem em `Promise.all`
   com FK Restrict como cinturão, exatamente como o design D2 pede.
3. **`ITEM_INCLUDE satisfies Prisma.FoundationVolumeInclude` + `GetPayload`**
   (`foundation-volumes.service.ts:31-40`): o include declarado uma vez vira a
   fonte do tipo `ItemWithRefs` — padrão novo, forte e sem duplicação, bom
   candidato a precedente para futuros recursos com include.
4. **Decorator composto `Quantity` via `applyDecorators`** — desvio deliberado
   avaliado e aprovado: utilitário oficial do Nest, local ao arquivo, nome na
   convenção de decorators, elimina ~70 linhas de repetição e preserva a pilha
   exata (`IsOptional` + `Validate(DecimalWithScale, [3])`) — os testes de DTO
   provam formato, negativo, escala 3 e zero-válido sem mudança de semântica.
5. **Busca + filtro assertados por igualdade completa do `where`**
   (`foundation-types.service.spec.ts:177-194`) — a lacuna histórica de
   guy-wires não reincidiu; há também o teste do caso sem filtros (`{}`).
6. **Zero ≠ null nas duas pontas e com `Prisma.Decimal` real**: contagem zero
   não é pendência (RNF-09), `Decimal('0')` → `'0'` no contrato e `groutM3`
   null preservado (`foundation-volumes.service.spec.ts:279-291`); conversão
   Decimal→string testada com instâncias reais, não strings de mock.
7. **Pendência composta com ordem estável e testada** — `descrição` +
   `composição por elemento` (`foundation-types.service.spec.ts:241-257`),
   respeitando o limite conhecido `missingFields`-sem-coleções (D3) sem
   generalizar prematuramente.
8. **Imutabilidade da identidade** — `@IsEmpty` na aplicação e nos três ids da
   tripla com mensagens claras; o teste da matriz asserta que **as três**
   propriedades acusam erro e que toda mensagem cita "não pode ser alterada"
   (`foundation-volumes.controller.spec.ts:205-222`).
9. **Higiene institucional em dia**: sem BOM, `format:check` limpo (3ª entrega
   seguida), zero `any`, comentários pt-BR explicando o porquê (não o quê),
   registro no módulo em ordem alfabética, datas civis com rejeição de
   rollover de calendário testada.

## Conformidade com Padrões

| Padrão                | Status |
| --------------------- | ------ |
| Padrões de Código     | ✅ Ok  |
| Typescript/Node.js    | ✅ Ok  |
| Angular/NestJS/React  | ✅ Ok  |
| REST/HTTP             | ✅ Ok  |
| Testes                | ✅ Ok  |
| Logging/Monitoramento | ✅ Ok  |

Notas de conformidade: `toSummary` de foundation-types com 4 parâmetros segue
o precedente idêntico de ground-wires/tower-types/structure-series (não é
regressão nova; se a regra de ≤3 parâmetros for imposta, é refit de família
inteira, não deste grupo). Linhas >80 nos arquivos novos são strings pt-BR e
comentários que o Prettier não quebra — `prettier --check` passa nos 14
arquivos (verificado nesta review, além do `format:check --all` do executor).

## Recomendações

1. (MIN-1) Adicionar os dois testes de paridade DTO ↔ lista da domain (34
   quantidades e 17 contagens) — barato, fecha o único modo de falha
   silencioso encontrado; ideal antes do commit do grupo, aceitável como
   follow-up no grupo 9.
2. (MIN-3) Assertar substring das mensagens pt-BR nos dois testes de borda do
   controller que as prometem no título.
3. (MIN-2) Registrar (ou extrair `Count(label)`) o critério de quando a pilha
   de decorators vira decorator composto — insumo para a próxima reavaliação
   da base.
4. (MIN-4) Nenhuma ação agora; revisitar `optionalId` apenas se os filtros
   deixarem de vir de selects.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero críticos e zero majors; os quatro minors
são de robustez futura e higiene de asserção, nenhum altera comportamento
entregue. Os grupos 4 e 5 cumprem integralmente os cenários dos requirements
"Manter tipos de fundação", "Manter matriz de volumes", "Listar e buscar tipos
de fundação", "Listar e filtrar a matriz", "Sinalizar registros incompletos"
(partes de fundação e matriz) e "Exibir histórico" (composição e quantidades
por época), com as lições institucionais de series-torres e guy-wires
aplicadas de primeira. Próximos passos: aplicar (ou agendar) as recomendações
1–2 e commitar o grupo com staging explícito por caminho.

---

**Resolução (mesmo dia):** MIN-1 resolvido com testes de paridade DTO ↔ lista da domain nos dois controller.spec (payload com todas as chaves inválidas → um erro por campo). MIN-2 resolvido unificando o estilo: `foundation-type-version-fields.dto.ts` reescrito com decorator composto `Count(label)`, mesmo critério do `Quantity` da matriz. MIN-3 resolvido assertando a mensagem pt-BR nos dois testes de borda. MIN-4 permanece registrado (filtros de query virão de selects no grupo 8). Suíte: 294 testes verdes; `format:check --all` exit 0.
