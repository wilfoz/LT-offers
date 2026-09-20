# Tasks - Arquitetura Hexagonal no Contexto Electromechanical

## 1. Domain Layer (`apps/api/src/contexts/electromechanical/domain`)

- [ ] 1.1 Criar entidades de domínio (`LineElectromechanicalCalculation`, `TowerQuantity`, `CableQuantity`, `HardwareQuantity`, `ElectromechanicalSummary`)
- [ ] 1.2 Definir portas `LineElectromechanicalQueryPort` e `ElectromechanicalCatalogsQueryPort` com tokens de DI (`tokens.ts`)
- [ ] 1.3 Exportar entidades, portas e tokens no barrel `domain/index.ts`

## 2. Application Layer (`apps/api/src/contexts/electromechanical/application`)

- [ ] 2.1 Implementar `CalculateLineElectromechanicalUseCase` orquestrando as portas e delegando a `@lt-offers/calc-engine` (tower/cable/hardware/access/summary calculators), com data de referência de vigência recebida como parâmetro
- [ ] 2.2 Implementar `GetLineElectromechanicalTraceabilityUseCase` (memória de cálculo RF-27)
- [ ] 2.3 Criar testes unitários puros com dublês de porta em memória, incluindo asserção do repasse da data de referência à porta de catálogos (`usecases.spec.ts`)

## 3. Infrastructure Layer (`apps/api/src/contexts/electromechanical/infrastructure`)

- [ ] 3.1 Implementar mapeadores e adaptadores Prisma (`PrismaLineElectromechanicalQueryAdapter`, `PrismaElectromechanicalCatalogsQueryAdapter`) com construtores aceitando `PrismaService | Prisma.TransactionClient`
- [ ] 3.2 Implementar `ElectromechanicalController` e presenter preservando 100% dos contratos HTTP de `/api/lines/:lineId/electromechanical/*`, com testes de controller preservando as asserções do legado
- [ ] 3.3 Configurar `ElectromechanicalModule` com injeção por tokens

## 4. Integração, Migração e Validação

- [ ] 4.1 Atualizar `AppModule` para importar `ElectromechanicalModule` de `contexts/`
- [ ] 4.2 Remover pasta legada `apps/api/src/electromechanical/` e conferir com grep que nenhum módulo importa do caminho antigo
- [ ] 4.3 Executar `npx nx run-many -t test lint build -p api` (build webpack obrigatório) e `npx nx format:check --all`
