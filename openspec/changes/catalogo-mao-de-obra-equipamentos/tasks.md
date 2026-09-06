# Tasks: catalogo-mao-de-obra-equipamentos

## 1. Nomenclatura e modelo de dados

- [x] 1.1 Adicionar os blocos de mão de obra, equipamentos e custos fixos ao mapa canônico do README.md (termos da proposta e design D1), antes de qualquer código.
- [x] 1.2 Modelar no `prisma/schema.prisma` os pares `LaborRole`/`LaborRoleVersion`, `Equipment`/`EquipmentVersion` e `FixedCost`/`FixedCostVersion` (com `enum FixedCostCategory`), gerar a migration aditiva e confirmar zero drift com `npx prisma migrate diff`.

## 2. Contratos na domain

- [x] 2.1 Criar `libs/domain/src/lib/catalogs/labor-roles.ts`, `equipment.ts` e `fixed-costs.ts` (interfaces de item, versão, summary, payloads de criação/atualização e enum de categoria), exportados em `@lt-offers/domain`.

## 3. API — Mão de obra (DB_MO)

- [x] 3.1 Criar DTOs de `labor-roles` reusando `dto/decimal-scale.validators.ts` e `dto/validation-messages.ts` (escala e não-negatividade), com validação em pt-BR.
- [x] 3.2 Implementar `labor-roles.service/controller/module` com rotas padrão, mappers tipados, sinalização de pendências (`missingFields(name, baseSalary, socialChargesPercent)`), busca por código/nome e testes cobrindo todos os cenários do spec.

## 4. API — Equipamentos (DB_EQ)

- [x] 4.1 Criar DTOs de `equipment` com validação de precisão decimal, não-negatividade e anos de amortização inteiros > 0.
- [x] 4.2 Implementar `equipment.service/controller/module` com busca, filtro por categoria, pendência composta (ao menos uma estratégia de custo informada) e testes cobrindo todos os cenários do spec.

## 5. API — Custos Fixos (DB_FI)

- [x] 5.1 Criar DTOs de `fixed-costs` com categoria validada e custo unitário decimal ≥ 0.
- [x] 5.2 Implementar `fixed-costs.service/controller/module` com busca, filtro por categoria, pendências e testes cobrindo todos os cenários do spec.

## 6. Web — Mão de obra

- [x] 6.1 Implementar `LaborRolesApi extends VersionedCatalogApi` e componentes `labor-role-list/-form/-history` no padrão Swiss / Material 3 (busca, badges de pendência, prefill bloqueante, decimal text fields), com testes de componente cobrindo os cenários do spec.

## 7. Web — Equipamentos

- [x] 7.1 Implementar `EquipmentApi extends VersionedCatalogApi` e componentes `equipment-list/-form/-history` com filtro por categoria, campos de locação e amortização, com testes de componente cobrindo os cenários do spec.

## 8. Web — Custos Fixos

- [x] 8.1 Implementar `FixedCostsApi extends VersionedCatalogApi` e componentes `fixed-cost-list/-form/-history` com filtro por categoria e unidade de medida, com testes de componente cobrindo os cenários do spec.

## 9. Integração e verificação

- [ ] 9.1 Registrar rotas lazy dos três recursos em `catalogs.routes.ts` e adicionar itens no menu de navegação da casca (`app.component.ts`), atualizando os testes de rota e menu.
- [ ] 9.2 Verificação integrada: `npx nx run-many -t test lint -p api web domain calc-engine`, `npx nx format:check --all` e `npx prisma migrate status` limpos.
