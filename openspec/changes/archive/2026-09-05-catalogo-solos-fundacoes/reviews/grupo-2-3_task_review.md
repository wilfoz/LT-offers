# Review dos Grupos 2 e 3 (tasks 2.1, 3.1, 3.2)

**Revisor**: AI Code Reviewer
**Data**: 2026-08-25
**Change / Grupo**: catalogo-solos-fundacoes / grupos 2 e 3
**Status**: Aprovado com observações

## Resumo

Entrega dos contratos da domain (tipos de solo, tipos de fundação e matriz de
volumes) e da API completa de `soil-types` (DTOs, service, controller, módulo e
testes). O sexto catálogo nasce como espelho fiel de `insulators` sobre a base
extraída: o diff estrutural entre `soil-types.service.ts` e
`insulators.service.ts` se resume aos campos de domínio e ao mapa de rótulos —
nada foi reimplementado. Zero problemas críticos e zero majors; a série de
reincidências do gate de formatação segue quebrada (2ª entrega seguida limpa em
`format:check --all`). Todos os cenários do spec cobertos pelos grupos estão
testados, incluindo os três casos delicados do domínio: rocha sem coesão/NSPT
sem pendência, `false` informado não é pendência e zero informado não é
pendência (RNF-09). Um único minor de semântica de validação (faixa de NSPT
meio-informada) e observações de registro.

## Arquivos Revisados

| Arquivo                                                  | Status | Problemas |
| -------------------------------------------------------- | ------ | --------- |
| `libs/domain/src/lib/catalogs/soil-types.ts`              | ✅ Ok  | 0         |
| `libs/domain/src/lib/catalogs/foundation-types.ts`        | ✅ Ok  | 0         |
| `libs/domain/src/lib/catalogs/foundation-volumes.ts`      | ✅ Ok  | 0         |
| `libs/domain/src/index.ts`                                | ✅ Ok  | 0         |
| `apps/api/src/catalogs/dto/soil-type-version-fields.dto.ts` | ⚠️ Problemas | 1 (minor) |
| `apps/api/src/catalogs/dto/create-soil-type.dto.ts`       | ✅ Ok  | 0         |
| `apps/api/src/catalogs/dto/create-soil-type-version.dto.ts` | ✅ Ok  | 0         |
| `apps/api/src/catalogs/soil-types.service.ts`             | ✅ Ok  | 0         |
| `apps/api/src/catalogs/soil-types.controller.ts`          | ✅ Ok  | 0         |
| `apps/api/src/catalogs/soil-types.service.spec.ts`        | ✅ Ok  | 0         |
| `apps/api/src/catalogs/soil-types.controller.spec.ts`     | ✅ Ok  | 0         |
| `apps/api/src/catalogs/catalogs.module.ts`                | ✅ Ok  | 0         |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

**MIN-1 — Faixa de NSPT meio-informada é aceita em silêncio, sem erro nem
pendência** — `apps/api/src/catalogs/dto/soil-type-version-fields.dto.ts:22-34`
e `:82-93`.

O spec modela a faixa como "par de inteiros (mínimo inclusivo, máximo
exclusivo)" e o `NsptRangeOrdered` só valida quando **os dois** limites são
números:

```ts
if (typeof nsptMin !== 'number' || typeof nsptMax !== 'number') {
  return true;
}
```

Um payload `{ nsptMin: 12 }` (sem `nsptMax`, ou vice-versa) passa na validação
e grava a meia-faixa — e como coesão/NSPT estão deliberadamente fora do mapa de
pendências (por causa de rocha), o estado meio-informado fica invisível na
listagem. Nenhum cenário do spec proíbe a meia-faixa (o cenário "sem faixa"
tem os dois ausentes), então não é violação de spec — mas é uma decisão de
semântica tomada implicitamente. Sugestão: ou registrar explicitamente que
meia-faixa é aceita (consequência do RNF-09 campo a campo), ou adicionar uma
validação "ambos ou nenhum" com mensagem pt-BR. Relevante porque o
estaqueamento futuro (RF-19/20) consultará essa faixa estruturada.

## ✅ Destaques Positivos

1. **Espelho exato do padrão consolidado**: `diff` de `soil-types.service.ts`
   contra `insulators.service.ts` (com renomeação mecânica) mostra que só os
   campos de domínio e o mapa `SOIL_TYPE_REQUIRED_LABELS` diferem — reuso
   integral de `civil-date`, `effectiveness`, `prisma-errors` e
   `controller-shared`, exatamente como o design D2 pede. O controller é
   idêntico ao de insulators, incluindo os métodos separados de PUT/PATCH →
   405 com o comentário da lição institucional (empilhar decoradores não
   registra duas rotas).
2. **Cobertura superconjunto do espelho, nada podado**: o diff dos nomes de
   `it(...)` contra os specs de insulators mostra que TODOS os testes do
   precedente estão presentes, mais 6 específicos do domínio (faixa invertida,
   mínimo igual ao máximo, limites fracionários/negativos, submerso não
   booleano, rocha sem faixa aceita, meia-observação de `false`/zero). A lição
   de guy-wires (poda de specs derivados) foi respeitada.
3. **Os três cenários delicados de pendência do spec testados com
   `Prisma.Decimal` real**: "rocha completa sem coesão/NSPT → sem pendência",
   "`false` informado e `Decimal('0')` informado não são pendência" e o teste
   RNF-09 de gravação de null sem conversão em zero
   (`soil-types.service.spec.ts:94-108, 210-257`).
4. **Busca assertada por igualdade completa do `where.OR`**
   (`soil-types.service.spec.ts:199-208`), padrão uniformizado na
   reavaliacao-base-catalogos — nenhum `toBeDefined` frouxo.
5. **P2002 → 409 nas duas operações com mensagens pt-BR distintas** (código em
   uso × vigência duplicada), sem check-then-create (create direto com catch),
   e datas de calendário inválidas rejeitadas via `toCivilDate` com teste de
   que nada foi gravado (`not.toHaveBeenCalled`).
6. **DTOs 100% delegados à base**: `DecimalWithScale` com escalas 2/2/3/3
   espelhando exatamente as precisões das colunas
   (`prisma/schema.prisma:267-270` — 12,2/12,2/10,3/10,3), com comentário por
   campo ligando escala à coluna; ordem formato→positivo→escala continua
   travada no teste da domain (`validation.spec.ts`), nada reimplementado.
7. **Contratos da domain fiéis ao design D3**: `FOUNDATION_APPLICATIONS`
   const-array (precedente `GROUND_WIRE_TYPES`), 17 campos de contagem e 34 de
   quantidade conferidos um a um contra o D1, mapped types
   (`FoundationElementCounts`/`FoundationVolumeQuantities`) que eliminam
   drift entre a lista e as interfaces, e `FoundationVolumeCombination` com os
   7 rótulos do D3.
8. **Higiene mecânica**: sem BOM UTF-8 nos 10 arquivos novos (checado
   `head -c3 | od`), `npx nx format:check --all` exit 0, `npx nx run-many -t
   test lint -p api domain` verde (220 testes da api, 18 suítes), módulo
   registrado em ordem alfabética.

## Conformidade com Padrões

| Padrão                | Status |
| --------------------- | ------ |
| Padrões de Código     | ✅ Ok  |
| Typescript/Node.js    | ✅ Ok  |
| Angular/NestJS/React  | ✅ Ok  |
| REST/HTTP             | ✅ Ok  |
| Testes                | ✅ Ok  |
| Logging/Monitoramento | ✅ Ok  |

Notas de conformidade verificadas:

- Identificadores em inglês, mensagens/comentários/descrições de teste em
  pt-BR (RNF-14) — sem violações.
- Decimais como string no contrato e `Prisma.Decimal` no banco (RNF-08);
  mapper `toVersionContract` com `.toString()`/`.toISOString()`.
- Linhas >80 colunas existem apenas em strings de `it(...)` e `extends` de
  interface — formas que o Prettier não quebra, com precedente idêntico já
  commitado em `insulators.controller.spec.ts`; o gate real
  (`format:check --all`) passa. Não é reincidência do major histórico.
- Métodos ≤ 50 linhas, service com 208 linhas (< 300), sem números mágicos,
  sem flags booleanas, early returns nos helpers.

## Recomendações

1. (MIN-1) Decidir explicitamente a semântica da faixa de NSPT
   meio-informada: aceitar e registrar (uma linha no design D1 ou no
   proposal), ou validar "ambos ou nenhum" no DTO com mensagem pt-BR e
   teste. Pode ser feito junto do grupo 4 sem retrabalho.
2. Nos grupos 4-5, repetir a técnica usada aqui de derivar por diff do
   espelho e conferir a lista de `it(...)` contra o precedente — foi o que
   garantiu a cobertura superconjunto.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero críticos e zero majors — terceira entrega
de catálogo consecutiva nesse patamar. O único minor (MIN-1) é uma decisão de
semântica a registrar, não um defeito funcional, e não bloqueia o commit dos
grupos 2-3. Próximos passos: commit por staging explícito dos 12 caminhos
(nunca `git add -A`), registrar a decisão do MIN-1 e seguir para o grupo 4
(API foundation-types), onde o mesmo processo de espelho + diff de cobertura
deve ser aplicado sobre o precedente ground-wires (filtro de tipo +
`@IsEmpty`).

---

**Resolução (mesmo dia):** MIN-1 resolvido no próprio grupo — validador `NsptRangePaired` nos dois campos rejeita meia-faixa com mensagem pt-BR ("Informe a faixa de NSPT completa (mínimo e máximo) ou deixe ambos em branco"), com teste dedicado em `soil-types.controller.spec.ts`. Suíte da api: 221 testes verdes; `format:check --all` exit 0.
