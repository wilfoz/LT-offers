# Review do Grupo 1 — Extração do padrão de catálogo (refit sem mudança de comportamento)

**Revisor**: AI Code Reviewer
**Data**: 2026-08-24
**Change / Grupo**: catalogo-cabos-tirante / grupo 1 (tasks 1.1–1.5)
**Status**: Aprovado com observações

## Resumo

O grupo quita as dívidas da "regra das três ocorrências" antes de construir o terceiro catálogo: patterns de validação extraídos para `libs/domain` (D1), helpers da API unificados em `prisma-errors.ts`, `controller-shared.ts` e `missingFields` genérico em `effectiveness.ts` (D2), services tipados contra os contratos da `domain` com mappers `toVersionContract`/`toSummary` (D3) e base web `VersionedCatalogApi` + `form-utils` (D4). O risco nº 1 do design — regressão de comportamento no refit — foi verificado diff a diff: **nenhuma asserção de teste mudou**, apenas fiação (mocks completados porque os mappers exigem linhas completas, chamada `missingFields(version, labels)` e `?.` em `effectiveVersion` agora tipado como anulável). Os specs de controller (405, X-User→"sistema", data de referência na borda, IdPipe pt-BR) não foram tocados e continuam verdes, o que ancora a preservação das mensagens e rotas. Suíte completa verde e `format:check` limpo, verificados nesta review. Restam apenas apontamentos minor (BOM introduzido em dois arquivos do web, uma frase do proposal a alinhar com o D3 refinado e fidelidade dos mocks de Decimal).

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| libs/domain/src/lib/catalogs/validation.ts (novo) | ✅ Ok | 0 |
| libs/domain/src/index.ts | ✅ Ok | 0 |
| apps/api/src/catalogs/prisma-errors.ts (novo) | ✅ Ok | 0 |
| apps/api/src/catalogs/controller-shared.ts (novo) | ✅ Ok | 0 |
| apps/api/src/catalogs/effectiveness.ts | ✅ Ok | 0 |
| apps/api/src/catalogs/effectiveness.spec.ts | ✅ Ok | 0 |
| apps/api/src/catalogs/conductor-cables.service.ts | ✅ Ok | 0 |
| apps/api/src/catalogs/conductor-cables.service.spec.ts | ✅ Ok | 1 (minor, mocks Decimal) |
| apps/api/src/catalogs/ground-wires.service.ts | ✅ Ok | 0 |
| apps/api/src/catalogs/ground-wires.service.spec.ts | ✅ Ok | (mesmo minor dos mocks) |
| apps/api/src/catalogs/conductor-cables.controller.ts | ✅ Ok | 0 |
| apps/api/src/catalogs/ground-wires.controller.ts | ✅ Ok | 0 |
| apps/api/src/catalogs/civil-date.ts | ✅ Ok | 0 |
| apps/api/src/catalogs/dto/*.ts (6 arquivos) | ✅ Ok | 0 |
| apps/web/src/app/catalogs/versioned-catalog-api.ts (novo) | ✅ Ok | 0 |
| apps/web/src/app/catalogs/form-utils.ts (novo) | ✅ Ok | 0 |
| apps/web/src/app/catalogs/conductor-cables-api.service.ts | ✅ Ok | 0 |
| apps/web/src/app/catalogs/ground-wires-api.service.ts | ✅ Ok | 0 |
| apps/web/src/app/catalogs/conductor-cable-form.component.ts | ⚠️ Problemas | 1 (minor, BOM) |
| apps/web/src/app/catalogs/ground-wire-form.component.ts | ⚠️ Problemas | 1 (minor, BOM) |
| openspec/changes/catalogo-cabos-tirante/design.md (D3 refinado) | ✅ Ok | (ver minor 2 no proposal) |

## Verificação dos pontos críticos do refit

1. **Asserções de teste intactas** — conferido no `git diff` dos três specs alterados:
   - `effectiveness.spec.ts`: os 4 `expect` mantêm exatamente os mesmos valores esperados (`[]`, `['UTS (kN)']`, `[]`, `['descrição']`); mudou só a chamada (`pendingFields(v)` → `missingFields(v, CONDUCTOR_CABLE_REQUIRED_LABELS)`) e o texto do `describe`.
   - `conductor-cables.service.spec.ts`: única mudança dentro de um `expect` é `result.effectiveVersion.weightTonPerKm` → `result.effectiveVersion?.weightTonPerKm` (o contrato tipa `effectiveVersion` como anulável) — valor esperado `'1.2'` inalterado. Demais mudanças são o helper `versionRow` completando os mocks.
   - `ground-wires.service.spec.ts`: idem (`?.strengthGrade`, valor `'HS'` inalterado).
   - Specs de controller (`conductor-cables.controller.spec.ts`, `ground-wires.controller.spec.ts`) e `civil-date.spec.ts`: **sem nenhuma alteração** — mensagens 405, fallback X-User, IdPipe pt-BR e data na borda seguem cobertos pelos testes originais.
2. **Mappers** — `Prisma.Decimal.prototype.toJSON` delega a `toString()`, então `weightTonPerKm?.toString() ?? null` produz exatamente a mesma string que a serialização JSON anterior ("0.406", "1.31"); `null`/`undefined` viram `null` via `?.` + `??`. `Date.prototype.toJSON` delega a `toISOString()` — payload de `effectiveFrom`/`createdAt` idêntico. Campos do mapper conferidos 1:1 contra `ConductorCableVersion` e `GroundWireVersion` da domain (todos presentes, sem FKs).
3. **Comportamento das rotas** — helpers de `controller-shared.ts` são transcrições literais dos privados removidos (mesmas mensagens pt-BR de 409/405/400, `user?.trim() || 'sistema'`, `effectiveOn ? toCivilDate : todayCivilDate`); rotas PUT e PATCH continuam em métodos separados (armadilha do metadata do Nest preservada, com o comentário explicativo mantido).
4. **`missingFields` genérico** — semântica idêntica: mesmo `isMissing` (agora exportado, byte a byte igual ao duplicado removido) e ordem dos rótulos vinda de `Object.entries` do mapa. `CONDUCTOR_CABLE_REQUIRED_LABELS` preserva a ordem do antigo `LABELS` (descrição, peso, bobina, diâmetro, UTS); `REQUIRED_BY_TYPE` dos ground-wires não mudou. As asserções de arrays ordenados passam sem ajuste.
5. **`VersionedCatalogApi`** — `inject(HttpClient)` em field initializer da classe abstrata é avaliado durante a construção da subclasse (`providedIn: 'root'`), dentro do contexto de injeção: padrão válido no Angular moderno; confirmado ao vivo pelo smoke Playwright relatado e pelos testes web. O `override list(search?, type?)` do `GroundWiresApi` é um alargamento compatível da assinatura da base.
6. **Sem specs delta para os catálogos existentes** — a change contém apenas `specs/catalogos/cabos-tirante/spec.md`; nada no diff altera os specs principais de `cabos-condutores`, `cabos-guarda` ou `versionamento-vigencia`. Os specs principais não fixam a forma da resposta do POST, então o D3 refinado não conflita com spec algum.
7. **Suíte executada nesta review**: `npx nx run-many -t lint test build` verde (4 projetos; cache Nx íntegro com hashes dos fontes atuais), `npx nx test api --skip-nx-cache` e `npx nx test web --skip-nx-cache` re-executados verdes, `npx nx format:check` completo com exit 0.

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

1. **BOM UTF-8 introduzido em dois componentes do web** — `apps/web/src/app/catalogs/conductor-cable-form.component.ts:1` e `apps/web/src/app/catalogs/ground-wire-form.component.ts:1` agora começam com `EF BB BF` (visível no diff como `+﻿import`). Nenhum outro arquivo do repo usa BOM; é regressão de encoding típica de escrita via PowerShell no Windows e passa despercebida por Prettier/ESLint, mas polui o diff e pode confundir ferramentas. **Correção**: reescrever os dois arquivos sem BOM antes do commit (ex.: `[IO.File]::WriteAllText($path, [IO.File]::ReadAllText($path).TrimStart([char]0xFEFF))`).
2. **Proposal desatualizado em relação ao D3 refinado** — `proposal.md` (Impact) afirma que o "único efeito colateral do refit é a resposta parar de expor FKs internas", mas o envelope do `POST /catalogs/...` também mudou: de `{ id, code, versions: [linha crua] }` para o `XSummary` (`effectiveVersion` + `pendingFields`), conforme o D3 refinado do design. Sem impacto real (o web tipa `create` como `Observable<unknown>` e ignora o corpo; nenhum spec fixa a forma), mas o Impact deve listar os dois efeitos para a trilha da change ficar precisa. **Correção**: uma frase no Impact do proposal.
3. **Mocks de Decimal com fidelidade reduzida** — os helpers `versionRow` dos dois service specs usam strings (`'1.2'`) onde o Prisma devolve `Prisma.Decimal`; como `String.prototype.toString()` é identidade, os testes de unidade não detectariam uma regressão específica da conversão Decimal→string do mapper (foi coberta apenas ao vivo). **Sugestão**: em ao menos um caso por catálogo, usar `new Prisma.Decimal('1.2')` no mock e manter a asserção `toBe('1.2')`.
4. **Helpers novos sem teste unitário direto** — `controller-shared.ts`, `prisma-errors.ts`, `versioned-catalog-api.ts` e `form-utils.ts` são cobertos apenas indiretamente (controller/service specs na API; no web, os component specs mockam os serviços de API, então a base genérica só foi exercitada no smoke ao vivo). Aceitável para um refit cuja rede de segurança são os testes preexistentes; registrar como observação — o catálogo de tirantes (grupos 4–5) será o terceiro consumidor e reforçará a cobertura.

## ✅ Destaques Positivos

- **Disciplina exemplar do refit**: nenhuma asserção alterada em nenhum spec; os dois specs de controller e o de civil-date nem foram tocados. O helper `versionRow` com comentário explicando *por que* os mocks precisaram ser completados é exatamente o tipo de fiação transparente que o design pediu.
- **Extração no limite certo** (critério do design honrado): só entrou o que tinha 2 usos reais — nada de base class de controller Nest (armadilha de metadata documentada e evitada), nada de UI genérica. `missingFields` por mapa de rótulos é a generalização mínima que unifica as duas formas anteriores preservando ordem e semântica (RNF-09: `''`/null ≠ zero).
- **Mappers na borda do service fecham três dívidas de uma vez**: retornos tipados contra a `domain` (drift api↔web eliminado para os dois catálogos), FKs internas fora do payload e conversão Decimal/Date explícita e testável — em vez de depender da serialização implícita do `toJSON`.
- **D1 respeitado à risca**: `validation.ts` contém só os patterns; mensagens pt-BR permanecem em cada borda (RNF-14), com comentário registrando a decisão.
- **`GroundWiresApi.list` como override documentado** mantém a variação real (filtro por tipo) no filho, exatamente como o D4 prescreve.
- Higiene geral: `BadRequestException` mantido no ground-wires.controller apenas onde ainda é usado (`wireType`); imports mortos zerados; `format:check` completo limpo (lição da review do grupo 4 do piloto incorporada).

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ✅ Ok |
| Typescript/Node.js | ✅ Ok |
| Angular/NestJS/React | ✅ Ok |
| REST/HTTP | ✅ Ok |
| Testes | ✅ Ok (asserções preservadas; ver minors 3–4) |
| Logging/Monitoramento | ✅ Ok (nada aplicável neste grupo) |

## Recomendações

1. Remover o BOM de `conductor-cable-form.component.ts` e `ground-wire-form.component.ts` antes do commit do grupo (minor 1).
2. Alinhar o Impact do `proposal.md` com o D3 refinado: citar também a mudança de envelope do POST (minor 2).
3. Opcional, junto com o grupo 4 (testes do tirante): usar `Prisma.Decimal` em ao menos um mock por service spec para dar cobertura real à conversão Decimal→string (minor 3).
4. Nenhuma ação para o minor 4 — apenas manter no radar que a base web ganha cobertura direta quando o terceiro consumidor chegar.

## Veredito

**APROVADO COM OBSERVAÇÕES.** O refit cumpre o objetivo central — extração comprovada pelos dois precedentes **sem mudança de comportamento observável** — com evidência forte: diffs de teste contendo só fiação, specs de controller intactos, mappers equivalentes byte a byte à serialização anterior e suíte completa + `format:check` verificados nesta review. Os quatro apontamentos são minor; recomenda-se corrigir o BOM (1) e a frase do proposal (2) antes do commit do grupo e seguir para o grupo 2 (nomenclatura e modelo de dados do `GuyWire`).
