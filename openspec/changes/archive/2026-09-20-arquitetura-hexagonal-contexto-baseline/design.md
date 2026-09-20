# Design - Arquitetura Hexagonal no Contexto Baseline

## Context

`baseline` é a ponte proposta→obra (F7): congela a proposta ganha numa baseline imutável com EAP e curva S, gerencia aditivos que produzem a estimativa corrente, registra avanço físico mensal (earned value) e gera o pacote canônico de integração ERP. É o contexto com mais escrita da série restante: congelamento e aditivos são operações multi-agregado que pedem unit of work (precedente: offers e staking). Depende de `economics` (dados de desembolso/resultado para a curva) e de `auth`/`audit` transversais (guards e interceptor, que permanecem legados).

## Goals / Non-Goals

**Goals:**
- Bounded context `baseline` com escrita transacional via `BaselineUnitOfWork` (congelamento cria baseline + work packages + curva atomicamente; aditivo atualiza baseline e estimativa corrente).
- Imutabilidade da baseline congelada como invariante de domínio (aditivos derivam estimativa corrente, nunca alteram a baseline).
- `GenerateErpPackageUseCase` puro: `generatedAt` chega como parâmetro da borda (padrão RNF-04 consolidado no fix `efecdf8` do wbs-generator).
- Contratos HTTP preservados byte a byte.

**Non-Goals:**
- Não alterar `WbsGenerator`/`EarnedValueCalculator` do motor.
- Não migrar `auth`/`audit` (transversais, avaliação futura); o `AuditInterceptor` global continua cobrindo as rotas.
- Não alterar schema/migrations.

## Decisions

### 1. Unit of work para congelamento e aditivos
`FreezeBaselineUseCase` grava baseline + EAP + curva numa transação; `CreateChangeOrderUseCase` grava aditivo + recalcula estimativa corrente. Repositórios aceitam `PrismaService | Prisma.TransactionClient` (padrão pós-staking) e o unit of work os instancia com `tx`.

### 2. Services legados viram casos de uso, não "services de aplicação"
`erp-integration.service` e `progress-tracking.service` são orquestrações disfarçadas de service: cada um vira caso(s) de uso com portas explícitas. Evita reproduzir dentro do contexto a estratificação service→service que a migração existe para eliminar.

### 3. Imutabilidade da baseline como invariante da entidade
`WorkBaseline` congelada rejeita mutação (exceção tipada de domínio); a estimativa corrente é entidade derivada calculada de baseline + aditivos aprovados. Espelha o padrão de imutabilidade de versões dos catálogos (RNF-05) no domínio de execução.

### 4. (Revisado na implementação) Persistência é em memória — sem Prisma e sem unit of work
Descoberto no apply: os três services legados guardam estado em `Map` com seeds (não existem tabelas de baseline/change-order/progress no schema; a F7 foi entregue como simulação com calculadores reais — Prisma só valida a oferta). O design original previa repositórios Prisma e `BaselineUnitOfWork`; a realidade pede: portas de repositório mantidas (contrato para a futura persistência) com adaptadores **in-memory** que preservam seeds e regras de ID do legado; unit of work ELIMINADO (nada é transacional em memória — quando as tabelas existirem, entra junto com os adaptadores Prisma). Precedente: adaptadores estáticos de taxation/pricing.

### 5. (Revisado na implementação) Imutabilidade da baseline é arquitetural
Não existe operação de mutação de baseline na superfície legada (o CWE deriva estimativas sem tocar a baseline). Em vez de invariante na entidade, a porta `BaselinesRepository` simplesmente NÃO expõe update/delete — a imutabilidade é garantida pela ausência estrutural do caminho de escrita.

### 6. (Revisado na implementação) Auditoria por porta fina e XLSX como adaptador
`AuditTrailPort` (tipo `Omit<AuditEvent,'id'|'timestamp'>` da lib domain) com adaptador delegando ao `AuditService` global — eventos idênticos aos do legado. A geração XLSX do pacote ERP (ExcelJS) move-se como está para `ExcelErpSpreadsheetAdapter` atrás de `ErpSpreadsheetPort` (move-don't-rewrite, precedente do design de export). Relógio resolvido nos controllers e injetado nos casos de uso que carimbam datas (freeze, aditivos, boletins, ERP, ano-base da curva S).

## Risks / Trade-offs

- **Risco**: é o contexto com mais rotas e escrita da série — regressão de contrato tem superfície grande. **Mitigação**: testes de controller preservam as asserções do legado; smoke E2E das jornadas de congelamento no QA.
- **Risco (revisado)**: a série planejada da curva S usa `parseFloat`/aritmética float herdada do legado — preservada de propósito nesta migração (paridade primeiro; refit numérico mudaria números observáveis). DÍVIDA RNF-08 registrada: converter para `DecimalValue` na change de persistência real da baseline, junto com os adaptadores Prisma.
- **Risco**: erros de infraestrutura invisíveis aos testes puros — `npx nx build api` obrigatório na integração.
