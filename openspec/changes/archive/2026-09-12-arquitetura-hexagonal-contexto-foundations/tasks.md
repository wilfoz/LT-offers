## 1. Domain Layer (`apps/api/src/contexts/foundations/domain`)

- [x] 1.1 Criar entidades e value objects de domínio para quantitativos e diagnóstico de fundações (`LineFoundationCalculation`, `FoundationVolumeQuantities`, `FoundationKpis`)
- [x] 1.2 Definir portas de consulta (`LineFoundationsQueryPort`, `FoundationVolumeMatricesQueryPort`) e tokens formais de injeção de dependência (`tokens.ts`)
- [x] 1.3 Exportar tipos, entidades, portas e tokens no barrel `domain/index.ts`

## 2. Application Layer (`apps/api/src/contexts/foundations/application`)

- [x] 2.1 Implementar `CalculateLineFoundationsUseCase` orquestrando o carregamento via portas e delegando o cálculo a `@lt-offers/calc-engine`
- [x] 2.2 Implementar `GetLineFoundationSummaryUseCase`, `GetLineFoundationTraceabilityUseCase` e `GetLineFoundationValidationUseCase`
- [x] 2.3 Criar testes unitários puros para os use cases de fundações com dublês de portas em memória (`usecases.spec.ts`)
- [x] 2.4 Exportar use cases e serviços no barrel `application/index.ts`

## 3. Infrastructure Layer (`apps/api/src/contexts/foundations/infrastructure`)

- [x] 3.1 Implementar adaptadores Prisma: `PrismaLineFoundationsQueryAdapter` e `PrismaFoundationVolumeMatricesQueryAdapter`
- [x] 3.2 Implementar `FoundationsPresenter` e `FoundationsController` assegurando 100% de paridade com as rotas `/api/lines/:lineId/foundations/*`
- [x] 3.3 Criar testes unitários para o `FoundationsController`
- [x] 3.4 Configurar `FoundationsModule` com injeção baseada em tokens e exportação de providers
- [x] 3.5 Exportar módulo no barrel `infrastructure/index.ts` e no index principal `contexts/foundations/index.ts`

## 4. Integration, Migration & Validation

- [x] 4.1 Atualizar `AppModule` para importar o novo `FoundationsModule` de `contexts/foundations`
- [x] 4.2 Atualizar `PricingModule` e `PricingService` para consumir o `FoundationsModule` refatorado
- [x] 4.3 Remover pasta legada `apps/api/src/foundations/`
- [x] 4.4 Executar suíte de testes unitários da API (`nx test api`) e validar build e paridade com `nx run-many -t test`
