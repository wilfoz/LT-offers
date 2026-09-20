# Tasks - Arquitetura Hexagonal no Contexto Economics

## 1. Domain Layer (`apps/api/src/contexts/economics/domain`)

- [x] 1.1 Criar entidades dos três agregados (`ServiceBudget`, `MeasurementSheet`, `EconomicResult`, `MarginSimulation`, `Cashflow`) e value objects compartilhados (curvas mensais, venda total)
- [x] 1.2 Implementar a regra pura de mascaramento por papel (`maskEconomicResult`) com testes de domínio cobrindo papéis com e sem permissão
- [x] 1.3 Definir porta `EconomicsDataQueryPort` e tokens de DI; exportar tudo no barrel `domain/index.ts`

## 2. Application Layer (`apps/api/src/contexts/economics/application`)

- [x] 2.1 Implementar casos de uso de serviços e medição (`GetServiceBudgetUseCase`, `GetMeasurementSheetUseCase`, variantes por linha) delegando a `@lt-offers/calc-engine`
- [x] 2.2 Implementar casos de uso de resultado econômico (`GetLineEconomicResultUseCase`, `GetConsolidatedEconomicResultUseCase`, `SimulateMarginOrPriceUseCase`, `CompareRevisionsUseCase`) aplicando o mascaramento do domínio
- [x] 2.3 Implementar casos de uso de desembolso (`GetLineCashflowUseCase`, `GetConsolidatedCashflowUseCase`)
- [x] 2.4 Criar testes unitários puros dos casos de uso com dublês de porta em memória (`usecases.spec.ts`)

## 3. Infrastructure Layer (`apps/api/src/contexts/economics/infrastructure`)

- [x] 3.1 Implementar mapeadores e adaptador Prisma `PrismaEconomicsDataQueryAdapter` (construtor aceita `PrismaService | Prisma.TransactionClient`; Decimal→string nos mappers)
- [x] 3.2 Implementar `ServiceBudgetController`, `EconomicResultController` e `CashflowController` com presenters, preservando 100% dos contratos HTTP atuais (rotas, envelopes, mascaramento, mensagens pt-BR), com testes de controller preservando as asserções do legado
- [x] 3.3 Configurar `EconomicsModule` com injeção por tokens e fachada `EconomicsFacadeService` exportada (superfície mínima: o que export e baseline consomem)

## 4. Integração, Migração e Validação

- [x] 4.1 Religar `apps/api/src/export/` e `apps/api/src/baseline/` para consumir `EconomicsFacadeService` no lugar dos services legados de cashflow/economic-result
- [x] 4.2 Atualizar `AppModule` para importar `EconomicsModule` de `contexts/` no lugar dos três módulos legados
- [x] 4.3 Remover pastas legadas `apps/api/src/service-budget/`, `apps/api/src/economic-result/` e `apps/api/src/cashflow/` e conferir com grep que nenhum módulo importa dos caminhos antigos
- [x] 4.4 Executar `npx nx run-many -t test lint build -p api` (build webpack obrigatório) e `npx nx format:check --all`
