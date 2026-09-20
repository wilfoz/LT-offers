## Why

A aplicação web Angular e a API NestJS contam com mais de 940 testes unitários e de integração aprovados, mas não possuem uma suíte automatizada de testes ponta a ponta (E2E) que simule a experiência real do usuário em navegadores modernos (Chromium, Firefox, WebKit).

Para garantir que a jornada completa de orçamentação EPC de linhas de transmissão — desde a gestão de catálogos e upload de estaqueamento PLS-CADD até o planejamento de cronograma/histograma e exportação da planilha contratual XLSX do edital — execute com máxima confiabilidade, estabilidade e aderência às regras visuais (RNF-14, RNF-17, RF-01..RF-65), é fundamental introduzir um projeto dedicado de testes E2E com **Playwright** integrado ao monorepo Nx.

## What Changes

- **Criação do Projeto E2E (`apps/web-e2e`)**: Configuração do Playwright com suporte a execução multi-browser (Desktop Chrome, Firefox, Safari/WebKit e Mobile Viewport), gravação de traces, screenshots e relatórios HTML.
- **Padrão Page Object Model (POM)**: Implementação de páginas base (`DashboardPage`, `CatalogPage`, `OfferDetailPage`, `StakingTablePage`, `ScheduleGanttPage`, `ExportPage`) para abstração de seletores e manutenção limpa dos testes.
- **Automação das 4 Jornadas Críticas**:
  1. **Catálogos & Vigências**: Criação, nova versão temporal, consulta ao histórico e validação de imutabilidade (RNF-05).
  2. **Pipeline Completo EPC**: Cadastro de oferta, distribuição preliminar e importação PLS-CADD, visualização de memoriais de fundações/eletromecânica, Gantt, histogramas e download do XLSX.
  3. **Governança & Ciclo de Vida**: Congelamento de revisão (`FROZEN`), bloqueio de edição na UI e consulta de eventos na trilha de auditoria (RF-64).
  4. **Consistência & Riscos**: Simulação de pendências impeditivas, validação de badges em tempo real e cálculo de contingências da matriz de riscos.
- **Comandos no Nx (`package.json`)**: Configuração do target `e2e` para execução local e em pipelines de CI/CD (`npx nx e2e web-e2e`).

## Capabilities

### New Capabilities
- `testes-e2e-jornadas`: Especificação normativa das jornadas de teste ponta a ponta em navegador real para fluxos críticos de orçamentação, governança e exportação contratual.

## Impact

- **Monorepo & Tooling**: Adição das dependências `@playwright/test` no `package.json` e configuração do projeto `apps/web-e2e`.
- **Frontend (`apps/web`)**: Inclusão pontual de atributos semânticos `data-testid` em botões e tabelas críticas para seletores de teste robustos.
- **CI/CD**: Capacidade de rodar testes ponta a ponta headless de forma rápida e determinística com artifacts de diagnóstico visual.
