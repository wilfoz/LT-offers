# Design - Arquitetura Hexagonal no Contexto Economics

## Context

`service-budget`, `economic-result` e `cashflow` são consumidores do mesmo grafo de dados (orçamento → venda → desembolso) e foram especificados e entregues como uma fase única (F5, change servicos-resultado-economico-desembolso). Dois deles são dependência direta de `export` e `baseline`. Migrá-los como três contextos separados criaria três fachadas e três fronteiras para uma cadeia que o domínio trata como uma só.

## Goals / Non-Goals

**Goals:**
- Um bounded context `economics` com três agregados, uma fachada e um módulo NestJS.
- Casos de uso puros; regras de mascaramento por papel (viewer não vê margem — RF do M10) testadas no domínio, não no controller.
- `export` e `baseline` passam a consumir `EconomicsFacadeService` — nenhum import de service entre módulos legados e contexto.
- Contratos HTTP intactos, incluindo mascaramento e mensagens pt-BR.

**Non-Goals:**
- Não migrar `export` nem `baseline` (changes próprias na sequência); apenas religar seus imports.
- Não alterar cálculo no motor (`service-budget-calculator`, `economic-result-calculator`, `cashflow-calculator`).
- Não alterar schema/migrations.

## Decisions

### 1. Um contexto, três agregados (não três contextos)
Divergência deliberada do padrão "um módulo legado = um contexto": a cadeia orçamento→resultado→desembolso compartilha entidades (venda total, curvas mensais) e consumidores. Três controllers e três grupos de use cases preservam a organização externa; a fronteira única elimina fachadas intermediárias. Critério de reversão: se um agregado ganhar ciclo de vida próprio (ex.: desembolso com persistência de cenários), extrai-se para contexto irmão em change futura.

### 2. Mascaramento por papel como regra de domínio
O mascaramento do resultado econômico (papel sem permissão vê valores ocultados) hoje vive no service. Vira função pura no domínio do contexto (`maskEconomicResult(result, role)`), com testes diretos — controllers apenas repassam o papel resolvido pelo guard de `auth` (que permanece módulo transversal legado, fora desta change).

### 3. Fachada única com superfície mínima
`EconomicsFacadeService` expõe somente o que `export` e `baseline` consomem hoje (dados de cashflow para planilha e curva; resultado consolidado para baseline). Métodos novos só entram quando um consumidor os exigir — superfície da fachada é contrato, não conveniência.

## Risks / Trade-offs

- **Risco**: religar `export`/`baseline` sem migrá-los mistura estilos temporariamente (legado importando fachada de contexto). Aceito: é o mesmo estado intermediário que `pricing`→`FoundationsFacadeService` atravessou sem incidentes.
- **Risco**: o contexto é o maior da série até aqui (~1130 linhas legadas + cerimônia). **Mitigação**: os três grupos de tasks são independentes entre si após o domínio comum (1.x), permitindo revisão por agregado.
- **Risco**: build webpack como único detector de erros de infraestrutura — `npx nx build api` obrigatório na integração.
