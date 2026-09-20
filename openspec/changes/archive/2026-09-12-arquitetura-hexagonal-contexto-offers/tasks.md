## 1. Camada de Domínio (`apps/api/src/contexts/offers/domain/`)

- [x] 1.1 Criar entidades ricas de domínio (`Offer`, `OfferRevision`, `TransmissionLine`, `ScopeMatrixItem`) com validações de invariantes e métodos de fábrica
- [x] 1.2 Definir interfaces e tokens das Portas de Repositório (`OffersRepository`, `OfferRevisionsRepository`) e da Porta Unit of Work (`OffersUnitOfWork`)
- [x] 1.3 Criar exceções tipadas de domínio (`OfferNotFoundException`, `RevisionFrozenException`, `InvalidScopeMatrixException`)

## 2. Camada de Aplicação e Casos de Uso (`apps/api/src/contexts/offers/application/`)

- [x] 2.1 Implementar casos de uso de propostas (`CreateOfferUseCase`, `GetOfferDetailsUseCase`, `UpdateOfferGeneralDataUseCase`, `CloneOfferUseCase`)
- [x] 2.2 Implementar casos de uso de revisões e matriz de escopo (`CreateRevisionUseCase`, `FreezeRevisionUseCase`, `MarkRevisionDeliveredUseCase`, `SaveScopeMatrixUseCase`, `SaveRevisionParametersUseCase`)
- [x] 2.3 Implementar casos de uso de linhas de transmissão (`AddTransmissionLineUseCase`, `UpdateTransmissionLineUseCase`, `DeleteTransmissionLineUseCase`)
- [x] 2.4 Criar testes unitários puros para os casos de uso utilizando repositórios e Unit of Work em memória

## 3. Camada de Infraestrutura e Adaptadores (`apps/api/src/contexts/offers/infrastructure/`)

- [x] 3.1 Implementar `PrismaOfferMapper`, `PrismaOffersRepository`, `PrismaOfferRevisionsRepository` e `PrismaOffersUnitOfWork`
- [x] 3.2 Implementar `OffersController`, DTOs de validação HTTP com `class-validator` e `OfferPresenter`
- [x] 3.3 Configurar `OffersModule` com injeção de dependência por tokens (`Symbol`) e atualizar importações no `AppModule`

## 4. Validação e Não-Regressão

- [x] 4.1 Executar testes da API (`npx nx test api`) e validar 100% de sucesso nos novos casos de uso e controllers
- [x] 4.2 Executar a suíte global de testes do monorepo (`npx nx run-many -t test`) e validar integração E2E com Playwright
