## 1. Domínio & Contratos de Execução (libs/domain)

- [x] 1.1 Criar interfaces e tipos para Linha de Base da Obra (`WorkBaseline`, `WorkPackageItem`, `BaselineStatus`, etc.)
- [x] 1.2 Criar interfaces e tipos para Apontamento de Medições e Curva S (`MonthlyProgressRecord`, `EarnedValueMetrics`, `PhysicalProgressItem`, etc.)
- [x] 1.3 Criar interfaces e tipos para Gestão de Aditivos & Pleitos (`ContractChangeOrder`, `ChangeOrderType`, `ChangeOrderStatus`, `CurrentWorkingEstimate`, etc.)
- [x] 1.4 Criar interfaces para Pacote de Integração ERP (`ErpIntegrationPackage`, `ErpAccountMapping`, `ErpScheduleEntry`, etc.)
- [x] 1.5 Atualizar tipos de status de revisão de oferta (`WON`, `IN_EXECUTION`) e exportar novos contratos no index do domínio

## 2. Motor de Cálculo Puro: Valor Agregado, Aditivos e Curva S (libs/calc-engine)

- [x] 2.1 Implementar `EarnedValueCalculator` com cálculo de $PV$, $EV$, $AC$, $SV$, $CV$, $SPI$, $CPI$ utilizando aritmética `DecimalValue`
- [x] 2.2 Implementar `ChangeOrderCalculator` para cálculo de deltas contratuais e consolidação da estimativa corrente ($CWE = \text{Baseline} + \sum \text{Aditivos Aprovados}$)
- [x] 2.3 Implementar mapeador e gerador de EAP hierárquica e contas gerenciais a partir dos resultados da proposta (CIP, indiretos, fundações, montagem)
- [x] 2.4 Criar suíte de testes unitários para `EarnedValueCalculator` e `ChangeOrderCalculator` cobrindo cenários nominais, atrasos, sobrecustos e limites

## 3. Camada de Backend, Serviços de Negócio & Endpoints REST (apps/api)

- [x] 3.1 Implementar `BaselineService` com congelamento imutável de Data 0 na marcação de proposta `WON`, persistência de EAP e recuperação de baseline
- [x] 3.2 Implementar `ProgressTrackingService` para registro mensal de avanço físico e faturamento medido com integração ao motor de Curva S e auditoria
- [x] 3.3 Implementar `ChangeOrderService` para criação, aprovação e projeção de aditivos com memorial de cálculo do CWE
- [x] 3.4 Implementar `ErpIntegrationService` com geração de pacote de carga estruturado em JSON e planilha XLSX para ERPs (SAP, TOTVS, Mega)
- [x] 3.5 Criar `BaselineController` com rotas REST e documentação Swagger, registrando o `BaselineModule` na aplicação NestJS
- [x] 3.6 Criar testes unitários para `BaselineService`, `ProgressTrackingService`, `ChangeOrderService`, `ErpIntegrationService` e `BaselineController`

## 4. Interface de Usuário Reativa & Acompanhamento de Obra (apps/web)

- [x] 4.1 Criar `BaselineApiService` no frontend Angular para comunicação com os endpoints de baseline, curva S, medições, aditivos e ERP
- [x] 4.2 Desenvolver componente `WorkTrackingComponent` e integrar na navegação e visão de detalhes da oferta com KPIs executivos ($SPI, CPI, SV, CV$)
- [x] 4.3 Implementar visualização interativa de Curva S (Previsto vs. Agregado vs. Realizado) e painel de indicadores de desempenho
- [x] 4.4 Implementar formulário e modal de apontamento de boletim de medição mensal e cadastro de aditivos/pleitos (*Change Orders*)
- [x] 4.5 Implementar funcionalidade de download do pacote de integração ERP (JSON e XLSX)
- [x] 4.6 Criar testes unitários no frontend com Vitest para os novos componentes e serviços de acompanhamento de obra

## 5. Validação Global & Aceite

- [x] 5.1 Executar a suíte completa de testes do monorepo (`nx run-many -t test --skip-nx-cache`)
- [x] 5.2 Validar conformidade das especificações com `openspec validate --all`
