# Tasks: catalogo-series-torres

## 1. Nomenclatura e modelo de dados

- [x] 1.1 Acrescentar ao mapa do README os termos novos (design D5): `StructureSeries`/`structure_series`/`structure-series`, `TowerType`/`tower_type`/`tower-types`, `TowerFunction {SUSPENSION, ANCHOR}`, `designer`, `voltageKv`, `circuitCount`, `cablesPerPhase`, `designWindSpeedMs`, `insulatorType`, `silMw`, `guyCount`, `heightM`, `weightKg` (atenção ao realinhamento da tabela pelo Prettier)
- [x] 1.2 Modelar no `schema.prisma` (design D1): `StructureSeries`/`StructureSeriesVersion` (nome único; campos anuláveis RNF-09, precisões 12,2, `Int?` p/ circuitos e cabos por fase, `effective_from @db.Date`, `@@unique` + índice desc), `enum TowerFunction`, `TowerType` (`@@unique([structure_series_id, code])`, função na identidade)/`TowerTypeVersion` (`guy_count Int?`) e `TowerTypeWeight` (`@@unique([tower_type_version_id, height_m])`); gerar a migration
- [x] 1.3 Aplicar a migration no Postgres local e regenerar o Prisma Client, confirmando os tipos no client

## 2. Contratos compartilhados

- [x] 2.1 Criar `libs/domain/src/lib/catalogs/structure-series.ts` e `tower-types.ts` (design D3): `TOWER_FUNCTIONS`/`TowerFunction` const-array, interfaces Summary/Version/History com decimais string e datas ISO, `TowerWeightPoint` e `towerTypeCount` no summary da série; exportar pelo index e rodar lint/test da domain

## 3. API de séries de estrutura

- [ ] 3.1 Criar `structure-series.controller/service` em `/catalogs/structure-series` sobre a base extraída (helpers `controller-shared`/`prisma-errors`/`missingFields`, mappers D3, data civil na borda), registrando no `CatalogsModule`; `list` com busca por nome/projetista, `effectiveOn` e `towerTypeCount` via `_count`
- [ ] 3.2 Implementar DTOs com class-validator e mensagens pt-BR (patterns da domain): nome obrigatório/único (P2002→409), decimais como string positiva, circuitos e cabos por fase inteiros positivos, `null` p/ não informado; `pendingFields` = todos os campos da versão (design D3)
- [ ] 3.3 Escrever testes do service e controller cobrindo os cenários do spec (criação, nome duplicado 409, numéricos inválidos, busca por nome, pendências incl. série sem SIL, histórico, vigência, 405 PUT/PATCH, autor X-User)

## 4. API de tipos de torre

- [ ] 4.1 Implementar DTOs (design D2): função obrigatória na criação e `@IsEmpty` com mensagem pt-BR no DTO de versão (troca rejeitada com 400), `guyCount` inteiro ≥ 0 (zero válido, distinto de null), tabela de pesos como array `ValidateNested` de `{heightM, weightKg}` decimais positivos com validador custom de altura duplicada em pt-BR
- [ ] 4.2 Criar `tower-types.controller/service` com prefixo aninhado `/catalogs/structure-series/:seriesId/tower-types` (design D2): checagem de pertencimento série↔tipo com 404 pt-BR em toda operação, sigla única por série (P2002→409), versão + tabela de pesos via nested create atômico, pendências = `guyCount` composto com verificação de tabela vazia (design D3), pesos ordenados por altura nos retornos
- [ ] 4.3 Escrever testes do service e controller cobrindo os cenários do spec (criação, sigla duplicada na série 409, mesma sigla em outra série aceita, série inexistente 404, troca de função 400, altura duplicada 400, ponto inválido 400, versão anterior preserva tabela, zero estais sem pendência, tabela vazia sinalizada, histórico com pesos, 405)
- [ ] 4.4 Verificar os endpoints ao vivo contra o Postgres do Compose (série + tipos aninhados: criar, nova versão com tabela, histórico dos dois níveis, 404 de pertencimento, `effectiveOn` passado)

## 5. Interface de manutenção

- [ ] 5.1 Criar `StructureSeriesApi extends VersionedCatalogApi` e `TowerTypesApi` próprio com `seriesId` explícito (design D4 — limite da base registrado), em `apps/web/src/app/catalogs`
- [ ] 5.2 Implementar `structure-series-list/-form/-history` no padrão dos catálogos existentes (busca, pendências, `towerTypeCount` na listagem, callbacks de erro, prefill bloqueante, branco→null, botão refletindo `form.disabled`, id malformado rejeitado, datas UTC/local) e o detalhe da série com a lista de tipos de torre vigentes
- [ ] 5.3 Implementar `tower-type-form/-history` com `FormArray` da tabela peso × altura (adicionar/remover linha, validação por linha, duplicata de altura apontada antes do submit, prefill da tabela vigente, `enable({emitEvent: false})`, guarda dos dois ids de rota testada) e histórico exibindo a tabela de cada versão
- [ ] 5.4 Registrar rotas lazy sob `/catalogs/structure-series` (incl. rotas aninhadas de tipos) e link na navegação da página inicial
- [ ] 5.5 Escrever testes de componente (pendências dos dois níveis, erro de API em toda leitura, payload com null/número/tabela, FormArray incl. duplicata e remoção de linha, prefill pendente/falho, ids malformados, histórico com pesos)

## 6. QA e fechamento

- [ ] 6.1 Executar a skill `/executar-qa` para a change: validar cada cenário do spec `series-torres` com evidências nos dois níveis e incluir smoke E2E dos três catálogos de cabos existentes; gerar `qa.md`
- [ ] 6.2 Rodar a suíte completa (`npx nx run-many -t lint test build` e `npx nx format:check`) limpa e confirmar o CI verde no push
