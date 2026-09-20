## 1. Camada de Domínio (`apps/api/src/contexts/staking/domain/`)

- [x] 1.1 Criar Value Objects de estaqueamento e topografia (`Station`, `DeflectionAngle`, `CoordinatesUtm`, `PreliminaryPercentages`)
- [x] 1.2 Criar Entidades de Domínio ricas (`StakingTower`, `PreliminaryStakingDistribution`, `PlsCaddImportResult`, `StakingIntegrityReport`) com regras de negócio e validações invariantes (RN-02, RN-13)
- [x] 1.3 Definir interfaces das Portas de Repositório (`StakingTowersRepository`, `PreliminaryDistributionRepository`), porta de consulta de catálogos (`StakingCatalogQueryPort`), tokens de injeção `Symbol` e Porta Unit of Work (`StakingUnitOfWork`)
- [x] 1.4 Criar exceções tipadas de domínio (`StakingTowerNotFoundException`, `TransmissionLineNotFoundException`, `InvalidStakingDistributionException`, `PlsCaddParsingException`, `InvalidTowerCombinationException`)

## 2. Camada de Aplicação e Casos de Uso (`apps/api/src/contexts/staking/application/`)

- [x] 2.1 Implementar o serviço de parser puro PLS-CADD (`PlsCaddParser`)
- [x] 2.2 Implementar Casos de Uso de consulta paginada, busca por id, criação, atualização e exclusão de torres (`GetPaginatedStakingTowersUseCase`, `GetStakingTowerByIdUseCase`, `CreateStakingTowerUseCase`, `UpdateStakingTowerUseCase`, `DeleteStakingTowerUseCase`)
- [x] 2.3 Implementar Casos de Uso de atribuição em lote e validação de integridade (`BatchAssignStakingUseCase`, `ValidateStakingIntegrityUseCase`)
- [x] 2.4 Implementar Casos de Uso de distribuição preliminar percentual (`GetPreliminaryDistributionUseCase`, `SavePreliminaryDistributionUseCase`)
- [x] 2.5 Implementar Casos de Uso de importação e preview de arquivos PLS-CADD (`PreviewPlsCaddImportUseCase`, `CommitPlsCaddImportUseCase`)
- [x] 2.6 Criar testes unitários puros para os casos de uso e parser PLS-CADD utilizando repositórios e Unit of Work em memória (`usecases.spec.ts`)

## 3. Camada de Infraestrutura e Adaptadores (`apps/api/src/contexts/staking/infrastructure/`)

- [x] 3.1 Implementar `PrismaStakingMappers`, repositórios Prisma (`PrismaStakingTowersRepository`, `PrismaPreliminaryDistributionRepository`), adaptador `PrismaStakingCatalogQueryAdapter` e `PrismaStakingUnitOfWork`
- [x] 3.2 Implementar Controller HTTP NestJS (`StakingController`), DTOs de validação e `StakingPresenter` preservando contratos de `/api/lines/:lineId/staking`
- [x] 3.3 Configurar `StakingModule` com injeção de dependência por tokens (`Symbol`) e registrar no `AppModule`, removendo a pasta legada `apps/api/src/staking/`

## 4. Validação e Não-Regressão

- [x] 4.1 Executar testes unitários da API (`npx nx test api`) e validar 100% de sucesso nos casos de uso e controller de staking
- [x] 4.2 Executar a suíte global de testes do monorepo (`npx nx run-many -t test`) e validar integração E2E com Playwright
