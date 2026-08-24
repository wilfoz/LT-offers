# Review dos Grupos 2 e 3 — Contratos compartilhados e API de cabos de guarda

**Revisor**: AI Code Reviewer
**Data**: 2026-08-23
**Change / Grupo**: catalogo-cabos-guarda-opgw / grupos 2 (Contratos compartilhados) e 3 (API de cabos de guarda)
**Status**: Aprovado com observações

## Resumo

Os grupos entregam os contratos compartilhados em `libs/domain/src/lib/catalogs/ground-wires.ts` (tarefa 2.1) e a API completa de cabos de guarda em `apps/api/src/catalogs` (tarefas 3.1–3.5): controller, service, três DTOs e duas suítes de teste. A implementação replica fielmente o padrão do piloto (`conductor-cables`) e incorpora **todos** os aprendizados das reviews anteriores já na primeira entrega: `P2002` → 409 sem check-then-create, `ParseIntPipe` com `exceptionFactory` pt-BR, um decorador HTTP por método (PUT e PATCH em métodos separados, com comentário explicando o porquê), datas civis com round-trip via `civil-date.ts` e data de referência resolvida na borda. A novidade da change — variação por tipo (STEEL/OPGW) — está bem resolvida: validação de aplicabilidade centralizada no service (create contra `dto.type`; nova versão contra o tipo persistido do item), `@IsEmpty` no campo `type` do DTO de versão para que o `ValidationPipe` com `whitelist: true` não descarte a tentativa de troca em silêncio, e `pendingFields` calculado por tipo conforme o spec (fabricante e descrição fora).

Suítes verdes: `npx nx run-many -t test lint -p api domain` (75 testes na api, 8 suítes; lint limpo nos dois projetos, incluindo as fronteiras `scope:app → scope:domain`). Verificação ao vivo contra o Postgres do Compose reportada com 14 cenários passando.

**Um problema major impede a aprovação plena**: `npx nx format:check` (gate do CI, `.github/workflows/ci.yml`) reprova em `ground-wires.controller.spec.ts` — reincidência exata do major M1 da review grupo-4 do piloto. A correção é trivial (um `prettier --write`), mas o commit como está quebraria o CI.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| libs/domain/src/lib/catalogs/ground-wires.ts | ✅ Ok | 0 |
| libs/domain/src/index.ts | ✅ Ok | 0 |
| apps/api/src/catalogs/dto/ground-wire-version-fields.dto.ts | ✅ Ok | 0 |
| apps/api/src/catalogs/dto/create-ground-wire.dto.ts | ✅ Ok | 0 |
| apps/api/src/catalogs/dto/create-ground-wire-version.dto.ts | ✅ Ok | 0 |
| apps/api/src/catalogs/ground-wires.service.ts | ✅ Ok | 2 minors |
| apps/api/src/catalogs/ground-wires.controller.ts | ✅ Ok | 0 |
| apps/api/src/catalogs/catalogs.module.ts | ✅ Ok | 0 |
| apps/api/src/catalogs/ground-wires.service.spec.ts | ✅ Ok | 0 |
| apps/api/src/catalogs/ground-wires.controller.spec.ts | ⚠️ Problemas | 1 major |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

**M1 — `nx format:check` (gate do CI) reprova em `ground-wires.controller.spec.ts`**

- Arquivo: `apps/api/src/catalogs/ground-wires.controller.spec.ts`, linhas 115–118
- O CI executa `npx nx format:check` (`.github/workflows/ci.yml`) e o arquivo falha na checagem. A única divergência é a chamada quebrada em três linhas quando cabe em uma:

  ```ts
  // como está
  const errors = await validate(
    dto({ code: 'CG-X', type: 'ACO' as never }),
  );

  // como o Prettier exige
  const errors = await validate(dto({ code: 'CG-X', type: 'ACO' as never }));
  ```

- Correção: `npx prettier --write apps/api/src/catalogs/ground-wires.controller.spec.ts` e reexecutar `npx nx format:check` completo antes do commit.
- Observação de processo: é **reincidência** do major M1 da review grupo-4 do piloto e do próprio design desta change (D3 lista "`nx format:check` antes de cada commit" como padrão obrigatório herdado). Atenção: a forma `--files` do comando passa em silêncio; usar sempre a forma completa.

### 🟢 Problemas Minor

**m1 — Assimetria entre `isMissing` e `isInformed` para string vazia** (`ground-wires.service.ts:61-70`)

- `isMissing` trata `''` como não informado (pendência), mas `isInformed` — usado em `assertFieldsApplyToType` — trata `''` como informado. Consequência: um payload OPGW com `strengthGrade: ""` leva 400 por "campo do outro tipo", embora string vazia signifique "não informado" no restante do sistema (RNF-09). Na prática é quase inalcançável (a UI mapeia branco→null via `orNull`), mas a semântica ideal seria as duas funções concordarem — por exemplo, `const isInformed = (v: unknown) => !isMissing(v)`. Se preferirem manter a rejeição estrita, registrar a intenção num comentário curto.

**m2 — Tipagem frouxa em `REQUIRED_BY_TYPE`/`pendingFields`** (`ground-wires.service.ts:47`, `222-230`)

- `Record<string, string>` e `version: Record<string, unknown>` perdem a checagem de chaves contra os campos reais da versão (um typo em uma chave de `REQUIRED_BY_TYPE` compilaria e silenciosamente nunca acusaria pendência). Sugestão: derivar as chaves dos rótulos (`keyof typeof COMMON_REQUIRED_LABELS | keyof typeof STEEL_ONLY_LABELS | ...`) ou tipar `version` com `Pick<GroundWireVersion, ...>`. Não bloqueia: os testes de pendência por tipo cobrem os dois tipos e pegariam regressão grosseira.

**m3 — Resposta da API expõe campos fora do contrato da domain** (observação herdada do conductor)

- O service devolve as linhas Prisma cruas (`groundWireId`, `id` interno da versão) e não declara os tipos de retorno contra `GroundWireSummary`/`GroundWireHistory` de `@lt-offers/domain` — o contrato é cumprido "por coincidência estrutural" (Decimal serializa como string no JSON), não por checagem do compilador. Mesmo comportamento do `conductor-cables`; o risco de drift api↔web já está registrado. Quando a extração do "catálogo genérico" acontecer (terceira ocorrência), vale tipar os retornos com os contratos da lib.

### ✅ Destaques Positivos

1. **Todos os padrões das reviews do piloto aplicados de primeira** (design D3): `isUniqueViolation` duck-typing → `ConflictException` no create e no createVersion (sem check-then-create); `IdPipe` com `exceptionFactory` pt-BR; PUT e PATCH em métodos separados com comentário explicando o bug de metadata do NestJS; `toCivilDate`/`todayCivilDate` reutilizados sem alteração; data de referência resolvida exclusivamente na borda (controller), service puro em relação ao relógio.
2. **Solução elegante para o cenário "tipo não pode ser alterado"**: o `@IsEmpty` em `create-ground-wire-version.dto.ts` com comentário explicando que sem a declaração o `ValidationPipe` (whitelist) descartaria a propriedade em silêncio — o cenário do spec exige rejeição com mensagem, e a mensagem ("O tipo é fixo desde a criação…") espelha o spec literalmente.
3. **Validação de aplicabilidade por tipo bem colocada** (design D1): única via de escrita, mensagem 400 aponta os campos ofensivos com rótulos pt-BR e o nome do tipo em português; `null` explícito não conta como "informado" (RNF-09), com teste dedicado.
4. **Primeira consumidora dos contratos da domain na API**: `GROUND_WIRE_TYPES`/`GroundWireType` importados de `@lt-offers/domain` no controller, DTO e service — elimina a duplicação do enum entre api e web e respeita as fronteiras de lint (`scope:app → scope:domain`, verificado com lint verde). Cria assimetria com `conductor-cables` (que não importa da domain), mas na direção certa; alinhar o conductor fica para a extração futura.
5. **Cobertura de testes mapeia 1:1 os cenários do spec** `catalogos/cabos-guarda`: criação por tipo (aço e OPGW), 409 duplicado entre tipos, tipo inválido/ausente com mensagem pt-BR, troca de tipo rejeitada, campo do outro tipo rejeitado nos dois sentidos (create e createVersion), contagens fracionárias/zero/negativas, filtro por tipo presente e ausente, pendências por tipo — incluindo os cenários negativos "fabricante ausente não é pendência" e "não cobra campos de aço de OPGW" —, histórico ordenado desc, datas de calendário inválidas (2026-02-30), autor via `X-User` com fallback "sistema". Descrições em pt-BR, código em inglês (RNF-14).
6. **Contrato da domain bem documentado**: comentários registram RNF-08 (decimal como string), RNF-09 (null ≠ 0) e a regra de identidade do tipo; `NewGroundWireVersionInput` torna `effectiveFrom` obrigatório por tipo, espelhando a API.

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ✅ Ok |
| Typescript/Node.js | ✅ Ok (sem `any`; tipagem frouxa pontual — m2) |
| Angular/NestJS/React | ✅ Ok |
| REST/HTTP | ✅ Ok (409/400/404/405 corretos; verificação ao vivo com 14 cenários) |
| Testes | ✅ Ok (75 testes verdes na api; cenários do spec cobertos) |
| Formatação (gate do CI) | ❌ `nx format:check` reprovando — M1 |

## Recomendações

1. **(M1 — obrigatório antes do commit)** Rodar `npx prettier --write apps/api/src/catalogs/ground-wires.controller.spec.ts` e confirmar `npx nx format:check` limpo (forma completa, sem `--files`).
2. **(m1)** Unificar a semântica de "informado": fazer `isInformed` ser a negação de `isMissing` (ou documentar a rejeição estrita de string vazia em campo do outro tipo).
3. **(m2)** Apertar a tipagem de `REQUIRED_BY_TYPE` e `pendingFields` para chaves derivadas dos rótulos, eliminando o `Record<string, ...>`.
4. **(m3 — para a change futura de extração)** Tipar os retornos do service com os contratos de `@lt-offers/domain` e alinhar o `conductor-cables` ao mesmo padrão de import da domain.
5. **(processo)** Incluir `npx nx format:check` no checklist local de cada task de código — terceira change em que o gate pega arquivo novo; considerar um hook de pre-commit.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Nenhum problema crítico: a lógica está correta, os cenários do spec `catalogos/cabos-guarda` têm cobertura completa de testes (suítes e lint verdes, verificação ao vivo com 14 cenários), e todos os padrões herdados das reviews do piloto foram aplicados desde a primeira entrega. O único bloqueio prático é o M1 (formatação reprovando no gate do CI), de correção trivial e obrigatória antes do commit dos grupos 2–3. Os minors m1–m2 podem ser corrigidos junto; m3 fica registrado para a extração do catálogo genérico. Após o `prettier --write` + `format:check` limpo, os grupos estão prontos para seguir ao grupo 4 (interface de manutenção).
