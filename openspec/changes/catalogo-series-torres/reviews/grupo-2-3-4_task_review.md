# Review dos Grupos 2, 3 e 4 — Contratos de domínio + API de séries de estrutura + API de tipos de torre

**Revisor**: AI Code Reviewer
**Data**: 2026-08-24
**Change / Grupo**: catalogo-series-torres / grupos 2 (task 2.1), 3 (tasks 3.1–3.3) e 4 (tasks 4.1–4.4)
**Commits**: `8a8d54f` (grupo 2), `ef32545` (grupo 3), `1917fe1` (grupo 4)
**Status**: APROVADO COM OBSERVAÇÕES

## Resumo

Entrega dos contratos compartilhados (`structure-series.ts`, `tower-types.ts` na domain) e das duas APIs do primeiro catálogo hierárquico: `/catalogs/structure-series` (padrão idêntico aos catálogos de cabos, com `towerTypeCount` via `_count`) e `/catalogs/structure-series/:seriesId/tower-types` (aninhamento completo com checagem de pertencimento, nested create atômico da tabela peso × altura, pendências compostas). O design D2/D3 foi seguido à risca e todos os padrões institucionais vieram aplicados de primeira: data civil resolvida na borda, Decimal→string nos mappers tipados contra a domain, null ≠ zero (zero estais válido), mensagens pt-BR, rotas PUT/PATCH em métodos separados, P2002→409, `@IsEmpty` para troca de função. Zero problemas críticos e zero majors — terceira entrega seguida limpa nos níveis altos. Restam três minors: um edge de mapeamento de P2002 com duas constraints na mesma operação, a cobertura fraca do repasse do termo de busca (lição recorrente da memória) e a decisão sobre o prefixo `weights.0.` nas mensagens aninhadas (avaliado como aceitável, com orientação para a UI).

Verificações executadas: `npx nx run-many -t test lint -p api domain` (159 testes da api + domain, tudo verde), `npx nx format:check` completo (limpo), `npx prisma migrate status` (7 migrations, banco em dia), BOM ausente em todos os 17 arquivos novos (`head -c3 | od`). Task 4.4 (verificação ao vivo) reportada com os cenários de 404/400/409/405 exercitados contra o Postgres do Compose.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `libs/domain/src/lib/catalogs/structure-series.ts` | ✅ Ok | 0 |
| `libs/domain/src/lib/catalogs/tower-types.ts` | ✅ Ok | 0 |
| `libs/domain/src/index.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogs/structure-series.service.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogs/structure-series.controller.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogs/structure-series.service.spec.ts` | ⚠️ Problemas | 1 (minor) |
| `apps/api/src/catalogs/structure-series.controller.spec.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogs/tower-types.service.ts` | ⚠️ Problemas | 1 (minor) |
| `apps/api/src/catalogs/tower-types.controller.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogs/tower-types.service.spec.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogs/tower-types.controller.spec.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogs/dto/structure-series-version-fields.dto.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogs/dto/create-structure-series.dto.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogs/dto/create-structure-series-version.dto.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogs/dto/tower-weight-point.dto.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogs/dto/tower-type-version-fields.dto.ts` | ⚠️ Problemas | 1 (minor, decisão registrada) |
| `apps/api/src/catalogs/dto/create-tower-type.dto.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogs/dto/create-tower-type-version.dto.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogs/dto/validation-messages.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogs/catalogs.module.ts` | ✅ Ok | 0 |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

**MIN-1 — Duas constraints de unicidade na mesma operação podem produzir mensagem de 409 enganosa**

- Arquivos: `apps/api/src/catalogs/tower-types.service.ts` (catches de `create`, linhas 80–87, e `createVersion`, linhas 111–118)
- Situação nova nesta change: nos catálogos anteriores cada operação tocava **uma** constraint de unicidade, então o `isUniqueViolation(error)` genérico mapeava sem ambiguidade. Aqui o nested create do tipo de torre pode violar **três**: `@@unique([structureSeriesId, code])`, `@@unique([towerTypeId, effectiveFrom])` e `@@unique([towerTypeVersionId, heightM])` da tabela de pesos. O validador `UniqueWeightHeights` compara alturas por `Number()`, mas o Postgres arredonda para `Decimal(10,3)`: dois pontos como `"24.0001"` e `"24.0004"` passam no DTO (números distintos), colidem no banco (ambos viram `24.000`) e o P2002 resultante é respondido como `A sigla "..." já está em uso nesta série` (no create) ou `Já existe uma versão com esta data de início de vigência` (no createVersion) — mensagem errada para a causa real. A integridade está preservada (409, nada gravado, operação atômica), só a mensagem engana num edge improvável.
- Correção sugerida (qualquer uma das duas): (a) distinguir a constraint violada pelo `meta.target` do `PrismaClientKnownRequestError` no helper `isUniqueViolation`/num novo helper, mapeando cada alvo para sua mensagem; ou (b) fechar o edge na borda, limitando as casas decimais do DTO à precisão do banco (3 casas para `heightM`, 2 para `weightKg`) — o que também eliminaria o arredondamento silencioso herdado do pattern genérico. Registrar como insumo da reavaliação da base extraída se não for tratado agora.

**MIN-2 — Cobertura do repasse do termo de busca continua fraca (lição recorrente)**

- Arquivos: `apps/api/src/catalogs/structure-series.service.spec.ts` (teste "busca por nome e projetista", linhas 180–187) e `structure-series.controller.spec.ts` (teste "repassa a data de referência válida...", linhas 54–59)
- O teste do service chama `service.list('Raptor', today)` mas asserta apenas `expect(where.OR).toBeDefined()` — não verifica que o termo `'Raptor'` chegou ao filtro nem que os dois ramos (nome e projetista) o utilizam. O teste do controller passa `'Raptor'` e asserta somente o parâmetro de data. Um regressão que ignorasse o termo (ex.: filtro construído com string fixa ou parâmetro trocado) passaria verde. É a mesma lacuna apontada no grupo 5 de catalogo-cabos-tirante (cobertura do repasse do termo podada junto com o teste do filtro de tipo).
- Correção sugerida: no service spec, assertar o conteúdo do `where` (ex.: `expect(where.OR[0].name.contains).toBe('Raptor')` e `expect(where.OR[1].versions.some.designer.contains).toBe('Raptor')`); no controller spec, adicionar `expect(serviceMock.list.mock.calls[0][0]).toBe('Raptor')` ao teste existente.

**MIN-3 — Prefixo `weights.0.` nas mensagens de validação aninhadas (ponto conhecido — avaliado como ACEITÁVEL)**

- Arquivo: `apps/api/src/catalogs/dto/tower-type-version-fields.dto.ts` (efeito do `ValidateNested({ each: true })` com o `ValidationPipe` global de `apps/api/src/main.ts`)
- O achatamento padrão do `ValidationPipe` prefixa as mensagens dos filhos com o caminho da propriedade: `weights.0.O campo altura (m) deve ser um número decimal positivo...`. Avaliação: **aceitável nesta entrega** — o corpo da mensagem está em pt-BR (RNF-14), o prefixo identifica exatamente a linha ofensora (o que o cenário "apontando o campo inválido" do spec pede) e o nome do campo em inglês é consistente com a convenção do JSON da API. Duas condições para permanecer aceitável: (1) a UI do grupo 5 valida por linha no `FormArray` antes do submit (design D4), de modo que o usuário normalmente não vê a mensagem crua da API; (2) se alguma tela vier a exibir mensagens cruas do 400, aí sim implementar um `exceptionFactory` no `ValidationPipe` traduzindo o caminho (`weights.0` → "linha 1 da tabela peso × altura"). Nenhuma ação obrigatória agora; fica registrado como decisão.

## ✅ Destaques Positivos

1. **Terceira entrega consecutiva sem críticos nem majors** — a base extraída em catalogo-cabos-tirante segurou o primeiro catálogo hierárquico sem nenhuma reimplementação: `structure-series.service.ts` é estruturalmente o `guy-wires.service.ts` + `_count`, exatamente o critério de sucesso do design.
2. **Aninhamento com pertencimento bem resolvido**: `getItem(seriesId, id)` via `findFirst({ id, structureSeriesId })` com teste assertando o `where` composto (`tower-types.service.spec.ts:240-241`). O par `getSeries` + `findFirst` rende duas queries, mas compra mensagens 404 distintas ("Série de estrutura não encontrada" vs "Tipo de torre não encontrado nesta série") — desvio benéfico da "checagem única" citada nos riscos do design, coerente com o D2.
3. **Tabela de pesos imutável com a versão, atômica e ordenada**: nested create numa única operação Prisma (sem transação manual, conforme D1), `WEIGHTS_INCLUDE` com `orderBy: { heightM: 'asc' }` aplicado em todos os retornos e testado, e o cenário "versão anterior preserva a tabela da época" coberto com duas versões e tabelas distintas.
4. **Pendências compostas conforme D3**: `missingFields` para o escalar (`guyCount`) + verificação explícita de tabela vazia com rótulo próprio ("tabela peso × altura"), com os três cenários do spec testados — incluindo o crucial "zero estais com tabela preenchida não é pendência" (RNF-09).
5. **Validações de qualidade**: `PositiveNonZeroDecimal` compõe o pattern da domain com `> 0` (spec exige rejeitar zero nos pontos, diferente dos decimais dos catálogos anteriores); `UniqueWeightHeights` compara numericamente ("24" ≡ "24.000", testado); `@IsEmpty` em `function` com mensagem orientativa ("...para outra função, crie um novo tipo de torre") segue o precedente OPGW.
6. **Higiene institucional completa**: format:check integral limpo, BOM ausente nos 17 arquivos novos, comentários explicando os porquês não óbvios (PUT/PATCH em métodos separados, motivo do `@IsEmpty`, limite do `missingFields`), mocks com `Prisma.Decimal` real no teste de conversão Decimal→string, migrations em dia.
7. **Contratos da domain limpos**: decimais como string, datas ISO, `TowerWeightPoint` compartilhado entre DTO e web, `towerTypeCount` no summary da série, `TOWER_FUNCTIONS` const-array no padrão ground-wires.

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ✅ Ok |
| Typescript/Node.js | ✅ Ok |
| Angular/NestJS/React | ✅ Ok |
| REST/HTTP | ✅ Ok |
| Testes | ⚠️ Problemas (MIN-2: asserção fraca do termo de busca) |
| Logging/Monitoramento | ✅ Ok |

## Recomendações

1. (MIN-2) Reforçar as asserções do termo de busca no service e no controller spec de structure-series — correção de minutos, fecha uma lacuna que já reincidiu entre catálogos.
2. (MIN-1) Tratar a ambiguidade do P2002 no tower-types: preferencialmente limitar as casas decimais dos DTOs de peso à precisão do banco (3/2 casas), que também elimina o arredondamento silencioso; alternativamente inspecionar `meta.target`. Se ficar para depois, registrar como insumo da reavaliação da base extraída.
3. (MIN-3) Nenhuma ação agora; garantir no grupo 5 que o `FormArray` valida por linha antes do submit (já previsto no design D4), mantendo a mensagem crua `weights.0.` fora do caminho do usuário.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Os grupos 2, 3 e 4 estão prontos: cenários do spec cobertos nos dois níveis, design D2/D3 seguido fielmente, todas as lições institucionais aplicadas de primeira e todos os gates verdes (testes, lint, formatação completa, migrations, BOM). Os três minors não bloqueiam o avanço para o grupo 5 (UI); recomenda-se resolver MIN-2 (trivial) junto do próximo commit e decidir o destino de MIN-1 antes do QA da change.
