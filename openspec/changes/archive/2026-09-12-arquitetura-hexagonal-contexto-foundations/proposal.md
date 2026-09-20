## Why

O contexto de Fundações e Escavações (`M03`, Fase `F3`), responsável pelo cálculo de volumes de escavação, reaterro, concreto, armação de aço, estacas e validações geotécnicas (RF-12..RF-17, RF-20, RF-27, RN-05, RN-06, RNF-08, RNF-09, RNF-16), estava implementado em estrutura acoplada em `apps/api/src/foundations/` misturando acesso direto a queries do Prisma, instanciação de serviços e transformação de DTOs HTTP.

Seguindo a evolução arquitetural já concluída nos contextos `offers`, `catalogs` e `staking`, esta mudança migra o módulo `foundations` para a Arquitetura Hexagonal estrita em `apps/api/src/contexts/foundations/`, isolando portas de consulta para a linha de transmissão e matrizes de catálogos, orquestrando os casos de uso de cálculo e diagnóstico via `@lt-offers/calc-engine` e preservando 100% de compatibilidade com os endpoints HTTP existentes e consumidores internos (como `PricingModule`).

## What Changes

- **Estruturação Hexagonal do Bounded Context `foundations`**:
  - **Domínio (`domain/`)**:
    - Entidades e Value Objects do cálculo de fundações (`LineFoundationCalculation`, `FoundationVolumeQuantities`, `FoundationKpis`, `FoundationMaterialItem`).
    - Portas dirigidas/secundárias (`LineFoundationsQueryPort`, `FoundationVolumeMatricesQueryPort`).
    - Definição formal de tokens de injeção de dependência (`LINE_FOUNDATIONS_QUERY_PORT_TOKEN`, `FOUNDATION_VOLUME_MATRICES_QUERY_PORT_TOKEN`).
  - **Aplicação (`application/`)**:
    - Casos de uso especializados:
      - `CalculateLineFoundationsUseCase` (cálculo completo delegando ao motor de cálculo determinístico `@lt-offers/calc-engine`).
      - `GetLineFoundationSummaryUseCase` (resumo consolidado de KPIs e materiais).
      - `GetLineFoundationTraceabilityUseCase` (rastreabilidade item a item de volumes RF-27).
      - `GetLineFoundationValidationUseCase` (diagnóstico geotécnico e detecção de combinações pendentes RF-20).
    - Exportação de casos de uso e/ou facade para integração com `PricingService`.
    - Testes unitários puros dos casos de uso com dublês em memória.
  - **Infraestrutura (`infrastructure/`)**:
    - Adaptadores Prisma: `PrismaLineFoundationsQueryAdapter` (carregamento de linha, torres de estaqueamento e distribuição preliminar) e `PrismaFoundationVolumeMatricesQueryAdapter` (carregamento de matrizes de volume vigentes).
    - Adaptadores HTTP: `FoundationsController` e `FoundationsPresenter` garantindo paridade total de contratos JSON nas rotas `/api/lines/:lineId/foundations/*`.
    - Configuração de `FoundationsModule` registrando providers com tokens de domínio e exportando use cases.
- **Remoção de Código Legado**: Remoção da pasta antiga `apps/api/src/foundations/` e atualização das referências em `AppModule` e `PricingModule`.

## Capabilities

### New Capabilities

*(Nenhuma nova capacidade de negócio introduzida; refatoração arquitetural com `skip_specs: true`)*

### Modified Capabilities

*(Nenhuma alteração em especificações de requisitos de negócio; contratos e regras RF-12..RF-17, RF-20, RF-27, RN-05, RN-06 permanecem 100% preservados)*

## Impact

- **Código Afetado**:
  - `apps/api/src/foundations/` -> migrado para `apps/api/src/contexts/foundations/` e removido.
  - `apps/api/src/app/app.module.ts` -> import atualizado para `../contexts/foundations/infrastructure/foundations.module`.
  - `apps/api/src/pricing/pricing.module.ts` e `pricing.service.ts` -> consumo atualizado através do módulo e caso de uso/facade de `foundations`.
- **APIs e Contratos**:
  - Endpoints REST inalterados:
    - `GET /api/lines/:lineId/foundations/quantities`
    - `GET /api/lines/:lineId/foundations/traceability`
    - `GET /api/lines/:lineId/foundations/validation`
    - `GET /api/lines/:lineId/foundations/full`
- **Dependências**:
  - Dependência contínua da lib de cálculo pura `@lt-offers/calc-engine` e tipos de `@lt-offers/domain`.
