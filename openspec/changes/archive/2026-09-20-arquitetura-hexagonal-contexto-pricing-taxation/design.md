# Design - Arquitetura Hexagonal nos Contextos Pricing e Taxation

## Context

O `pricing` calcula a precificação de materiais por linha (cotações, commodities, DIFAL/FECOEP) delegando as regras ao motor puro `@lt-offers/calc-engine`; o `taxation` serve as tabelas tributárias por UF que alimentam esse cálculo. Hoje `pricing.service.ts` mistura três estilos: fachada hexagonal (`FoundationsFacadeService`), serviço legado (`TaxTablesService`) e Prisma direto. Esta change fecha a fronteira: os dois contextos migram juntos e a dependência vira porta.

## Goals / Non-Goals

**Goals:**
- Dois bounded contexts independentes em `contexts/taxation/` e `contexts/pricing/`, cada um com `domain/`, `application/` e `infrastructure/`.
- `pricing` consome `taxation` exclusivamente via `TaxationFacadeService` (mesmo padrão `FoundationsFacadeService` provado na change de foundations).
- Casos de uso com testes puros (dublês de porta em memória), sem banco.
- Contratos HTTP preservados byte a byte (rotas, envelopes, mensagens pt-BR).

**Non-Goals:**
- Não alterar fórmulas do motor (`material-pricing-calculator`, `commodity-calculator`).
- Não alterar schema/migrations do Prisma.
- Não migrar a exibição de preços na web.

## Decisions

### 1. Taxation primeiro, como contexto próprio (não pasta interna de pricing)
As tabelas tributárias têm ciclo de vida e consumidores próprios (rotas `/api/taxation/*` usadas pela web; futuras integrações). Fundir dentro de `pricing` esconderia essa fronteira. A ordem de implementação é taxation → pricing, porque o segundo injeta a fachada do primeiro.

### 2. Fachadas como contrato interno entre contextos
`TaxationFacadeService` expõe apenas o que `pricing` precisa (mapas de regras por UF), tipado contra o domínio de taxation. Precedente: `FoundationsFacadeService` consumido por `pricing` desde a change de foundations. Módulos NestJS exportam a fachada, nunca repositórios ou adaptadores.

### 3. Repositórios Prisma aceitam `PrismaService | Prisma.TransactionClient`
Padrão consolidado na correção pós-staking (commit `efecdf8`-adjacente): construtores de repositório aceitam o client transacional para composição futura com unit of work, mesmo quando a change não exige transações.

### 4. Serialização preserva o contrato legado
Onde há `Prisma.Decimal` (dados de linha no pricing), os mappers convertem com `.toString()` e datas com `.toISOString()`, nunca expondo linhas cruas (RNF-08). As tabelas tributárias, porém, expõem alíquotas como number no JSON — é o contrato aprovado da F3 e a preservação de contrato prevalece sobre uniformização.

### 5. (Revisado na implementação) Taxation não tem Prisma — adaptador estático
As tabelas legadas (UFs/FECOEP, IPI por NCM) vivem em código, não no banco. A porta `TaxRulesQueryPort` fornece as tabelas brutas via `StaticTaxTablesAdapter` (infraestrutura), e a derivação (matriz de ICMS interestadual, PIS/COFINS por regime) vira função pura de domínio (`buildIcmsRulesMap`, `resolvePisCofinsRule`). Quando as tabelas migrarem para o banco, só o adaptador muda. O mesmo vale para as cotações default do pricing (estáticas → `StaticQuotesAdapter`).

## Risks / Trade-offs

- **Risco**: os testes puros não importam a infraestrutura Prisma — erros de import/tipagem só aparecem no build webpack. **Mitigação**: `npx nx build api` é passo obrigatório do grupo de integração (lição da revisão pós-migração dos 4 primeiros contextos).
- **Trade-off**: dois contextos numa change aumenta o diff, mas elimina o estado intermediário em que `pricing` hexagonal importaria um `taxation` legado.
