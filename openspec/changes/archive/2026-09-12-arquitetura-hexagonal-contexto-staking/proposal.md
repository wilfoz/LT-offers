# Proposal - Arquitetura Hexagonal no Contexto Staking (Estaqueamento e Topografia)

## Why

O contexto bounded de estaqueamento e topografia (`staking`, Módulo **M02**, Fase **F2** do roadmap) atualmente reside como um serviço monolítico acoplado diretamente ao Prisma ORM (`apps/api/src/staking/staking.service.ts`). O estaqueamento lida com dados críticos de engenharia: parsing de arquivos PLS-CADD com centenas de vértices e torres, distribuição preliminar percentual (RN-02), validação de integridade contra catálogos (RN-13), atribuição em lote de solos e fundações, e operações de paginação/edição.

Para garantir alta coesão, testabilidade pura com repositórios e Unit of Work em memória, independência de framework (RNF-16) e consistência com os contextos `offers` e `catalogs` já migrados, faz-se necessária a transição do contexto `staking` para a Arquitetura Hexagonal (Ports & Adapters, DDD, Unit of Work e Casos de Uso isolados).

## What Changes

- **Estruturação do Bounded Context em `apps/api/src/contexts/staking/`**:
  - **Camada de Domínio Puro (`domain/`)**:
    - Entidades de Domínio ricas: `StakingTower` (com coordenadas UTM, estaca, extensão de vão, desvios e tipo de solo/fundação/torre), `PreliminaryStakingDistribution` (com regras de percentuais por categoria e validação da soma de 100% - RN-02), `PlsCaddImportResult` e `StakingIntegrityReport`.
    - Value Objects: `Station`, `DeflectionAngle`, `CoordinatesUtm`, `PreliminaryPercentages`.
    - Portas (Interfaces): `StakingTowersRepository`, `PreliminaryDistributionRepository`, `StakingCatalogQueryPort` (para consulta desacoplada de catálogos na validação de integridade) e `StakingUnitOfWork`.
    - Exceções Tipadas de Domínio: `StakingTowerNotFoundException`, `TransmissionLineNotFoundException`, `InvalidStakingDistributionException`, `PlsCaddParsingException`, `InvalidTowerCombinationException`.
  - **Camada de Aplicação (`application/`)**:
    - Parser puro de PLS-CADD: `PlsCaddParser` como serviço de domínio/aplicação puro.
    - Casos de Uso: `GetPaginatedStakingTowersUseCase`, `GetStakingTowerByIdUseCase`, `CreateStakingTowerUseCase`, `UpdateStakingTowerUseCase`, `DeleteStakingTowerUseCase`, `BatchAssignStakingUseCase`, `ValidateStakingIntegrityUseCase`, `GetPreliminaryDistributionUseCase`, `SavePreliminaryDistributionUseCase`, `PreviewPlsCaddImportUseCase`, `CommitPlsCaddImportUseCase`.
    - Testes unitários puros dos casos de uso (`usecases.spec.ts`) sem dependência de banco de dados real.
  - **Camada de Infraestrutura (`infrastructure/`)**:
    - Mapeadores Prisma (`PrismaStakingMappers`).
    - Repositórios Prisma (`PrismaStakingTowersRepository`, `PrismaPreliminaryDistributionRepository`) e Unit of Work (`PrismaStakingUnitOfWork`).
    - Adaptador de Catálogos (`PrismaStakingCatalogQueryAdapter`).
    - Adaptador HTTP: `StakingController` no NestJS, DTOs de validação e `StakingPresenter` preservando estritamente os contratos HTTP de `/api/lines/:lineId/staking`.
    - Módulo `StakingModule` com injeção de dependência desacoplada via tokens `Symbol`.
- **Limpeza do legado**:
  - Remoção da pasta legada `apps/api/src/staking/`.
  - Atualização do `AppModule`.

## Capabilities

### New Capabilities
<!-- Nenhuma nova capability funcional; trata-se de refatoração arquitetural com skip_specs: true -->

### Modified Capabilities
<!-- Nenhuma alteração contratual nos requisitos funcionais existentes -->

## Impact

- **Código Afetado**: `apps/api/src/staking/` migrado para `apps/api/src/contexts/staking/`, `apps/api/src/app/app.module.ts`.
- **APIs e Contratos**: Zero breaking changes nas rotas `/api/lines/:lineId/staking/*`.
- **Testes**: Manutenção de 100% de cobertura nos testes unitários e testes E2E do Playwright (`02-offer-epc-full-pipeline.spec.ts`, `04-consistency-checks-and-risks.spec.ts`).
