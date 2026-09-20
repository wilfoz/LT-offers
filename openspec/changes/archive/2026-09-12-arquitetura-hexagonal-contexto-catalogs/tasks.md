## 1. Camada de Domínio (`apps/api/src/contexts/catalogs/domain/`)

- [x] 1.1 Criar Value Objects de data civil e período de vigência (`CivilDate`, `EffectivePeriod`) e identificador de pendências (`PendingFieldDetector`)
- [x] 1.2 Criar entidades de domínio ricas com validação de invariantes e métodos de versão/vigência para as 4 famílias de catálogos (`cables`, `structures`, `geotech`, `operational`)
- [x] 1.3 Definir interfaces das Portas de Repositório (`*Repository`), tokens de injeção `Symbol` e a Porta Unit of Work (`CatalogsUnitOfWork`)
- [x] 1.4 Criar exceções tipadas de domínio (`CatalogItemNotFoundException`, `DuplicateCatalogCodeException`, `InvalidEffectiveDateRangeException`)

## 2. Camada de Aplicação e Casos de Uso (`apps/api/src/contexts/catalogs/application/`)

- [x] 2.1 Implementar casos de uso de Cabos e Isoladores (`ConductorCable`, `GroundWire`, `GuyWire`, `Insulator`)
- [x] 2.2 Implementar casos de uso de Estruturas e Torres (`StructureSeries`, `TowerType`)
- [x] 2.3 Implementar casos de uso de Geotecnia e Fundações (`SoilType`, `FoundationType`, `FoundationVolume`)
- [x] 2.4 Implementar casos de uso Operacionais e Custos (`FixedCost`, `WorkCrew`, `LaborRole`, `Equipment`)
- [x] 2.5 Criar testes unitários puros para os casos de uso utilizando repositórios e Unit of Work em memória

## 3. Camada de Infraestrutura e Adaptadores (`apps/api/src/contexts/catalogs/infrastructure/`)

- [x] 3.1 Implementar `PrismaCatalogMappers`, repositórios Prisma e `PrismaCatalogsUnitOfWork`
- [x] 3.2 Implementar Controllers HTTP NestJS, DTOs de validação com `class-validator` e `CatalogPresenters`
- [x] 3.3 Configurar `CatalogsModule` com injeção de dependência por tokens (`Symbol`) e atualizar importações no `AppModule`

## 4. Validação e Não-Regressão

- [x] 4.1 Executar testes unitários da API (`npx nx test api`) e validar 100% de sucesso nos casos de uso e controllers de catálogos
- [x] 4.2 Executar a suíte global de testes do monorepo (`npx nx run-many -t test`) e validar integração E2E com Playwright
