# Review dos Grupos 2, 3 e 4 — Modelo de dados, contratos e API de cabos de tirante

**Revisor**: AI Code Reviewer
**Data**: 2026-08-24
**Change / Grupo**: catalogo-cabos-tirante / grupos 2 (tasks 2.1–2.3), 3 (task 3.1) e 4 (tasks 4.1–4.4)
**Status**: Aprovado com observações

## Resumo

Os três grupos entregam o catálogo de cabos de aço para tirante de ponta a ponta no backend: modelo Prisma `GuyWire`/`GuyWireVersion` com migration aditiva e termo no mapa do README (D5/D6), contratos em `libs/domain/src/lib/catalogs/guy-wires.ts` e API REST em `/catalogs/guy-wires` construída inteiramente sobre a base extraída no grupo 1. O critério central do design — **o código novo contém apenas o que é específico do catálogo** — foi verificado por comparação linha a linha com `ground-wires.*`: o service é exatamente o precedente menos a lógica de discriminador de tipo (que não existe aqui, por decisão registrada no proposal), sem nenhuma lógica nova não justificada e sem reimplementar nada que a base cobre (`missingFields`, `isUniqueViolation`, `controller-shared`, `civil-date`, `resolveEffectiveVersion`, patterns da domain). Os 25 testes novos cobrem todos os cenários do spec `cabos-tirante` e os herdados de `versionamento-vigencia`. Verificado nesta review: `npx nx run-many -t test lint -p api domain` verde (100 testes na api), `npx nx format:check` completo limpo, `npx prisma migrate status` com o banco em dia (6 migrations) e nenhum BOM nos arquivos novos (o minor do grupo 1 não se repetiu). Restam apenas apontamentos minor.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| prisma/schema.prisma (GuyWire/GuyWireVersion) | ⚠️ Problemas | 1 (minor, comentário de cabeçalho) |
| prisma/migrations/20260824095127_catalogo_cabos_tirante/migration.sql | ✅ Ok | 0 |
| README.md (linha tirante → GuyWire) | ✅ Ok | 0 |
| libs/domain/src/lib/catalogs/guy-wires.ts (novo) | ✅ Ok | 0 |
| libs/domain/src/index.ts | ✅ Ok | 0 |
| apps/api/src/catalogs/dto/guy-wire-version-fields.dto.ts (novo) | ⚠️ Problemas | 1 (minor, helpers de mensagem triplicados) |
| apps/api/src/catalogs/dto/create-guy-wire.dto.ts (novo) | ✅ Ok | 0 |
| apps/api/src/catalogs/dto/create-guy-wire-version.dto.ts (novo) | ✅ Ok | 0 |
| apps/api/src/catalogs/guy-wires.service.ts (novo) | ✅ Ok | 0 |
| apps/api/src/catalogs/guy-wires.controller.ts (novo) | ✅ Ok | 0 |
| apps/api/src/catalogs/guy-wires.service.spec.ts (novo) | ⚠️ Problemas | 1 (minor, fidelidade de tipo nos mocks — herdado do grupo 1) |
| apps/api/src/catalogs/guy-wires.controller.spec.ts (novo) | ✅ Ok | 0 |
| apps/api/src/catalogs/catalogs.module.ts | ✅ Ok | 0 |

## Verificação dos pontos de atenção solicitados

1. **Cobertura dos cenários do spec** — todos mapeados para testes:
   - *Criação com dados válidos*: `guy-wires.service.spec.ts` («cria cabo de tirante com primeira versão e todos os atributos», asserta payload completo, autoria e `effectiveFrom = today`; `utsKn` não informado gravado como `null` — RNF-09).
   - *Código duplicado*: «mapeia código duplicado para conflito (409)» via P2002.
   - *Numéricos inválidos*: DTO rejeita `-1` e `abc` com mensagens pt-BR contendo o rótulo do campo («peso (ton/km)», «UTS (kN)»).
   - *Fios não inteiro*: fracionário (2.5), zero e negativo rejeitados, todas as mensagens com «inteiro positivo».
   - *Busca*: `list` monta `OR` de código+descrição case-insensitive.
   - *Pendências sem cobrar descrição*: item com `description: null` e demais campos preenchidos exceto grau retorna `pendingFields === ['grau de resistência']` — descrição fora, conforme spec.
   - *Histórico*: ordenado da vigência mais recente para a mais antiga, com autor.
   - *Herdados de versionamento-vigencia*: `effectiveOn` passado retorna a versão da época; data anterior à primeira → 404 «Não há versão vigente»; PUT e PATCH → 405; X-User presente/ausente; round-trip de data civil (`2026-02-30` rejeitado no controller e no service, sem gravar).
2. **Só o específico do catálogo** — confirmado. Diferenças do service em relação a `ground-wires.service.ts`: ausência de `assertFieldsApplyToType`/mapas por tipo (não se aplicam — sem discriminador) e o mapa próprio `GUY_WIRE_REQUIRED_LABELS`. Nada da base foi reimplementado; nenhuma abstração especulativa nova foi criada. Controller idêntico em forma ao precedente, incluindo os dois métodos separados para PUT/PATCH (pitfall conhecido do Nest, com comentário explicativo em `guy-wires.controller.ts:64-65`).
3. **Modelo Prisma e migration** — precisões espelham os catálogos existentes (peso 12,4; bobina 12,2; diâmetro 10,3; UTS 12,2), campos anuláveis, `effective_from DATE`, `@@unique([guyWireId, effectiveFrom])`, índice composto desc, FK `ON DELETE RESTRICT`. Migration 100% aditiva (só `CREATE TABLE`/`CREATE INDEX`/`ADD CONSTRAINT`), idêntica em padrão à do `ground_wire`. Sem discriminador de tipo, com o racional documentado no comentário do bloco (decisão do usuário, D5). `prisma migrate status`: banco em dia.
4. **`GUY_WIRE_REQUIRED_LABELS` conforme spec** — exatamente os 7 campos do requirement «Sinalizar itens incompletos» (peso, bobina, diâmetro, UTS, galvanização, grau, fios); descrição fora, como o spec desta change manda («Descrição não gera pendência») — a diferença em relação ao condutor (onde descrição É pendência) está correta e documentada no comentário do mapa.
5. **Idiomas** — identificadores 100% em inglês (nomes do mapa do README); mensagens de erro, comentários e descrições de teste em pt-BR. `format:check` completo limpo, executado nesta review.

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

1. **Helpers de mensagem de validação agora triplicados** — `apps/api/src/catalogs/dto/guy-wire-version-fields.dto.ts:11-15`: `decimalMessage` e `countMessage` são cópias idênticas dos mesmos helpers em `version-fields.dto.ts` e `ground-wire-version-fields.dto.ts` (3 ocorrências — o gatilho da própria regra desta change). O design D1 mantém mensagens "em cada consumidor", mas o racional era a borda (api vs web); os três arquivos são a mesma borda. Sugestão: extrair para `apps/api/src/catalogs/dto/validation-messages.ts` nesta change ou registrar como dívida para o 4º catálogo.

   ```ts
   // dto/validation-messages.ts (sugestão)
   export const decimalMessage = (field: string) =>
     `O campo ${field} deve ser um número decimal positivo em formato texto, com ponto como separador (ex.: "12.34")`;
   export const countMessage = (field: string) =>
     `O campo ${field} deve ser um número inteiro positivo`;
   ```

2. **Comentário de cabeçalho do schema desatualizado** — `prisma/schema.prisma:2-4`: o cabeçalho lista os catálogos F1 como "cabos condutores e cabos de guarda" e não menciona o de tirante, embora o bloco novo esteja bem comentado. Atualizar a enumeração (ou torná-la genérica, ex.: "família de cabos") para não desatualizar a cada catálogo.

3. **Fidelidade de tipo nos mocks (herdado do minor do grupo 1)** — `guy-wires.service.spec.ts:175-191`: os overrides de `versionRow` no teste de pendências usam strings simples (`'0.31'`, `'48.2'`) onde o Prisma devolve `Prisma.Decimal`. Funciona porque o mapper só chama `.toString()`, e há um teste dedicado com `Prisma.Decimal` real (linha 112), mas repete a infidelidade já apontada na review do grupo 1. Sem ação obrigatória; alinhar quando os mocks forem revisitados.

## ✅ Destaques Positivos

- **Extração comprovada na prática**: o terceiro catálogo saiu com ~460 linhas de código de produção (service+controller+DTOs+contratos+schema) contra ~700+ do segundo — todo o boilerplate (pipe pt-BR, autor, data de referência, 405, P2002, pendências, patterns) veio da base, exatamente como o design previa.
- **Comentário preventivo no controller** sobre o pitfall de `@Put`/`@Patch` empilhados — conhecimento institucional das reviews anteriores materializado no código.
- **RNF-08/RNF-09 exemplares**: Decimal como string ponta a ponta com teste dedicado de conversão `Prisma.Decimal → string`; `toVersionFields` normaliza `undefined → null`; teste asserta `utsKn` null quando não informado.
- **Datas civis corretas por construção**: `effectiveFrom` só entra via `toCivilDate` (com validação de calendário round-trip) ou `today` resolvido na borda; teste garante que data inválida não grava nada.
- **Testes determinísticos**: `today` fixo injetado no service; o único teste dependente de relógio (default do controller) asserta apenas a forma civil (`T00:00:00.000Z`).
- **Imutabilidade assertada**: teste de `createVersion` verifica que `guyWireVersion.update` nunca é chamado.
- **Contratos da domain espelham o precedente** (mesma forma de `ground-wires.ts` sem os campos que não se aplicam), com JSDoc explicando RNF-08/09 e a obrigatoriedade de `effectiveFrom` em nova versão.

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ✅ Ok |
| Typescript/Node.js | ✅ Ok (sem `any`; `import type` para linhas Prisma; tipado contra a domain) |
| Angular/NestJS/React | ✅ Ok (DI, pipes, exception filters padrão; rotas PUT/PATCH separadas) |
| REST/HTTP | ✅ Ok (201/400/404/405/409 corretos; rotas kebab-case em inglês) |
| Testes | ✅ Ok (25 novos, 100 no total da api, cenários do spec todos cobertos) |
| Logging/Monitoramento | ✅ Ok (exceções semânticas do Nest; nada a acrescentar nesta fase) |

## Recomendações

1. (Minor 1) Extrair `decimalMessage`/`countMessage` para um módulo compartilhado em `dto/` — pode ser feito junto com o grupo 5 ou registrado como dívida explícita para o 4º catálogo.
2. (Minor 2) Atualizar o comentário de cabeçalho do `prisma/schema.prisma` para incluir (ou generalizar) o catálogo de tirantes.
3. (Minor 3) Quando os specs forem revisitados, usar `Prisma.Decimal` nos overrides de mocks de campos decimais.
4. Seguir para o grupo 5 (UI) reaproveitando `VersionedCatalogApi` sem override de `list` (não há filtro de tipo) — atenção aos pontos já mapeados nas reviews do web: `nx format:check` antes do commit e callback de erro em toda leitura.

## Veredito

**Aprovado com observações.** Nenhum problema crítico ou major. Os grupos 2, 3 e 4 entregam o catálogo de tirantes fiel ao spec e ao design (D1–D3, D5, D6), provando a base extraída no grupo 1: o código novo contém apenas o que é específico do catálogo. Suíte, lint, format e migration verificados nesta review; endpoints validados ao vivo contra o Postgres (8 verificações, incluindo `effectiveOn` passado, 405 e 409). Os três minors não bloqueiam o commit do grupo 4 nem o avanço para o grupo 5; o minor 1 merece decisão explícita (corrigir agora ou registrar dívida).
