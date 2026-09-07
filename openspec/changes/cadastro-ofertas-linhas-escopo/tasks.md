# Tasks: cadastro-ofertas-linhas-escopo

## 1. Nomenclatura e modelo de dados

- [x] 1.1 Adicionar os termos de ofertas, revisões, linhas de transmissão e matriz de escopo ao mapa canônico do `README.md` (`Offer`, `OfferRevision`, `TransmissionLine`, `ScopeMatrixItem`, `OfferRevisionStatus`, `ScopeResponsibleParty`), antes de qualquer código.
- [x] 1.2 Modelar no `prisma/schema.prisma` os modelos `Offer`, `OfferRevision`, `TransmissionLine`, `ScopeMatrixItem` e os enums `OfferRevisionStatus` e `ScopeResponsibleParty`, gerar a migration aditiva e confirmar zero drift com `npx prisma migrate diff`.

## 2. Contratos na domain

- [ ] 2.1 Criar `libs/domain/src/lib/offers/offers.ts` (interfaces de oferta, revisão, linha de transmissão com rateio de UFs, itens da matriz de escopo com 4 eixos, payloads de criação/atualização/clonagem e enums), exportando em `@lt-offers/domain`.

## 3. API — Ofertas, Revisões, Linhas e Matriz de Escopo

- [ ] 3.1 Criar DTOs de `offers` com validação de código único, datas ISO, validação de rateio territorial em até 2 UFs somando 100,00% (RN-01), valores decimais monetários/quantitativos ≥ 0 e mensagens em pt-BR.
- [ ] 3.2 Implementar `offers.service/controller/module` com CRUD, transação atômica de criação de revisões com cópia profunda de linhas/escopo, clonagem de proposta com rastreabilidade (RF-06), pré-carga de itens canônicos de escopo e cálculo de pendências (RF-11, RNF-09).
- [ ] 3.3 Implementar testes unitários e de integração no `apps/api` cobrindo todos os cenários do spec de ofertas.

## 4. Web — Gestão de Ofertas

- [ ] 4.1 Implementar `OffersApi` no `apps/web/src/app/offers/offers-api.service.ts`.
- [ ] 4.2 Implementar `offer-list.component` com busca, tabela densa, totalizador de linhas/km, badges de revisão/status e sinalização de pendências.
- [ ] 4.3 Implementar `offer-form.component` no padrão Swiss / Material 3 para cadastro e edição dos dados gerais e financeiros da oferta.
- [ ] 4.4 Implementar `offer-detail.component` com gestão de revisões imutáveis, tabela/formulário de linhas de transmissão (`TransmissionLine`) com validação de rateio de UFs e editor em grade da matriz de responsabilidade com os 4 eixos.
- [ ] 4.5 Implementar testes de componentes cobrindo criação, edição, validação de UFs, clonagem e bloqueio de edição em revisões fechadas.

## 5. Integração e verificação

- [ ] 5.1 Registrar rotas lazy em `app.routes.ts` e adicionar item no topo do menu de navegação da casca (`app.ts`), atualizando testes de rota e navegação em `app.spec.ts`.
- [ ] 5.2 Executar verificação integrada (`npx nx run-many -t test lint -p api web domain calc-engine`, `npx nx format:check --all` e `npx prisma migrate status`).
