# Tasks: catalogo-cabos-tirante

## 1. Extração do padrão de catálogo (refit sem mudança de comportamento)

- [x] 1.1 Criar `libs/domain/src/lib/catalogs/validation.ts` (design D1) com `POSITIVE_DECIMAL_PATTERN`, `POSITIVE_INT_PATTERN` e `DATE_PATTERN`, exportado pelo index; trocar as constantes locais dos DTOs da API (`version-fields.dto.ts`, `ground-wire-version-fields.dto.ts`) e dos forms do web pelos imports da domain
- [x] 1.2 Extrair helpers da API (design D2): `catalogs/prisma-errors.ts` (`isUniqueViolation`), `missingFields(version, labels)` genérico em `effectiveness.ts` (removendo o `pendingFields` específico de condutor) e `catalogs/controller-shared.ts` (`createIdPipe`, `resolveAuthor`, `resolveReferenceDate`, `versionImmutableException`); refit de `conductor-cables.*` e `ground-wires.*` mantendo todas as asserções de teste existentes intactas
- [x] 1.3 Tipar os retornos dos services contra os contratos da domain (design D3): mappers `toVersionContract` (Decimal→string, datas→ISO, sem FKs internas) em `conductor-cables.service` e `ground-wires.service`; `conductor-cables` passa a importar `@lt-offers/domain`; ajustar apenas a fiação dos testes (asserções preservadas)
- [x] 1.4 Extrair base web (design D4): `catalogs/versioned-catalog-api.ts` (`VersionedCatalogApi` genérica; `ConductorCablesApi` estende, `GroundWiresApi` estende com override do `list` p/ filtro de tipo) e `catalogs/form-utils.ts` (`orNull`, `intOrNull`); refit dos forms existentes
- [x] 1.5 Regressão da extração: `npx nx run-many -t lint test build` e `npx nx format:check` limpos, com diff de testes contendo apenas fiação (nenhuma asserção alterada); conferir ao vivo (API + web) um fluxo de cada catálogo existente

## 2. Nomenclatura e modelo de dados

- [x] 2.1 Acrescentar ao mapa do README: tirante (cabo de aço) → `GuyWire` / `guy_wire` / `guy-wires` (design D6)
- [x] 2.2 Modelar `GuyWire`/`GuyWireVersion` no `schema.prisma` (design D5: precisões espelhando os catálogos existentes, campos anuláveis RNF-09, `effective_from @db.Date`, `@@unique([guyWireId, effectiveFrom])`, índice desc, bloco após os modelos existentes) e gerar a migration
- [x] 2.3 Aplicar a migration no Postgres local e regenerar o Prisma Client, confirmando os tipos no client

## 3. Contratos compartilhados

- [ ] 3.1 Criar `libs/domain/src/lib/catalogs/guy-wires.ts` (contratos de request/response, decimais como string, campos anuláveis) exportado pelo index

## 4. API de cabos de tirante

- [ ] 4.1 Criar `guy-wires.controller/service` em `/catalogs/guy-wires` sobre a base extraída (helpers D2, retornos tipados D3, datas civis na borda, `effectiveness.ts` intacto), registrando no `CatalogsModule`
- [ ] 4.2 Implementar DTOs com class-validator e mensagens pt-BR (patterns da domain D1): código obrigatório/único, decimais como string positiva, `wireCount` inteiro positivo, `null` p/ não informado; `pendingFields` = comuns + galvanização/grau/fios (descrição fora, conforme spec)
- [ ] 4.3 Escrever testes do service e controller cobrindo os cenários do spec `cabos-tirante` (criação, duplicado 409 via P2002, numéricos inválidos, fios não inteiro, busca, pendências, histórico, vigência passada/anterior à primeira, 405 PUT/PATCH, autor X-User)
- [ ] 4.4 Verificar os endpoints ao vivo contra o Postgres do Compose (criar, nova versão, busca, `effectiveOn` passado, histórico, 405)

## 5. Interface de manutenção

- [ ] 5.1 Criar `guy-wire-list/-form/-history` na feature `catalogs` (sem filtro de tipo nem blocos condicionais), rotas lazy sob `/catalogs/guy-wires` e link na navegação da página inicial
- [ ] 5.2 Implementar listagem (busca, pendências, callback de erro em toda leitura), formulário (branco→null via `form-utils`, prefill bloqueante na edição, botão refletindo `form.disabled`, id malformado rejeitado) e histórico (vigência `dd/MM/yyyy` UTC, `createdAt` local)
- [ ] 5.3 Escrever testes de componente (pendências, erro de API, payload com null e `wireCount` numérico, prefill pendente/falho, histórico)

## 6. QA e fechamento

- [ ] 6.1 Executar a skill `/executar-qa` para a change: validar cada cenário do spec `cabos-tirante` com evidências e incluir smoke E2E dos catálogos refitados (condutores e guarda) para confirmar a extração sem regressão; gerar `qa.md`
- [ ] 6.2 Rodar a suíte completa (`npx nx run-many -t lint test build` e `npx nx format:check`) limpa e confirmar o CI verde no push
