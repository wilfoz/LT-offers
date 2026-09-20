# Design - Arquitetura Hexagonal nos Contextos Schedule e Histogram

## Context

O `schedule` monta o cronograma físico por linha (atividades encadeadas, produtividades calibradas por fatores de campo, precipitação mensal) e o plano de canteiros; o `histogram` deriva perfis mensais de recursos por linha e o consolidado da oferta a partir do cronograma. O acoplamento atual é import direto de service (`histogram → ../schedule`). Ambos delegam as regras ao motor puro — os services são orquestração + acesso a dados, o formato ideal para portas.

## Goals / Non-Goals

**Goals:**
- Dois bounded contexts em `contexts/schedule/` e `contexts/histogram/`, com a dependência histogram→schedule expressa via `ScheduleFacadeService`.
- Casos de uso puros e testáveis com dublês de porta em memória.
- Contratos HTTP preservados byte a byte, incluindo os envelopes consumidos pela aba de cronograma/Gantt e histogramas da web.

**Non-Goals:**
- Não alterar cálculo de precipitação, produtividades ou fatores de campo (`field-factors` permanece módulo legado nesta change; o contexto schedule continua consumindo seus dados via porta de consulta Prisma).
- Não alterar schema/migrations.

## Decisions

### 1. Histogram como contexto separado, dependente por fachada
O histograma tem consumidores e rotas próprias (por linha e consolidado por oferta) e agrega dados de várias linhas — não é um sub-recurso do cronograma. A dependência vira `ScheduleFacadeService` exportada pelo `ScheduleModule`, espelhando o precedente foundations→pricing.

### 2. Datas e precipitação continuam parametrizadas
O motor recebe datas como parâmetro (RNF-04, regra de lint ativa em calc-engine); os casos de uso repassam datas resolvidas na borda (controller) — nenhuma leitura de relógio nas camadas internas. A resolução de "hoje" segue o padrão civil-date estabelecido no piloto de catálogos.

### 3. Fatores de campo entram por porta de consulta, não por import de módulo
`schedule` hoje lê parâmetros de engenharia de campo persistidos (change calibracao-produtividades). O contexto novo consulta esses dados por `ScheduleDataQueryPort` (adaptador Prisma), sem importar o `FieldFactorsModule` — mantém o módulo legado fora da fronteira do contexto até sua eventual migração.

## Risks / Trade-offs

- **Risco**: o consolidado da oferta itera múltiplas linhas — regressão de N+1 no adaptador Prisma passaria despercebida em testes puros. **Mitigação**: preservar as queries agregadas do service legado no adaptador (fiação, não reescrita).
- **Risco**: erros de import/tipagem da infraestrutura só aparecem no build webpack. **Mitigação**: `npx nx build api` obrigatório no grupo de integração.
