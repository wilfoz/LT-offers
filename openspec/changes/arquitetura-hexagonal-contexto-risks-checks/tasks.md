# Tasks - Arquitetura Hexagonal nos Contextos Risks e Checks

## 1. Contexto Risks - Domain e Application (`apps/api/src/contexts/risks`)

- [ ] 1.1 Criar entidade `RiskItem` com severidade como regra pura (impacto × probabilidade) e testes de domínio; exceção tipada `RiskNotFoundException`; porta `RisksRepository` com token de DI; barrel `domain/index.ts`
- [ ] 1.2 Implementar `GetOfferRisksUseCase`, `SaveRiskUseCase` (create/update com validação de existência) e `DeleteRiskUseCase`, com testes unitários puros usando repositório em memória (`usecases.spec.ts`)

## 2. Contexto Risks - Infrastructure

- [ ] 2.1 Implementar `PrismaRisksRepository` (construtor aceita `PrismaService | Prisma.TransactionClient`; Decimal→string nos mappers)
- [ ] 2.2 Implementar `RisksController` e presenter preservando 100% dos contratos HTTP de `/api/offers/:offerId/risks/*` (incluindo mensagens de erro pt-BR), com testes de controller preservando as asserções do legado
- [ ] 2.3 Configurar `RisksModule` com injeção por tokens

## 3. Contexto Checks - Domain e Application (`apps/api/src/contexts/checks`)

- [ ] 3.1 Definir porta `ChecksDataQueryPort` (um método por bloco de dados da oferta consumido pelo motor de consistência) com token de DI e barrel `domain/index.ts`
- [ ] 3.2 Implementar `RunOfferChecksUseCase` delegando ao `ConsistencyEngine` de `@lt-offers/calc-engine`, com testes unitários puros cobrindo os três status de health (HEALTHY, WARNINGS_ONLY, CRITICAL_ERRORS)

## 4. Contexto Checks - Infrastructure

- [ ] 4.1 Implementar adaptador `PrismaChecksDataQueryAdapter`
- [ ] 4.2 Implementar `ChecksController` e presenter preservando 100% do envelope HTTP de `/api/offers/:offerId/checks/*` (testes assertam o envelope completo por igualdade — ele alimenta o badge e a navegação por abas na web)
- [ ] 4.3 Configurar `ChecksModule` com injeção por tokens

## 5. Integração, Migração e Validação

- [ ] 5.1 Atualizar `AppModule` para importar `RisksModule` e `ChecksModule` de `contexts/`
- [ ] 5.2 Remover pastas legadas `apps/api/src/risks/` e `apps/api/src/checks/` e conferir com grep que nenhum módulo importa dos caminhos antigos
- [ ] 5.3 Executar `npx nx run-many -t test lint build -p api` (build webpack obrigatório) e `npx nx format:check --all`
