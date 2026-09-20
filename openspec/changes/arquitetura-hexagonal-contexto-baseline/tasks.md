# Tasks - Arquitetura Hexagonal no Contexto Baseline

## 1. Domain Layer (`apps/api/src/contexts/baseline/domain`)

- [ ] 1.1 Criar entidades `WorkBaseline` (com invariante de imutabilidade pós-congelamento e exceção tipada), `WorkPackage`, `ContractChangeOrder`, `CurrentWorkingEstimate`, `MonthlyProgressRecord`, com testes de domínio da invariante
- [ ] 1.2 Definir portas `BaselinesRepository`, `ChangeOrdersRepository`, `ProgressRecordsRepository` e `BaselineUnitOfWork` com tokens de DI (`tokens.ts`)
- [ ] 1.3 Exportar entidades, portas, exceções e tokens no barrel `domain/index.ts`

## 2. Application Layer (`apps/api/src/contexts/baseline/application`)

- [ ] 2.1 Implementar `FreezeBaselineUseCase` transacional (baseline + EAP via `WbsGenerator` + curva atomicamente, via unit of work) e casos de uso de leitura (`GetActiveBaselineUseCase`, `GetBaselineByIdUseCase`, `ListBaselinesUseCase`)
- [ ] 2.2 Implementar casos de uso de aditivos (`CreateChangeOrderUseCase` transacional com recálculo da estimativa corrente, `UpdateChangeOrderUseCase`, `ListChangeOrdersUseCase`, `GetCurrentWorkingEstimateUseCase`)
- [ ] 2.3 Implementar casos de uso de acompanhamento (`RecordMonthlyProgressUseCase` com earned value via `@lt-offers/calc-engine` e curva S consumindo `EconomicsFacadeService`) e `GenerateErpPackageUseCase` (`generatedAt` como parâmetro — RNF-04)
- [ ] 2.4 Criar testes unitários puros com repositórios e unit of work em memória, incluindo rejeição de mutação de baseline congelada (`usecases.spec.ts`)

## 3. Infrastructure Layer (`apps/api/src/contexts/baseline/infrastructure`)

- [ ] 3.1 Implementar mapeadores e repositórios Prisma (`PrismaBaselinesRepository`, `PrismaChangeOrdersRepository`, `PrismaProgressRecordsRepository`) com construtores aceitando `PrismaService | Prisma.TransactionClient`
- [ ] 3.2 Implementar `PrismaBaselineUnitOfWork` instanciando os repositórios com o client transacional
- [ ] 3.3 Implementar `BaselineController` e presenter preservando 100% dos contratos HTTP de `/api/offers/:offerId/baseline*` (baseline, aditivos, estimativa corrente, avanço, ERP), com testes de controller preservando as asserções do legado
- [ ] 3.4 Configurar `BaselineModule` importando `EconomicsModule` (fachada), com injeção por tokens

## 4. Integração, Migração e Validação

- [ ] 4.1 Atualizar `AppModule` para importar `BaselineModule` de `contexts/`
- [ ] 4.2 Remover pasta legada `apps/api/src/baseline/` e conferir com grep que nenhum módulo importa do caminho antigo
- [ ] 4.3 Executar `npx nx run-many -t test lint build -p api` (build webpack obrigatório) e `npx nx format:check --all`
