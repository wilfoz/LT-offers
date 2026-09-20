## Context

O contexto de Fundações e Escavações (`M03`, Fase `F3`) calcula quantitativos de escavação, reaterro compactado, concreto estrutural, armação de aço, estacas e formas para linhas de transmissão, além de validações geotécnicas de integridade e rastreabilidade item a item (RF-12..RF-17, RF-20, RF-27, RN-05, RN-06).

Após a migração bem-sucedida de `offers`, `catalogs` e `staking` para a Arquitetura Hexagonal, `foundations` é o próximo contexto na cadeia de dependências, sendo alimentado por catálogos (matrizes de volume) e estaqueamento (torres ou distribuição preliminar), e alimentando o contexto de `pricing` (precificação de materiais de fundação).

## Goals / Non-Goals

**Goals:**
- Estruturar o bounded context `foundations` em `apps/api/src/contexts/foundations/` com as três camadas clássicas: `domain/`, `application/` e `infrastructure/`.
- Isolar portas de domínio com tokens de DI:
  - `LineFoundationsQueryPort` (`LINE_FOUNDATIONS_QUERY_PORT_TOKEN`): consulta dados da linha, torres cadastradas ou distribuição preliminar.
  - `FoundationVolumeMatricesQueryPort` (`FOUNDATION_VOLUME_MATRICES_QUERY_PORT_TOKEN`): consulta matrizes de volume de fundação vigentes no catálogo.
- Criar casos de uso independentes e testáveis na camada de aplicação:
  - `CalculateLineFoundationsUseCase`: orquestração do cálculo completo delegando ao motor puro `@lt-offers/calc-engine`.
  - `GetLineFoundationSummaryUseCase`: resumo executivo de KPIs e materiais de fundação.
  - `GetLineFoundationTraceabilityUseCase`: rastreabilidade e memória de cálculo detalhada item a item (RF-27).
  - `GetLineFoundationValidationUseCase`: diagnóstico de inconsistências e combinações não cadastradas (RF-20).
- Implementar adaptadores Prisma (`PrismaLineFoundationsQueryAdapter`, `PrismaFoundationVolumeMatricesQueryAdapter`).
- Implementar adaptadores HTTP (`FoundationsController` e `FoundationsPresenter`) preservando 100% de paridade de contratos das rotas `/api/lines/:lineId/foundations/*`.
- Fornecer serviço/facade ou exportação de casos de uso para consumo transparente pelo `PricingModule`.
- Remover o diretório legado `apps/api/src/foundations/` e atualizar referências em `AppModule` e `PricingModule`.

**Non-Goals:**
- Não alterar as fórmulas ou regras de cálculo implementadas na lib pura `@lt-offers/calc-engine`.
- Não alterar migrations, tabelas ou schema do Prisma.
- Não alterar contratos de API expostos ao frontend ou testes E2E do Playwright.

## Decisions

### 1. Separação Estrita de Portas Secundárias de Consulta
- **Decisão**: Dividir o acesso a dados em duas portas dirigidas de consulta:
  1. `LineFoundationsQueryPort`: responsável por carregar os dados de estaqueamento e distribuição preliminar da linha.
  2. `FoundationVolumeMatricesQueryPort`: responsável por carregar matrizes ativas e suas versões vigentes de volume de fundação.
- **Racional**: Garante coesão e responsabilidade única, permitindo que a camada de aplicação seja testada com dados controlados sem acoplamento com o Prisma.
- **Alternativas consideradas**: Uma única porta monolítica agregando linha e catálogos (rejeitada por ferir o princípio da segregação de interfaces).

### 2. Orquestração e Execução de Cálculo no Use Case
- **Decisão**: O caso de uso `CalculateLineFoundationsUseCase` carrega os dados através das portas, monta o `FoundationCalculationInput` (com suporte a estaqueamento executivo ou distribuição preliminar paramétrica RN-06) e invoca a função pura `calculateLineFoundations` de `@lt-offers/calc-engine`.
- **Racional**: Mantém a regra de negócio matemática na biblioteca pura compartilhada (RNF-16) enquanto a camada de aplicação cuida do fluxo de orquestração e tratamento de ausência de dados (RNF-09).
- **Alternativas consideradas**: Recriar o cálculo dentro do NestJS (rejeitada, violando RNF-16 e determinismo numérico).

### 3. Integração com Consumidores Internos (`PricingModule`)
- **Decisão**: `FoundationsModule` exportará os casos de uso e registrará um `FoundationsFacadeService` ou os próprios Use Cases diretamente para injeção no `PricingService`, mantendo total desacoplamento.
- **Racional**: Permite que o módulo de precificação obtenha os quantitativos consolidados de fundações sem acoplamento com a infraestrutura HTTP ou acesso direto ao banco.

### 4. Presenter e Preservação dos Contratos HTTP
- **Decisão**: `FoundationsPresenter` cuidará da formatação de saída para os endpoints HTTP em `infrastructure/http/`.
- **Racional**: Isola detalhes de serialização HTTP, assegurando paridade com o frontend e testes existentes.

## Risks / Trade-offs

- **[Risco]** Quebra de injeção de dependência no `PricingModule` ao remover `apps/api/src/foundations/foundations.service.ts`.
  → **Mitigação**: Atualizar `pricing.module.ts` e `pricing.service.ts` para injetar os casos de uso/facade de `contexts/foundations`, e validar com a suíte de testes unitários do pricing (`nx test api`).

- **[Risco]** Divergência de formato nos campos de KPIs ou rastreabilidade.
  → **Mitigação**: Testes unitários do controller e presenter validando os tipos `LineFoundationSummary`, `FoundationTraceabilityItem` e `MissingFoundationCombination`.
