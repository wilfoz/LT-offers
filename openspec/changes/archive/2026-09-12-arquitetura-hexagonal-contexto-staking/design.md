# Design - Arquitetura Hexagonal no Contexto Staking

## Context

O contexto de estaqueamento e topografia (`staking`, M02, F2) é responsável pelo processamento de dados geométricos e geotécnicos de torres de transmissão, importação de planilhas e relatórios PLS-CADD, cálculo de integridade geotécnica/estrutural e distribuição preliminar para orçamentação conceitual.

A implementação atual acopla a lógica de regras de negócio, paginação e persistência diretamente na camada de serviço do NestJS (`StakingService`) e no ORM Prisma. O objetivo deste design é estabelecer uma arquitetura limpa em camadas (DDD, Ports & Adapters, Unit of Work e Use Cases) seguindo o padrão consolidado nos contextos `offers` e `catalogs`.

## Goals / Non-Goals

**Goals:**
- Estruturar o contexto em `apps/api/src/contexts/staking/` com separação explícita de responsabilidades (`domain`, `application`, `infrastructure`).
- Implementar entidades ricas de domínio (`StakingTower`, `PreliminaryStakingDistribution`, `StakingIntegrityReport`) com validação de invariantes (RN-02, RN-13).
- Extrair o `PlsCaddParser` como serviço puro de aplicação sem dependências de infraestrutura.
- Isolar a persistência atrás de Portas (`StakingTowersRepository`, `PreliminaryDistributionRepository`, `StakingCatalogQueryPort`) e `StakingUnitOfWork`.
- Criar Casos de Uso atômicos e testáveis com repositórios e Unit of Work em memória (`usecases.spec.ts`).
- Manter 100% de compatibilidade retroativa com os contratos HTTP de `/api/lines/:lineId/staking` via `StakingPresenter` e DTOs.

**Non-Goals:**
- Alterar schemas do banco de dados PostgreSQL ou gerar novas migrations do Prisma.
- Modificar o comportamento ou contrato consumido pelo frontend Angular (`apps/web`).

## Decisions

### 1. Separação de Portas de Consulta e Escrita de Estaqueamento
- **Decisão**: Dividir as operações em `StakingTowersRepository` (CRUD, paginação, filtros por estaca/torre, contagem e batch update), `PreliminaryDistributionRepository` (leitura/escrita da distribuição percentual) e `StakingCatalogQueryPort` (consulta de existência de catálogos e combinações de fundação válidas para a verificação de integridade).
- **Justificativa**: Garante o princípio da segregação de interfaces e desacopla a verificação de integridade dos catálogos sem acoplar diretamente o módulo `staking` às tabelas de catálogos no Prisma.
- **Alternativa Considerada**: Deixar todas as consultas no mesmo repositório genérico. Descartado por violar coesão e responsabilidade única.

### 2. PlsCaddParser como Serviço Puro de Aplicação
- **Decisão**: Manter o algoritmo de parsing e detecção de delimitadores/cabeçalhos de arquivo PLS-CADD como uma classe pura em `application/services/pls-cadd-parser.service.ts`.
- **Justificativa**: Permite testar todos os cenários de parsing, detecção de erros de sintaxe e conversão numérica com testes unitários puros ultrarrápidos.

### 3. Padrão Unit of Work na Importação em Lote
- **Decisão**: A importação em lote (`CommitPlsCaddImportUseCase`) executa sob a porta `StakingUnitOfWork`, garantindo que a remoção/substituição de torres anteriores e a inserção das novas torres ocorra atomicamente com rollback automático em caso de falha.
- **Justificativa**: Evita estados inconsistentes ou perda parcial de estaqueamento caso ocorra erro no meio de uma importação de centenas de vértices.

### 4. Injeção de Dependências Desacoplada via `Symbol`
- **Decisão**: Todos os provedores NestJS injetam as portas de domínio através de tokens `Symbol` (`STAKING_TOWERS_REPOSITORY_TOKEN`, `PRELIMINARY_DISTRIBUTION_REPOSITORY_TOKEN`, `STAKING_CATALOG_QUERY_PORT_TOKEN`, `STAKING_UNIT_OF_WORK_TOKEN`).
- **Justificativa**: Assegura inversão de dependência estrita (DIP), permitindo substituir implementações de banco por fakes em memória nos testes.

## Risks / Trade-offs

- **[Risco] Compatibilidade de formatação de números decimais (estacas, extensões, coordenadas UTM)**:
  - *Mitigação*: `StakingPresenter` utilizará formatação determinística com strings fixas em 2 casas decimais (ex: `toFixed(2)`), mantendo compatibilidade exata com os testes de snapshot e contratos existentes.
- **[Risco] Performance na importação de arquivos PLS-CADD volumosos**:
  - *Mitigação*: Uso de inserções em batch (`createMany`) e queries agrupadas no repositório Prisma, executadas dentro da transação do Unit of Work.
- **[Risco] Regressões em testes de integração e E2E**:
  - *Mitigação*: Execução das suítes de testes unitários da API e testes E2E do Playwright (`02-offer-epc-full-pipeline.spec.ts`, `04-consistency-checks-and-risks.spec.ts`) para validação completa.
