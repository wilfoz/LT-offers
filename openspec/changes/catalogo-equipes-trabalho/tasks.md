# Tasks: catalogo-equipes-trabalho

## 1. Nomenclatura e modelo de dados

- [x] 1.1 Adicionar os termos de equipes de trabalho e composições ao mapa canônico do README.md (`WorkCrew`, `WorkCrewVersion`, `WorkCrewLaborRole`, `WorkCrewEquipment`, `ProductionPeriod`), antes de qualquer código.
- [x] 1.2 Modelar no `prisma/schema.prisma` os modelos `WorkCrew`, `WorkCrewVersion`, `WorkCrewLaborRole`, `WorkCrewEquipment` e o enum `ProductionPeriod`, gerar a migration aditiva e confirmar zero drift com `npx prisma migrate diff`.

## 2. Contratos na domain

- [x] 2.1 Criar `libs/domain/src/lib/catalogs/work-crews.ts` (interfaces de item, versão com listas de composição de mão de obra e equipamentos, summary com contadores e taxas, payloads de criação/atualização e enum `ProductionPeriod`), exportando em `@lt-offers/domain`.

## 3. API — Equipes de trabalho e composições (Equipos / DesEquipos)

- [x] 3.1 Criar DTOs de `work-crews` com validação de código único, nome, data de vigência civil ISO, taxa de produção decimal ≥ 0, unidade, enum de período e validação aninhada de itens de mão de obra e equipamentos (quantidades decimais > 0), com mensagens em pt-BR.
- [x] 3.2 Implementar `work-crews.service/controller/module` com CRUD, transação atômica de versão e composições, busca por código/nome, cálculo de pendências e proteção contra exclusão de cargos/equipamentos vinculados (RF-11, RF-16).
- [x] 3.3 Implementar testes unitários e de integração no `apps/api` cobrindo todos os cenários do spec de equipes de trabalho.

## 4. Web — Equipes de trabalho

- [x] 4.1 Implementar `WorkCrewsApi extends VersionedCatalogApi` no `apps/web/src/app/catalogs/api/`.
- [x] 4.2 Implementar `work-crew-list.component` com busca, tabela densa, contadores de mão de obra/equipamentos, taxa de produção e badges de pendência e vigência.
- [x] 4.3 Implementar `work-crew-form.component` no padrão Swiss / Material 3 com edição dinâmica de tabelas de composição de cargos e equipamentos (`FormArray`), autocomplete/select integrado, validações de quantidade decimal e prefill bloqueante na edição.
- [x] 4.4 Implementar `work-crew-history.component` exibindo o histórico de versões com as composições completas de cada vigência.
- [x] 4.5 Implementar testes de componentes cobrindo criação, edição, validações dinâmicas e listagem.

## 5. Integração e verificação

- [ ] 5.1 Registrar rotas lazy em `catalogs.routes.ts` e adicionar item no menu de navegação da casca (`app.component.ts`), atualizando testes de rota e navegação.
- [ ] 5.2 Executar verificação integrada (`npx nx run-many -t test lint -p api web domain calc-engine`, `npx nx format:check --all` e `npx prisma migrate status`).
