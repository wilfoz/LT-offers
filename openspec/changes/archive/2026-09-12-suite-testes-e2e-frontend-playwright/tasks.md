## 1. Configuração e Estrutura do Projeto E2E (Playwright)

- [x] 1.1 Configurar dependências do Playwright no `package.json` e criar `playwright.config.ts` no projeto `apps/web-e2e`
- [x] 1.2 Configurar target `e2e` no `apps/web-e2e/project.json` e registrar projeto no workspace Nx

## 2. Implementação das Classes Page Object Model (POM)

- [x] 2.1 Criar `BasePage` em `apps/web-e2e/src/pages/base.page.ts` com utilitários de navegação, espera e captura de feedback
- [x] 2.2 Criar `CatalogPage` em `apps/web-e2e/src/pages/catalog.page.ts` para interação com listagens, formulários e histórico de versões
- [x] 2.3 Criar `OfferDetailPage` e `StakingPage` em `apps/web-e2e/src/pages/` para navegação em abas, matriz de escopo e estaqueamento
- [x] 2.4 Criar `ExportPage` em `apps/web-e2e/src/pages/export.page.ts` para download e validação de relatórios XLSX

## 3. Implementação das 4 Suítes de Testes E2E

- [x] 3.1 Implementar suíte de testes de Catálogos e Vigência Temporal em `apps/web-e2e/src/e2e/01-catalogs-lifecycle.spec.ts`
- [x] 3.2 Implementar suíte de testes do Pipeline Completo EPC de Proposta em `apps/web-e2e/src/e2e/02-offer-epc-full-pipeline.spec.ts`
- [x] 3.3 Implementar suíte de testes de Governança e Congelamento de Revisão em `apps/web-e2e/src/e2e/03-rbac-and-revision-freeze.spec.ts`
- [x] 3.4 Implementar suíte de testes do Painel de Consistência e Riscos em `apps/web-e2e/src/e2e/04-consistency-checks-and-risks.spec.ts`

## 4. Validação e Execução da Suíte

- [x] 4.1 Executar a suíte de testes E2E com Playwright e verificar geração de relatórios
- [x] 4.2 Executar a suíte global de testes do monorepo (`npx nx run-many -t test`) e garantir 100% de integridade
