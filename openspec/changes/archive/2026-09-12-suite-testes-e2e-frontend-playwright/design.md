## Context

A aplicação web Angular (`apps/web`) já conta com 321 testes unitários com Vitest e a API NestJS (`apps/api`) possui mais de 510 testes com Jest. No entanto, não havia testes ponta a ponta que executassem a aplicação compilada em um navegador real para validar o fluxo integrado de trabalho do usuário.

Este design estabelece a arquitetura e os padrões para a suíte de testes E2E com **Playwright** no monorepo Nx.

## Goals / Non-Goals

**Goals:**
- Configurar o projeto `apps/web-e2e` com Playwright suportando Chromium, Firefox e WebKit.
- Implementar o padrão Page Object Model (POM) para isolar seletores de interface e garantir testes sustentáveis e legíveis.
- Cobrir as 4 jornadas centrais: Catálogos/Vigência, Pipeline EPC Ponta a Ponta, Governança/Congelamento e Consistência/Riscos.
- Assegurar testes determinísticos e rápidos, com interceptação de rede e suporte a execução no CI.

**Non-Goals:**
- Substituir os testes unitários de componentes Angular existentes (os testes unitários continuam cobrindo casos de borda isolados).
- Executar testes de carga ou estresse de rede (cobertos separadamente pelo benchmark do `calc-engine`).

## Decisions

### 1. Padrão Page Object Model (POM)
- **Decisão**: Toda interação com a interface será encapsulada em classes Page Object sob `apps/web-e2e/src/pages/`:
  - `BasePage`: Métodos utilitários de navegação, detecção de snackbar/toasts e espera de carregamento.
  - `DashboardPage`: Acesso a cartões de KPI e lista de propostas recentes.
  - `CatalogPage`: Criação, versionamento e consulta a histórico de catálogos.
  - `OfferDetailPage`: Gestão de abas, matriz de escopo e congelamento de revisões.
  - `StakingPage`: Tabela de estaqueamento e diálogo PLS-CADD.
  - `ExportPage`: Download e verificação de arquivos `.xlsx`.
- **Alternativa Considerada**: Escrever seletores inline dentro dos arquivos `.spec.ts`. Rejeitada devido ao alto acoplamento e fragilidade diante de refatorações de layout.

### 2. Mocking de API via `page.route` com Fallback Full-Stack
- **Decisão**: Utilizar fixtures com `page.route()` para simular respostas da API durante testes E2E rápidos de interface, mantendo a capacidade de apontar para a API NestJS real em testes de integração de release.
- **Alternativa Considerada**: Exigir banco de dados Postgres e API rodando para qualquer execução de teste E2E. Rejeitada para evitar lentidão e instabilidade no pipeline de CI de pull requests.

### 3. Seletores Semânticos e Resiliência
- **Decisão**: Priorizar seletores por papel (`getByRole`), texto visível em pt-BR e atributos `data-testid` inseridos nos pontos-chave da interface, evitando seletores por classes CSS geradas ou estrutura DOM frágil.

## Risks / Trade-offs

- **[Risco] Flakiness em animações do Angular Material**  
  *Mitigação*: Uso de asserções assíncronas nativas do Playwright com auto-waiting (`await expect(locator).toBeVisible()`) e desativação de animações via CSS quando necessário.
- **[Risco] Download de arquivos binários no navegador headless**  
  *Mitigação*: Uso da API `page.waitForEvent('download')` do Playwright para interceptar e validar o stream de bytes dos arquivos `.xlsx` exportados.
