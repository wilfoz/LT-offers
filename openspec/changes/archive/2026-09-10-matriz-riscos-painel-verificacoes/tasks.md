## 1. Domain Models & Contracts (libs/domain)

- [x] 1.1 Adicionar modelos de dados para itens de risco (`RiskItem`, `RiskCategory`, `RiskAssessment`, `RiskTreatment`) em `libs/domain`
- [x] 1.2 Adicionar modelos de dados para diagnósticos de integridade (`ConsistencyCheck`, `CheckSeverity`, `CheckModule`, `CheckFinding`, `OfferHealthSummary`) em `libs/domain`
- [x] 1.3 Exportar os novos tipos e contratos no ponto de entrada `libs/domain/src/index.ts`

## 2. Motor de Cálculo & Regras de Negócio (libs/calc-engine)

- [x] 2.1 Implementar `RiskCalculator` com cálculo determinístico de severidade ponderada ($R\$ = \text{Impacto} \times \text{Probabilidade}$) e totalização por linha e lote
- [x] 2.2 Integrar a contingência calculada da Matriz de Riscos ao `EconomicResultCalculator` e ao Quadro de Coeficientes $K$ (BDI)
- [x] 2.3 Implementar `ConsistencyEngine` com a bateria completa de verificações cruzadas (estaqueamento, suprimentos/tributos, cronograma, histograma/canteiros, serviços e desembolso)
- [x] 2.4 Adicionar suite de testes unitários em `libs/calc-engine` para `RiskCalculator`, `ConsistencyEngine` e integração com BDI

## 3. Backend API (apps/api)

- [x] 3.1 Implementar `RisksService` e `RisksController` no NestJS para gerenciamento e cálculo da Matriz de Riscos da oferta
- [x] 3.2 Implementar `ChecksService` e `ChecksController` no NestJS para execução de diagnósticos e retorno do sumário de saúde da oferta
- [x] 3.3 Implementar validação impeditiva de fechamento de revisão em `OffersService` com bloqueio por pendências críticas (RF-63)
- [x] 3.4 Adicionar testes automatizados para os endpoints de riscos, verificações e fechamento de revisão

## 4. Frontend Angular (apps/web)

- [x] 4.1 Implementar `OfferRisksComponent` com tabela analítica de riscos, cadastro de incertezas, badges de categoria e seletor de contingência no BDI
- [x] 4.2 Implementar `OfferChecksComponent` com painel RAG de saúde da proposta, contadores de severidade e links diretos (*deep linking*) para os campos pendentes
- [x] 4.3 Integrar indicador de status de saúde (`HealthStatusBadge`) ao cabeçalho da oferta e registrar novas abas no `OfferDetailComponent`

## 5. Validação & Aceite

- [x] 5.1 Executar bateria completa de testes unitários e de integração no monorepo Nx
- [x] 5.2 Validar conformidade das regras RF-61, RF-62, RF-63, RF-55 e RNF-09
