# Review dos Grupos 2 e 3 — Contratos compartilhados + API de isoladores

**Revisor**: AI Code Reviewer
**Data**: 2026-08-24
**Change / Grupo**: catalogo-isoladores / grupos 2 (task 2.1) e 3 (tasks 3.1 a 3.4)
**Status**: APROVADO COM OBSERVAÇÕES

## Resumo

Os grupos entregam os contratos do isolador na `domain`
(`libs/domain/src/lib/catalogs/insulators.ts`, exportado pelo index) e a API
completa em `/catalogs/insulators` (controller/service/DTOs registrados no
`CatalogsModule`), com 25 testes novos (12 de service + 13 de
controller/DTO). O critério de aceite do design D2 — service = "guy-wires com
outros campos" — foi cumprido literalmente: o diff conceitual contra
`guy-wires.service.ts` se resume a nomes de campos, mapa de rótulos de
pendência e a mensagem do 404; o controller é espelho exato do precedente
(incl. o comentário institucional sobre `@Put`/`@Patch` empilhados). Zero
atrito da base extraída: nenhum helper reimplementado, nenhum override
inesperado — insumo positivo para a reavaliação pós-5º catálogo.

A novidade legítima do grupo é o validator `DecimalWithScale` (decimal com
zero permitido e escala limitada à precisão da coluna): o spec de isoladores
só rejeita negativo/não numérico, então o `PositiveNonZeroDecimal` de
series-torres (que rejeita zero) não servia — a distinção está documentada em
comentário e a lição P2002 (escala ≤ precisão da coluna: 2 casas para
ruptura, 3 para os comprimentos) veio aplicada com teste dedicado.

Verificação independente: `npx nx run-many -t test lint -p api domain
--skip-nx-cache` verde (185 testes na api), BOM ausente nos 8 arquivos novos
(`head -c3 | od`), tabelas `insulator`/`insulator_version` zeradas no
Postgres dev após a verificação ao vivo da task 3.4. **Porém `npx nx
format:check --all` REPROVA em `insulators.controller.spec.ts`** — major
único, reincidência do gate de formatação; exige `prettier --write` antes do
commit (o CI roda esse gate e quebraria no push).

## Arquivos Revisados

| Arquivo                                                   | Status       | Problemas |
| --------------------------------------------------------- | ------------ | --------- |
| `libs/domain/src/lib/catalogs/insulators.ts`               | ✅ Ok        | 0         |
| `libs/domain/src/index.ts`                                 | ✅ Ok        | 0         |
| `apps/api/src/catalogs/insulators.service.ts`              | ✅ Ok        | 0         |
| `apps/api/src/catalogs/insulators.controller.ts`           | ✅ Ok        | 0         |
| `apps/api/src/catalogs/catalogs.module.ts`                 | ✅ Ok        | 0         |
| `apps/api/src/catalogs/dto/insulator-version-fields.dto.ts`| ✅ Ok        | 2 minors  |
| `apps/api/src/catalogs/dto/create-insulator.dto.ts`        | ✅ Ok        | 0         |
| `apps/api/src/catalogs/dto/create-insulator-version.dto.ts`| ✅ Ok        | 0         |
| `apps/api/src/catalogs/insulators.service.spec.ts`         | ✅ Ok        | 0         |
| `apps/api/src/catalogs/insulators.controller.spec.ts`      | ⚠️ Problemas | 1 major, 1 minor |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

1. **`insulators.controller.spec.ts:113` — reprova em `npx nx format:check
   --all` (gate do CI).** A linha excede 80 colunas e o Prettier quebraria o
   objeto em múltiplas linhas:

   ```ts
   // atual (reprova):
   dto({ code: 'ISO-X', ruptureStrengthKn: '120.505', spacingMm: '146.0005' }),
   // esperado pelo Prettier:
   dto({
     code: 'ISO-X',
     ruptureStrengthKn: '120.505',
     spacingMm: '146.0005',
   }),
   ```

   O CI executa este gate (`.github/workflows/ci.yml`) — o push do commit
   quebraria o pipeline. **4ª reincidência histórica** do gate de formatação
   (piloto grupo-4; guarda-opgw grupos 1 e 2-3; duas changes seguidas limpas;
   reincide agora — e de novo num `*.controller.spec.ts`). Correção antes do
   commit: `npx prettier --write
   apps/api/src/catalogs/insulators.controller.spec.ts` e reconferir com
   `npx nx format:check --all`. A recomendação de hook pre-commit registrada
   em guarda-opgw segue válida.

### 🟢 Problemas Minor

1. **`insulators.controller.spec.ts:80-93` — a razão de existir do
   `DecimalWithScale` (zero permitido) não tem teste no nível do DTO.** O
   validator novo foi criado exatamente porque o spec aceita zero (só rejeita
   negativo/não numérico), mas nenhum teste valida `'0'`/`'0.00'` passando
   pela validação. A distinção zero ≠ null está testada apenas no service
   (pendências com `Prisma.Decimal('0')`). Se uma manutenção futura trocar o
   validator pelo `PositiveNonZeroDecimal` "para unificar", nenhum teste
   quebra. Correção sugerida: incluir um campo com `'0'` no teste "aceita
   decimais como string...":

   ```ts
   ruptureStrengthKn: '0', // zero informado é valor válido (RNF-09)
   ```

2. **`insulator-version-fields.dto.ts:17-27` — 2ª ocorrência da lógica de
   escala duplicada.** `DecimalWithScale` repete de `PositiveNonZeroDecimal`
   (`tower-weight-point.dto.ts:15-29`) o miolo
   `value.split('.')[1] ?? ''` + `decimals.length <= maxScale`. Pela regra
   das três ocorrências não obriga extração agora; fica registrado que a
   forma natural na 3ª ocorrência é `PositiveNonZeroDecimal` compor
   `DecimalWithScale` + `Number(value) > 0` num `dto/decimal-validators.ts`.

**Notas informativas (sem ação exigida):**

- `decimalWithScaleMessage` diz "número decimal positivo" para um validator
  que aceita zero — herança do nome `POSITIVE_DECIMAL_PATTERN` (que também
  aceita `"0"` em toda a família de catálogos). Wording pré-existente; se
  incomodar, ajustar junto com a eventual extração dos validators.
- Os DTOs dos três catálogos de cabos NÃO limitam a escala dos decimais
  (aplicam só o pattern) — lá o risco P2002-com-mensagem-errada não existe
  (nenhum decimal participa de constraint unique), restando apenas o
  arredondamento silencioso do Postgres. Fica como insumo da reavaliação
  pós-5º catálogo, não como retrofit desta change.
- `MaxLength` 50/100/200 dos textos são limites da API (colunas são `text`
  no Postgres) — mesmo desenho do precedente, consistente.

## ✅ Destaques Positivos

- **Critério de aceite do design D2 cumprido à risca**: diff conceitual do
  service contra `guy-wires.service.ts` = campos, rótulos e mensagens;
  controller idêntico ao precedente; nenhum helper da base extraída
  reimplementado (`createIdPipe`, `resolveAuthor`, `resolveReferenceDate`,
  `versionImmutableException`, `isUniqueViolation`, `missingFields`,
  `toCivilDate` — tudo consumido como está). Zero atrito no 5º catálogo.
- **Asserção FORTE do termo de busca — lacuna reincidente finalmente
  fechada**: o spec do service compara o `where.OR` completo por igualdade
  (termo `'ISO'` presente em código E descrição), e o spec do controller
  asserta termo e data repassados. As duas reviews anteriores que apontaram a
  asserção fraca (`toBeDefined`) foram atendidas de primeira.
- **Lição P2002 de series-torres aplicada com teste**: escala dos DTOs
  limitada à precisão das colunas (2 para `Decimal(12,2)`, 3 para
  `Decimal(10,3)`), comentário por campo apontando a coluna do schema, e
  teste dedicado assertando as mensagens pt-BR com "2 casas"/"3 casas".
- **Distinção deliberada e documentada entre validators**: `DecimalWithScale`
  (zero permitido, spec de isoladores) vs `PositiveNonZeroDecimal` (zero
  inválido, spec de series-torres) — o comentário no DTO registra o porquê,
  evitando "unificação" equivocada no futuro.
- **Pendências exatamente por spec**: 6 rótulos pt-BR (tipo, perfil, carga de
  ruptura (kN), diâmetro (mm), passo (mm), linha de fuga (mm)); fabricante e
  descrição fora; teste distingue `Decimal('0')` (valor) de `null`
  (pendência) — RNF-09 na prática.
- **Mocks honestos com o Prisma**: linha de versão completa (mappers exigem a
  linha inteira) e teste dedicado com `Prisma.Decimal` real assertando a
  conversão para string no contrato — mitiga o minor institucional dos mocks
  com string.
- **Contratos da domain no molde exato** de `guy-wires.ts` (decimais string,
  anuláveis, `Summary` com `pendingFields`, `New*VersionInput` exigindo
  `effectiveFrom`), export em ordem alfabética no index.
- **Higiene de entrega**: BOM ausente nos 8 arquivos novos, suíte verde sem
  cache (185 testes na api), lint limpo em api e domain, banco dev limpo após
  a verificação ao vivo (0 linhas em `insulator`/`insulator_version`),
  tasks.md marcando apenas os grupos entregues.

## Conformidade com Padrões

| Padrão                | Status                                                                  |
| --------------------- | ----------------------------------------------------------------------- |
| Padrões de Código     | ⚠️ Problemas (major de formatação no spec do controller; resto ✅)      |
| Typescript/Node.js    | ✅ Ok (sem `any`; retornos tipados contra os contratos da domain)        |
| Angular/NestJS/React  | ✅ Ok (NestJS: pipes/validação/exceções nos padrões; PUT/PATCH separados)|
| REST/HTTP             | ✅ Ok (201/404/405/409/400 verificados; rotas no padrão dos catálogos)   |
| Testes                | ✅ Ok (25 novos, todos os cenários do spec; 1 minor de lacuna do zero)   |
| Logging/Monitoramento | N/A (padrão da família — exceções NestJS; sem logging estruturado ainda) |

## Recomendações

1. **(Major 1 — antes do commit)** Rodar `npx prettier --write
   apps/api/src/catalogs/insulators.controller.spec.ts` e confirmar
   `npx nx format:check --all` limpo. Sem isso o CI quebra no push.
2. (Minor 1) Acrescentar `'0'` num campo decimal do teste "aceita decimais
   como string..." do `CreateInsulatorDto`, protegendo a semântica
   zero-permitido do `DecimalWithScale` contra regressão.
3. (Minor 2 — sem ação nesta change) Na 3ª ocorrência de validator decimal
   com escala, extrair `DecimalWithScale` para um `dto/decimal-validators.ts`
   e fazer `PositiveNonZeroDecimal` compor sobre ele.
4. (Rotina de commit) Staging explícito por caminho (nunca `git add -A`):
   os 8 arquivos novos, `catalogs.module.ts`, `libs/domain/src/index.ts` e
   `openspec/changes/catalogo-isoladores/` (tasks.md + esta review).
5. (Para o grupo 4) A UI deve validar a escala espelhando os DTOs (2 casas na
   ruptura, 3 nos comprimentos) para o usuário não receber 400 cru da API — e
   lembrar das lições já listadas no design D3 (termo de busca assertado,
   `mat-progress-bar` no histórico, prefill bloqueante).

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero críticos; um único major, de formatação
(reincidência do gate `format:check` em spec de controller), com correção
mecânica de um comando — **obrigatória antes do commit**, pois o CI executa o
gate. O código em si está no melhor nível da série: o 5º catálogo saiu da
base extraída sem nenhum atrito, as duas lacunas reincidentes de reviews
anteriores (asserção do termo de busca, escala dos decimais) vieram fechadas
de primeira, e a única novidade (`DecimalWithScale`) é justificada pelo spec
e documentada. Corrigido o major (e, idealmente, o minor 1 do teste do zero),
os grupos 2-3 estão prontos para commit e o grupo 4 (UI) pode começar.
