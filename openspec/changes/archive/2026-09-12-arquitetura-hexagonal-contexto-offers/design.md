## Context

A API NestJS (`apps/api`) atende a todas as rotas do frontend de orçamentação EPC de linhas de transmissão. Para escalar com manutenibilidade de longo prazo e desacoplar regras de negócio de frameworks, adotamos o padrão arquitetural de Bounded Contexts, DDD e Arquitetura Hexagonal (Ports & Adapters) consolidado no projeto `planner_2026/backend/apps/production`.

O contexto **`offers`** foi selecionado como projeto piloto para introduzir este padrão sem quebra de compatibilidade externa.

## Goals / Non-Goals

**Goals:**
- Estruturar o contexto `offers` sob `apps/api/src/contexts/offers/` com 3 camadas explícitas: `domain/`, `application/` e `infrastructure/`.
- Isolar as regras de negócio em entidades ricas (`Offer`, `OfferRevision`, `TransmissionLine`, `ScopeMatrixItem`) sem dependências de Prisma ou NestJS.
- Definir portas de repositório e implementar o padrão **Unit of Work** (`OffersUnitOfWork`) para gerenciar transações atômicas no Prisma.
- Implementar Casos de Uso específicos por operação (`create-offer`, `freeze-revision`, `clone-offer`, `save-scope-matrix`, etc.).
- Permitir testes unitários puros instantâneos de casos de uso com repositórios em memória.
- Garantir 100% de retrocompatibilidade com as rotas HTTP e testes existentes.

**Non-Goals:**
- Refatorar todos os outros 11 módulos da API de uma só vez (a migração será progressiva contexto por contexto).
- Introduzir fila assíncrona ou Transactional Outbox complexo nesta fase inicial (conforme decisão alinhada, utilizaremos transações atômicas síncronas via Unit of Work).

## Decisions

### 1. Separação de Camadas no Bounded Context (`apps/api/src/contexts/offers/`)

- **`domain/`**:
  - `entities/`: `offer.entity.ts`, `offer-revision.entity.ts`, `transmission-line.entity.ts`, `scope-matrix-item.entity.ts`.
  - `ports/`: `offers.repository.ts`, `offer-revisions.repository.ts`, `offers-unit-of-work.ts`.
  - `exceptions/`: `offer-domain.exceptions.ts` (`OfferNotFoundException`, `RevisionFrozenException`, `InvalidScopeMatrixException`).
- **`application/`**:
  - `usecases/`: Casos de uso atômicos desacoplados do NestJS (`create-offer.usecase.ts`, `get-offer-details.usecase.ts`, `freeze-revision.usecase.ts`, `create-new-revision.usecase.ts`, `clone-offer.usecase.ts`, `save-scope-matrix.usecase.ts`, `save-revision-parameters.usecase.ts`, `manage-transmission-lines.usecase.ts`).
  - `dto/`: DTOs de entrada e saída da camada de aplicação.
- **`infrastructure/`**:
  - `database/prisma/`: `prisma-offers.repository.ts`, `prisma-offer-revisions.repository.ts`, `prisma-offers-unit-of-work.ts`, `prisma-offer.mapper.ts`.
  - `dto/`: DTOs de validação HTTP com `class-validator`.
  - `presenters/`: `offer.presenter.ts` (serialização de resposta).
  - `offers.controller.ts`: Adaptador primário HTTP expondo os endpoints REST.
  - `offers.module.ts`: Módulo NestJS configurando DI e tokens de portas.

*Alternativa considerada*: Manter arquitetura em 2 camadas (Controller -> Service). Rejeitada porque acopla regras de negócio ao Prisma e dificulta testes unitários puros.

### 2. Inversão de Dependências via Tokens (`Symbol`) no NestJS

- **Decisão**: Definir símbolos TypeScript (`OFFERS_REPOSITORY`, `OFFER_REVISIONS_REPOSITORY`, `OFFERS_UNIT_OF_WORK`) no domínio. O módulo NestJS injeta o `PrismaService` na fábrica do repositório/UoW e fornece a instância ao caso de uso.
- **Vantagem**: O caso de uso depende apenas da interface abstrata, permitindo testes unitários com mocks em memória sem levantar banco de dados.

### 3. Padrão Unit of Work para Transações Atômicas

- **Decisão**: O `OffersUnitOfWork` expõe o método `runInTransaction<T>(work: (repos: { offers: OffersRepository; revisions: OfferRevisionsRepository }) => Promise<T>): Promise<T>`.
- **Implementação Prisma**: O adapter encapsula `prisma.$transaction(async (tx) => ...)` criando repositórios atrelados ao cliente transacional `tx`.

### 4. Mapeamento Bidirecional Explícito

- **Decisão**: `PrismaOfferMapper` traduz explicitamente os modelos relacionais do Prisma em entidades de domínio ricas e vice-versa.
- **Vantagem**: Mudanças de schema relacional no banco não contaminam o modelo de domínio nem quebram as regras de negócio.

## Risks / Trade-offs

- **[Risco] Aumento na quantidade de arquivos por módulo**  
  *Mitigação*: Organização padronizada e consistente seguindo o modelo do `planner_2026`, facilitando a navegação e manutenção.
- **[Risco] Risco de quebra de contratos de rotas para o Frontend Angular**  
  *Mitigação*: Preservar 100% das assinaturas, rotas e payloads HTTP existentes no `OffersController` e validar com a suíte global de 946 testes + 30 testes E2E do Playwright.
