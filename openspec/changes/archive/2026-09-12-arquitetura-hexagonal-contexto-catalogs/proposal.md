## Why

O módulo de Catálogos de Engenharia (`apps/api/src/catalogs/`, Fase F1 do roadmap, Módulo M01) gerencia 12 tipos de catálogos técnicos fundamentais (cabos condutores, cabos para-raios, contrapeso, isoladores, séries estruturais, tipos de torre, tipos de solo, tipos de fundação, volumes de fundação, custos fixos, equipes de montagem e equipamentos/cargos) com versionamento temporal e imutabilidade histórica (**RNF-05**, **RNF-09**, **RNF-14**).

Atualmente, a implementação em `apps/api/src/catalogs/` está acoplada diretamente ao Prisma ORM dentro de serviços NestJS (`*Service`), misturando regras de domínio temporal (como a regra de vigência em `civil-date.ts`, detecção de campos pendentes sem conversão para zero silencioso - **RNF-09**, e cálculo de vigências efetivas) com persistência relacional e controle HTTP. 

Seguindo o padrão estabelecido na refatoração do contexto de `offers` (`apps/api/src/contexts/offers/`), esta proposta migra o contexto de Catálogos para **Arquitetura Hexagonal (Ports & Adapters) e Domain-Driven Design (DDD)** dentro de `apps/api/src/contexts/catalogs/`, isolando a lógica de negócio em entidades ricas e casos de uso testáveis em memória, provendo adaptadores desacoplados para Prisma e NestJS HTTP com injeção de dependência por tokens `Symbol`.

## What Changes

- **Camada de Domínio (`apps/api/src/contexts/catalogs/domain/`)**:
  - Entidades de domínio com validações de invariantes, vigência temporal (`EffectivePeriod`, `isEffectiveAt`) e integridade técnica:
    - `ConductorCable`, `GroundWire`, `GuyWire`, `Insulator`
    - `StructureSeries`, `TowerType`, `SoilType`, `FoundationType`, `FoundationVolume`
    - `FixedCost`, `WorkCrew`, `LaborRole`, `Equipment`
  - Definição formal de Value Objects para datas civis (`CivilDate`, `DateRange`) e status de catálogo (`CatalogStatus`, `PendingFieldDetector`).
  - Portas de Repositório (`*Repository`) e Porta Unit of Work (`CatalogsUnitOfWork`) desacopladas de qualquer ORM, identificadas por tokens de injeção `Symbol`.
  - Exceções tipadas de domínio (`CatalogItemNotFoundException`, `DuplicateCatalogCodeException`, `InvalidEffectiveDateRangeException`, `ImmutableCatalogCombinationException`).

- **Camada de Aplicação (`apps/api/src/contexts/catalogs/application/`)**:
  - Casos de uso específicos para cada catálogo:
    - Listagem com resolução de versão efetiva na data de referência (`ListEffective*UseCase`)
    - Consulta de histórico temporal completo de versões (`Get*HistoryUseCase`)
    - Criação de novo item de catálogo com versão inicial (`Create*UseCase`)
    - Criação de nova versão com vigência futura/passada (`Create*VersionUseCase`)
    - Ativação/Desativação de item (`Toggle*StatusUseCase`)
  - Testes unitários puros para os casos de uso utilizando repositórios em memória (`InMemory*Repository`), sem necessidade de mocks do Prisma ou NestJS runtime.

- **Camada de Infraestrutura (`apps/api/src/contexts/catalogs/infrastructure/`)**:
  - Adaptadores Prisma (`Prisma*Repository`, `PrismaCatalogsUnitOfWork`, `Prisma*Mapper`) para mapeamento bidirecional entre modelos do banco e entidades de domínio.
  - Adaptadores HTTP NestJS (`*Controller`, DTOs com `class-validator`, `*Presenter`) mantendo 100% de paridade com as rotas REST existentes (`/api/catalogs/*`).
  - Módulo NestJS `CatalogsModule` exportando portas com tokens `Symbol`.

- **Compatibilidade Retroativa & Integração**:
  - Atualização do `AppModule` para importar o novo `CatalogsModule` hexagonal.
  - Preservação estrita de todos os contratos de API, schemas de validação e comportamentos de vigência temporal, garantindo que 100% dos testes da API, testes unitários do monorepo e testes E2E do Playwright continuem passando com sucesso.

## Capabilities

### New Capabilities
<!-- Nenhuma nova funcionalidade ou capacidade de negócio externa adicionada. A refatoração é puramente arquitetural e interna, declarando skip_specs: true. -->

### Modified Capabilities
<!-- Nenhuma especificação de comportamento externo alterada. Contratos REST e regras de negócio permanecem idênticos. -->

## Impact

- **Código Afetado**: Criação de `apps/api/src/contexts/catalogs/` (domain, application, infrastructure), substituição de `apps/api/src/catalogs/` e atualização de importações no `apps/api/src/app/app.module.ts`.
- **APIs & Contratos**: 100% preservados (`/api/catalogs/conductor-cables`, `/ground-wires`, `/guy-wires`, `/insulators`, `/structure-series`, `/tower-types`, `/soil-types`, `/foundation-types`, `/foundation-volumes`, `/fixed-costs`, `/work-crews`, `/labor-roles`, `/equipment`).
- **Banco de Dados**: Nenhum schema Prisma ou migration alterado. Utilização das mesmas tabelas existentes.
- **Dependências**: Nenhuma dependência externa adicionada.
