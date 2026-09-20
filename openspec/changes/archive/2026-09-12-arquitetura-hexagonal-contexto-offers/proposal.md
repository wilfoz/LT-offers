## Why

A API NestJS (`apps/api`) cresceu rapidamente para cobrir todos os 12 módulos de requisitos funcionais (RF-01..RF-65). No entanto, seus serviços concentram lógica de orquestração, regras de negócio e chamadas diretas ao `PrismaService` no mesmo nível estrutural.

Inspirando-se no padrão arquitetural consolidado no projeto de referência `planner_2026/backend/apps/production`, esta mudança inicia a transição da API para uma **Arquitetura Hexagonal (Ports & Adapters) orientada a DDD**, com separação estrita em *Bounded Contexts* (`domain/`, `application/`, `infrastructure/`). 

Como projeto piloto, estruturamos o contexto **`offers`** (M01: RF-01..RF-06, RN-01, RN-03, RN-04), introduzindo entidades de domínio com invariantes, portas de repositório com injeção por tokens no NestJS, casos de uso puros e o padrão **Unit of Work** para transações atômicas seguras sem acoplamento direto com o Prisma na camada de aplicação.

## What Changes

- **Estruturação de Bounded Contexts sob `apps/api/src/contexts/`**:
  - Criação da pasta base para contextos modulares.
- **Contexto Piloto `offers` (`apps/api/src/contexts/offers/`)**:
  - **`domain/`**:
    - Entidades ricas de domínio: `Offer`, `OfferRevision`, `TransmissionLine`, `ScopeMatrixItem` com construtores semânticos (`create`, `reconstitute`) e invariantes de negócio.
    - Portas de Repositório e Unit of Work: `OffersRepository`, `OfferRevisionsRepository`, `OffersUnitOfWork` (interfaces TypeScript puras).
    - Exceções semânticas de domínio (`OfferNotFoundException`, `RevisionFrozenException`, `InvalidScopeMatrixException`).
  - **`application/`**:
    - Casos de Uso com injeção de dependência via portas:
      - `CreateOfferUseCase`, `GetOfferDetailsUseCase`, `UpdateOfferGeneralDataUseCase`, `CloneOfferUseCase`.
      - `CreateRevisionUseCase`, `FreezeRevisionUseCase`, `MarkRevisionDeliveredUseCase`.
      - `SaveScopeMatrixUseCase`, `SaveRevisionParametersUseCase`.
      - `AddTransmissionLineUseCase`, `UpdateTransmissionLineUseCase`, `DeleteTransmissionLineUseCase`.
    - DTOs de Entrada e Saída da camada de aplicação.
    - Suíte de testes unitários rápidos e desacoplados (`*.usecase.spec.ts`) utilizando repositórios em memória.
  - **`infrastructure/`**:
    - Adaptadores de Persistência Prisma: `PrismaOffersRepository`, `PrismaOfferRevisionsRepository`, `PrismaOffersUnitOfWork`.
    - Mappers bidirecionais: `PrismaOfferMapper` (banco relacional ↔ entidades de domínio).
    - Adaptadores Primários HTTP: `OffersController`, DTOs de validação (`class-validator`) e `OfferPresenter`.
    - `OffersModule`: Configuração de DI do NestJS vinculando portas às implementações Prisma via `provide` / `useFactory`.
- **Preservação de Retrocompatibilidade e Rotas HTTP**:
  - Manutenção integral dos contratos de rota REST existentes (`/api/offers/*`), garantindo que o frontend Angular (`apps/web`) e a suíte E2E do Playwright continuem operando sem nenhuma alteração externa.

## Capabilities

### New Capabilities
<!-- Nenhuma nova regra funcional introduzida (refatoração arquitetural pura). -->

### Modified Capabilities
<!-- Sem alteração de requisitos funcionais de negócio (skip_specs: true no .openspec.yaml). -->

## Impact

- **Código Afetado**: `apps/api/src/offers/` migrado e modularizado para `apps/api/src/contexts/offers/`.
- **Fase do Roadmap**: F1..F6 (Modernização arquitetural contínua, RNF-01, RNF-04, RNF-07, RNF-16).
- **Testabilidade**: Casos de uso passam a ser testáveis de forma unitária pura sem dependência de banco de dados nem do container do NestJS.
- **Frontend / E2E**: Zero impacto destrutivo ou quebra de contrato na API.
