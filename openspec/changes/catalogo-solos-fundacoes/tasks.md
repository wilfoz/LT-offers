# Tasks: catalogo-solos-fundacoes

## 1. Nomenclatura e modelo de dados

- [x] 1.1 Adicionar o bloco solos/fundações ao mapa canônico do README (termos do proposal — Impact e design D5: solo, submerso, parâmetros geotécnicos, faixa NSPT, tipo de fundação, aplicação, 17 elementos, matriz de volumes e as 34 quantidades com sufixo de unidade), antes de qualquer código.
- [x] 1.2 Modelar no `prisma/schema.prisma` os pares `SoilType`/`SoilTypeVersion`, `FoundationType`/`FoundationTypeVersion` (com `enum FoundationApplication`) e `FoundationVolume`/`FoundationVolumeVersion` conforme design D1 (precisões, `@@unique` de identidade e de `[itemId, effectiveFrom]`, índices desc, FKs da tripla), gerar a migration aditiva e confirmar zero drift (`npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma`).

## 2. Contratos na domain

- [x] 2.1 Criar `libs/domain/src/lib/catalogs/soil-types.ts`, `foundation-types.ts` (const-array `FOUNDATION_APPLICATIONS` + tipo, precedente `GROUND_WIRE_TYPES`) e `foundation-volumes.ts` (summaries com `combination` de rótulos, versões com decimais string e datas ISO), exportados em `@lt-offers/domain`, com descrições de teste em pt-BR onde houver lógica.

## 3. API — tipos de solo

- [x] 3.1 DTOs de `soil-types` reusando `dto/decimal-scale.validators.ts` e `dto/validation-messages.ts` (escala limitada à precisão das colunas), com inteiros ≥ 0 para NSPT e validação `nsptMin < nsptMax` com mensagem pt-BR (cenário "faixa invertida" do spec).
- [x] 3.2 `soil-types.service/controller/module` com as cinco rotas do padrão sobre os helpers `catalogs/*`, mapper tipado contra a domain, pendências via `missingFields` (descrição, submerso, tensão admissível, peso específico, ângulo — coesão e NSPT fora), busca por código/descrição com asserção de igualdade completa do `where.OR`, P2002 → 409; testes cobrindo todos os cenários do spec (incl. rocha sem coesão/NSPT sem pendência e ordem formato→positivo→escala das mensagens).

## 4. API — tipos de fundação

- [x] 4.1 DTOs de `foundation-types` com aplicação validada contra `FOUNDATION_APPLICATIONS` no create, `@IsEmpty` em `application` no DTO de versão (troca rejeitada com 400 pt-BR) e as 17 contagens como inteiros ≥ 0 anuláveis.
- [x] 4.2 `foundation-types.service/controller/module` no padrão, com filtro `application` no list combinado à busca (teste asserta busca **e** filtro juntos — lição guy-wires), pendência composta `missingFields(description)` + "nenhuma contagem informada" (contagem zero não é pendência), imutabilidade da aplicação validada contra o tipo persistido; testes de todos os cenários do spec.

## 5. API — matriz de volumes

- [x] 5.1 DTOs de `foundation-volumes`: create com a tripla de ids + 34 quantidades decimais ≥ 0 anuláveis (escala ≤ 3); DTO de versão com os três ids `@IsEmpty` (combinação imutável, 400 pt-BR).
- [x] 5.2 `foundation-volumes.service/controller/module` em rota plana com filtros `towerTypeId`/`soilTypeId`/`foundationTypeId` + `effectiveOn`; criação valida existência das três referências antes do insert (404 pt-BR nomeando a referência ausente), P2002 com mensagens distintas por operação (combinação duplicada × vigência duplicada — lição series-torres), summary com rótulos da combinação via `include`, pendência "nenhuma quantidade informada", zero ≠ null persistido e devolvido; testes de todos os cenários do spec.

## 6. Web — tipos de solo

- [x] 6.1 `SoilTypesApi extends VersionedCatalogApi` + componentes `soil-type-list/-form/-history` no padrão consolidado (busca, badge de pendência, prefill bloqueante com `disable({emitEvent:false})`, erro em toda leitura, guarda de id malformado com save early-return, payload null/número via `orNull`/`intOrNull`, datas UTC/local), testes de componente cobrindo os cenários do spec.

## 7. Web — tipos de fundação

- [x] 7.1 `FoundationTypesApi` com override do list para o filtro de aplicação + componentes `foundation-type-list/-form/-history`: filtro por aplicação na listagem, `mat-select` de aplicação travado na edição, 17 contagens agrupadas por família no `.form-grid`; testes incluindo repasse conjunto de busca + filtro e payload de contagens (zero vs null).

## 8. Web — matriz de volumes

- [ ] 8.1 `FoundationVolumesApi` própria (sem estender `VersionedCatalogApi` — criação por tripla; divergência registrada p/ reavaliação) com os mesmos padrões de contrato e erro.
- [ ] 8.2 Componentes `foundation-volume-list/-form/-history`: listagem com filtros por série/torre/solo/fundação e badge de pendência; form com cascata série → torre em handler explícito (sem `valueChanges` reemitido — lição institucional), selects travados na edição, 34 campos `orNull` nas cinco famílias, prefill bloqueante cobrindo as quatro leituras; empty-state orientando a cadastrar as referências primeiro; testes dos cenários do spec (incl. zero ≠ em branco no payload).

## 9. Integração e verificação

- [ ] 9.1 Rotas lazy dos três recursos em `catalogs.routes.ts` + três itens novos no menu da casca, atualizando o teste que asserta a lista exata do menu (5 → 8).
- [ ] 9.2 Verificação integrada: `npx nx run-many -t test lint -p api web domain`, `npx nx format:check --all` e `npx prisma migrate status` limpos; smoke manual dos catálogos existentes inalterados.
