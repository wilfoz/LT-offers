# Tasks: estaqueamento-dados-torres

## 1. Nomenclatura e modelo de dados

- [x] 1.1 Adicionar os termos de estaqueamento e dados por torre ao mapa canônico do `README.md` (`StakingTower`, `stationMeters`, `bodyExtensionMeters`, `deflectionAngleDeg`, `lateralOffsetMeters`, `utmEast`, `utmNorth`, `elevationMeters`, `AccessDifficulty`, `PreliminaryStakingDistribution`), antes de qualquer código.
- [x] 1.2 Modelar no `prisma/schema.prisma` a entidade `StakingTower` vinculada a `TransmissionLine` e `PreliminaryStakingDistribution`, gerar a migration aditiva e confirmar zero drift com `npx prisma migrate diff`.

## 2. Contratos na domain

- [x] 2.1 Criar `libs/domain/src/lib/staking/staking.ts` com interfaces de `StakingTower`, enum `AccessDifficulty`, DTOs de importação/preview PLS-CADD, payloads de atribuição em lote (`BatchAssignStakingPayload`) e distribuição paramétrica preliminar, exportando em `@lt-offers/domain`.

## 3. Backend API — Estaqueamento e Importador PLS-CADD

- [x] 3.1 Implementar utilitário/parser de arquivo PLS-CADD (CSV/XLSX) com mapeamento flexível de cabeçalhos e validação estrita de dados/duplicidades (RF-18, RNF-10).
- [x] 3.2 Implementar `staking.service/controller/module` com listagem paginada (RNF-02), preview de importação, gravação/reimportação incremental com preservação de solos (RF-22), atribuição em lote (RF-19), distribuição paramétrica preliminar (RF-21) e validação de integridade contra a matriz de volumes de fundação (RF-20, RN-13).
- [x] 3.3 Implementar testes unitários e de integração no `apps/api` cobrindo parser, validações, paginação, reimportação e integridade.

## 4. Frontend Web — Gestão e Visualização de Estaqueamento

- [x] 4.1 Implementar `StakingApi` no `apps/web/src/app/offers/staking-api.service.ts`.
- [x] 4.2 Implementar componente de tabela paginada de estaqueamento com busca por torre, filtros por estaca/solo/fundação/acesso e ações em lote (RF-19, RNF-02).
- [x] 4.3 Implementar modal/assistente de importação PLS-CADD com upload de arquivo, pré-visualização de linhas/erros e resumo do diff na reimportação (RF-18, RF-22).
- [x] 4.4 Implementar formulário/aba de distribuição paramétrica percentual preliminar com validação de soma 100% (RF-21).
- [x] 4.5 Implementar testes de componentes web cobrindo paginação, filtros, upload e validação de rateio.

## 5. Integração e verificação

- [ ] 5.1 Integrar a aba de Estaqueamento no detalhe da linha em `offer-detail.component.ts` e registrar rotas e atalhos.
- [ ] 5.2 Executar verificação integrada (`npx nx run-many -t test lint -p api web domain calc-engine`, `npx nx format:check --all` e `npx prisma migrate status`).
